import * as moment from 'moment-timezone';
import 'dotenv/config';
import mongoose, { ObjectId as ObjectIdType } from 'mongoose';
import * as md5 from 'md5';
import * as geoip from 'geoip-country';
import * as requestIp from 'request-ip';
import { Request, Response, NextFunction } from 'express';
import * as crypto from 'crypto';

export const ObjectId = (id: string) => {
    try {
        return new mongoose.Types.ObjectId(id);
    } catch (error) {
        console.log('ObjectId', id);
    }
};

export const globalTime = () => {
    return moment.tz(new Date(), process.env.TIME_ZONE as string);
};

export const getSessionTime = () => {
    const time = new Date(new Date().valueOf() + parseInt(process.env.SESSION as string));
    return moment.tz(time, process.env.TIME_ZONE as string);
};

export const signAccessToken = (req: Request, res: Response, principal: string): any => {
    try {
        if (principal) {
            const expiration = getSessionTime();
            const accessToken = md5(principal + expiration);
            const refreshToken = md5(principal + expiration);
            const ip = getIPAddress(req);
            return { accessToken, refreshToken, expiration, principal, ...ip };
        }
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
};

export const getIPAddress = (req: Request) => {
    let ip = requestIp.getClientIp(req);
    if (ip) {
        ip = ip.replace('::ffff:', '');
    }
    const geo = geoip.lookup(ip as string);
    return { ip, useragent: req.useragent, ...geo };
};

export const encrypt = (text: string) => {
    let iv = crypto.randomBytes(Number(process.env.IV_LENGTH));
    let cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(process.env.ENCRYPTION_KEY as string), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + '::' + encrypted.toString('hex');
};
