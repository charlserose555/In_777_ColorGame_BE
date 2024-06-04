import * as md5 from 'md5';
import * as randomString from 'randomstring';
import { bufferToHex } from 'ethereumjs-util';
import { Request, Response } from 'express';
import { recoverPersonalSignature } from 'eth-sig-util';
import { Users, Sessions, Permissions, LoginHistories, Bonus, PaymentSetting, BankCard, DepositOrder, adminUPI, WithDrawalOrder, BonusApplyHistory} from '../../models';
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

export const userInfo = (user: any) => {
    return {
        email: user.email,
        username: user.username,
        balance: Number(user.balance).toFixed(2),
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

        console.log("user", user);

        const ip = getIPAddress(req);
        // const ipCount = await Users.countDocuments({ ip: { '$regex': ip.ip, '$options': 'i' } })
        // if (ipCount > 1) {
        //     return res.status(400).json(`Account limited.`)
        // }
        const emailExists = await Users.findOne({
            email: user.email.toLowerCase(),
        });
        if (emailExists) {
            return res.status(400).json(`${user.email} is used by another account.`);
        }
        const usernameExists = await Users.findOne({
            username: user.username.toLowerCase(),
        });
        if (usernameExists) {
            return res.status(400).json(`An account named '${user.username}' already exists.`);
        }

        const verifyCode = getRandomFourDigitNumber();


        // let sameIpUser = await Users.findOne({ip : ip.ip, rReferral: user.rReferral ? user.rReferral : 0});
        // if(sameIpUser) {
        //     return res.status(400).json(`Invalid request is detected`);
        // }

        let newuser = { ...user, ...ip};

        newuser.password = generateHash(user.password);
        newuser.permissionId = "player";
        newuser.status = true;
        newuser.verifyCode = verifyCode;
        newuser.verified = false;
        newuser.rReferral = newuser.rReferral ? newuser.rReferral : 0;

        let u_result = await new Users(newuser).save();

        console.log(u_result);

        await new Bonus({email: newuser.email}).save();

        if(u_result.rReferral != 0) {
            const userLevel_1 = await Users.findOne({'iReferral' : newuser.rReferral});
            console.log("userLevel_1.email", userLevel_1.email)

            await Bonus.findOneAndUpdate({email : userLevel_1.email}, { $addToSet: { 'level1_users': newuser.email }})

            const level_1_Code = userLevel_1.rReferral;
            let level_2_email = "";
            if(level_1_Code != 0) {
                const userLevel_2 = await Users.findOne({'iReferral' : level_1_Code});
                level_2_email = userLevel_2.email;

                await Bonus.findOneAndUpdate({email : level_2_email}, { $addToSet: { 'level2_users': newuser.email }})
            }
        }

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

export const getVIPLevelInfo =  async (req: Request, res: Response) => {
    console.log("ASDfasdfsadf")

    const paymentInfo = await PaymentSetting.find();

    return res.json({success: true, data: paymentInfo});
}

// export const getUserBonusInfo =  async (req: Request, res: Response) => {
//     const {data} = req.body;

//     // const vipLevel = await Users.findOne({email: data.email}, {vip : 1});

//     // const vipLevel = await Bonus.findOne({email: data.email}, {vip : 1});

//     return res.json({success: true, data: paymentInfo});
// }

export const addBankCardInfo =  async (req: Request, res: Response) => {
    const {data} = req.body;

    await new BankCard({...data}).save();

    return res.json({success: true, data: "Register Bank Card Successfully"});
}

export const getBankCardInfo =  async (req: Request, res: Response) => {
    const {data} = req.body;

    const bankCards = await BankCard.find({email : data.email});

    console.log(bankCards)

    return res.json({success: true, data: bankCards});
}

export const removeBankCardInfo =  async (req: Request, res: Response) => {
    const {data} = req.body;

    await BankCard.deleteOne({_id : ObjectId(data._id)});

    return res.json({success: true, data: "Remove Bank Card Successfully"});
}

export const orderDepositAmount =  async (req: Request, res: Response) => {
    const {data} = req.body;

    const adminUPIs: any = await adminUPI.find({status: "active"});

    const upi = adminUPIs[Math.floor(Math.random() * adminUPIs.length)]

    data.upi = upi.upi;

    const order = await new DepositOrder({...data}).save();

    return res.json({success: true, data: {orderId: order.order_id}});
}

export const getDepositOrderInfo =  async (req: Request, res: Response) => {
    const {data} = req.body;
    
    const order = await DepositOrder.findOne({order_id: data.orderId});
    
    if(order) {
        return res.json({success: true, data: order});
    } else {
        return res.json({success: false, data: "failure on get deposit order"});
    }
}

export const confirmDepositOrderInfo =  async (req: Request, res: Response) => {
    const {data} = req.body;
    
    const order = await DepositOrder.findOneAndUpdate({order_id: data.order_id, status: "pending"}, {ref_no: data.ref_no});
    
    if(order) {
        return res.json({success: true, data: order});
    } else {
        return res.json({success: false, data: "failure on get deposit order"});
    }
}

export const orderWithDrawal =  async (req: Request, res: Response) => {
    const {data} = req.body;
    
    const userInfo = await Users.findOne({email : data.email});

    if(Number(userInfo.balance) < Number(data.amount)) {
        return res.json({success: false, msg: "Not Sufficient Balance!"});
    }

    const bankInfo = await BankCard.findOne({accountNumber : data.bankAccount, _id : data.bankAccountId});
    if(bankInfo) {
        console.log("bankInfo", bankInfo)

        await new WithDrawalOrder({
            email : data.email,
            amount : data.amount,
            ifscCode : bankInfo.ifscCode,
            bankName : bankInfo.bankName,
            accountNumber : bankInfo.accountNumber,
            mobile : bankInfo.mobile,
        }).save();

        return res.json({success: true, msg: "WithDrawal Request Successfully!"});
    } else {
        return res.json({success: false, msg: "Not Exist Bank Info!"});
    }
}

export const getBonusInfo =  async (req: Request, res: Response) => {
    const {data} = req.body;
    
    const bonus = await Bonus.aggregate([
        {
            $match: {
              email: data.email 
            }
        },
        {
            $project: {
                email: 1,
                amount: 1,
                level1: 1,
                level2: 1,
                level1Users: { $size: '$level1_users' },
                level2Users: { $size: '$level2_users' }
            }
        }
    ])
    
    console.log("bonus", bonus)

    if(bonus) {
        return res.json({success: true, data: bonus});
    } else {
        return res.json({success: false, data: "Failure on get bonus info"});
    }
}

export const applyAllBonus =  async (req: Request, res: Response) => {
    const {data} = req.body;
    
    const userInfo = await Users.findOne({email : data.email})

    if(!userInfo || !userInfo.verified) {
        return res.json({success: false, msg: "Please deposit on our site for verify"});
    }

    console.log("data", data);

    const bonus = await Bonus.aggregate([
        {
            $match: {
              email: data.email 
            }
        },
        {
            $project: {
                email: 1,
                amount: 1,
                level1: 1,
                level2: 1,
                level1Users: { $size: '$level1_users' },
                level2Users: { $size: '$level2_users' }
            }
        }
    ])
    
    const applyHistory = await new BonusApplyHistory({email: data.email, amount: bonus[0].amount}).save();

    if(applyHistory) {
        return res.json({success: true, msg: "Success on apply the bonus! Please wait until will be approved",  data: applyHistory});
    } else {
        return res.json({success: false, msg: "Failure on apply the bonus"});
    }
}

export const getDepositHistory =  async (req: Request, res: Response) => {
    const {data} = req.body;
    
    const perPage = 10;

    const orderResult = await DepositOrder.find({email : data.email}).sort({periodId: -1}).skip((data.page - 1) * perPage).limit(perPage);

    if(orderResult) {
        return res.json({success: true, msg: "",  data: orderResult});
    } else {
        return res.json({success: false, msg: ""});
    }
}

export const getWithDrawalHistory =  async (req: Request, res: Response) => {
    const {data} = req.body;
    
    const perPage = 10;

    const orderResult = await WithDrawalOrder.find({email : data.email}).sort({periodId: -1}).skip((data.page - 1) * perPage).limit(perPage);

    if(orderResult) {
        return res.json({success: true, msg: "",  data: orderResult});
    } else {
        return res.json({success: false, msg: ""});
    }
}

export const getBonusHistory =  async (req: Request, res: Response) => {
    const {data} = req.body;
    
    const perPage = 10;

    const orderResult = await BonusApplyHistory.find({email : data.email}).sort({periodId: -1}).skip((data.page - 1) * perPage).limit(perPage);

    if(orderResult) {
        return res.json({success: true, msg: "",  data: orderResult});
    } else {
        return res.json({success: false, msg: ""});
    }
}

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
