import * as md5 from 'md5';
import * as randomString from 'randomstring';
import { bufferToHex } from 'ethereumjs-util';
import { Request, Response } from 'express';
import { recoverPersonalSignature } from 'eth-sig-util';
import { Users, Sessions, Permissions, LoginHistories} from '../../models';
import {
    ObjectId,
    getIPAddress,
    signAccessToken
} from '../base';
import { sign } from 'tweetnacl';
import { decode } from 'bs58';
import io from '../../socket';
import socket from '../../socket';
import { generateHash, getRandomFourDigitNumber, getRandomFourSixNumber } from '../../util/random';

const userInfo = (user: any) => {
    return {
        email: user.email,
        username: user.username,
        balance: user.balance,
        avatar: user.avatar,
        iReferral: user.iReferral
    };
};

export const signin = async (req: Request, res: Response) => {
    const { password, email } = req.body;

    const user = await Users.findOne({
        $or: [
            {
                username: email.toLowerCase(),
            },
            {
                email: email.toLowerCase()
            }
        ]
    });
    if (!user) {
        // checkLimiter(req, res);
        return res.status(400).json(`We can't find with this email or username.`);
    } else if (!user.validPassword(password, user.password)) {
        // checkLimiter(req, res);
        return res.status(400).json('Passwords do not match.');
    } else if (!user.status) {
        // checkLimiter(req, res);
        return res.status(400).json('Account has been blocked.');
    } else {
        const session = signAccessToken(req, res, user._id);
        const LoginHistory = new LoginHistories({
            userId: user._id,
            ...session,
            data: req.body
        });
        await LoginHistory.save();
        await Sessions.updateOne({ userId: user._id }, session, {
            new: true,
            upsert: true
        });
        const userData = userInfo(user);
        const sessionData = {
            accessToken: session.accessToken,
            refreshToken: session.refreshToken
        };
        // await usernameLimiter.delete(email);
        return res.json({data: {
            status: true,
            session: sessionData,
            user: userData,
        }});
    }
};

export const signup = async (req: Request, res: Response) => {
    try {
        const user = req.body;

        const ip = getIPAddress(req);
        // const ipCount = await Users.countDocuments({ ip: { '$regex': ip.ip, '$options': 'i' } })
        // if (ipCount > 1) {
        //     return res.status(400).json(`Account limited.`)
        // }
        const emailExists = await Users.findOne({
            email: user.email.toLowerCase(),
            verified: true
        });
        if (emailExists) {
            return res.status(400).json(`${user.email} is used by another account.`);
        }
        const usernameExists = await Users.findOne({
            username: user.username.toLowerCase(),
            verified: true
        });
        if (usernameExists) {
            return res.status(400).json(`An account named '${user.username}' already exists.`);
        }

        const verifyCode = getRandomFourDigitNumber();

        const iReferral = getRandomFourSixNumber();
        let newuser = { ...user, ...ip, iReferral };
        const permission = await Permissions.findOne({ title: 'player' });

        newuser.password = generateHash(user.password);
        newuser.permissionId = permission._id;
        newuser.status = true;
        newuser.verifyCode = verifyCode;
        newuser.verified = false;

        const u_result = await Users.findOneAndUpdate({
            email: user.email.toLowerCase(),
        }, {...newuser}, { upsert: true, new: true });

        console.log(u_result);

        if (!u_result) {
            return res.status(400).json('error');
        } else {
            return res.json({data : 'You have been successfully registered as player.'});
        }
    } catch (e) {
        console.log("===error===")
        console.log(req.body)
        console.log(e)
    }
};

export const verifyCode = async (req: Request, res: Response) => {
    try {
        const verifyInfo = req.body;

        const userInfo = await Users.findOne({
            email: { $regex: new RegExp('^' + verifyInfo.email.toLowerCase(), 'i') }
        });
        if (userInfo) {
            const code = userInfo.verifyCode;

            if(code == verifyInfo.code) {
                await Users.findOneAndUpdate(
                    { email: { $regex: new RegExp('^' + verifyInfo.email.toLowerCase(), 'i') } },
                    {
                        verified: true
                    },
                    { upsert: true, new: true }
                );
                return res.json({success: true, data : 'Success on verify email'});
            } else {
                return res.json({success: false, err : 'Code is not correct'});
            }
        } else {
            return res.json({success: false, err : 'Not registered user'});
        }
    } catch (e) {
        console.log("===error===")
        console.log(req.body)
        console.log(e)
    }
};

export const signout = async (req: Request, res: Response) => {
    const { userId } = req.body;
    const result = await Sessions.deleteMany({ userId });
    res.json(result);
};

export const checkAddress = async (req: Request, res: Response) => {
    const { publicAddress } = req.body;
    const user = await Users.findOne({
        publicAddress: {
            $regex: new RegExp('^' + publicAddress.toLowerCase(), 'i')
        }
    });
    if (!user) {
        return res.json({ status: false, message: `Please sign up first.` });
    } else if (!user.status) {
        return res.status(400).json('Account has been blocked.');
    }
    return res.json({
        status: true,
        user: { publicAddress: user.publicAddress, nonce: user.nonce }
    });
};

export const changePassword = async (req: Request, res: Response) => {
    const { userId } = req.body;
    const user = await Users.findById(ObjectId(userId));
    if (!user.validPassword(req.body['Current Password'], user.password)) {
        return res.status(400).json('Passwords do not match.');
    }
    const password = user.generateHash(req.body['New Password']);
    const result = await Users.findOneAndUpdate({ _id: ObjectId(userId), status: true }, { password }, { new: true });
    if (result) {
        return res.json('Success!');
    } else {
        return res.status(400).json('Server error.');
    }
};


export const passwordReset = async (req: Request, res: Response) => {
    const { userId, token, password } = req.body;
    const user = await Users.findById(userId);
    if (!user) return res.status(400).json('invalid link or expired');
    const sessions = await Sessions.findOne({
        userId: user._id,
        passwordToken: token
    });
    if (!sessions) return res.status(400).json('Invalid link or expired');
    user.password = user.generateHash(password);
    await user.save();
    await sessions.delete();
    return res.json('password reset sucessfully.');
};
