import * as moment from 'moment-timezone';
import 'dotenv/config';
import mongoose, { ObjectId as ObjectIdType } from 'mongoose';

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