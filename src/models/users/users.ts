import { Schema, model } from 'mongoose';
import * as bcrypt from 'bcrypt-nodejs';

const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const UsersSchema = new Schema(
    {
        email: {
            type: String,
            unique: true
        },
        password: {
            type: String,
            unique: false
        },
        username: {
            type: String,
            unique: true
        },
        permissionId: {
            type: String,
            default: "player"
        },
        mobile: {
            type: Number
        },
        balance: {
            type: Number,
            default: '0',
        },
        ip: {
            type: String,
            default: ''
        },
        nonce: {
            type: Number
        },
        avatar: {
            type: String,
            default: ''
        },
        country: {
            type: String
        },
        iReferral: {
            type: Number,
            default: 10000
        },
        rReferral: {
            type: Number,
            default: 0,
        },
        verifyCode: {
            type: Number
        },
        verified: {
            type: Boolean,
            default: true,
        },
        rBonus: {
            type: Number,
            default: 0
        },
        rNumber: {
            type: Number,
            default: 0
        },
        level: {
            type: Number,
            default: 1
        }, 
        vip: {
            type: Number,
            default: 0
        },
        invite_members: {
            type: Number,
            default: 0
        },
        status: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

UsersSchema.plugin(AutoIncrement, { inc_field: 'iReferral' });

UsersSchema.methods.generateHash = (password: string) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

UsersSchema.methods.validPassword = (password: string, encrypted: string) => {
    return bcrypt.compareSync(password, encrypted);
};

export const Users = model('users', UsersSchema);
