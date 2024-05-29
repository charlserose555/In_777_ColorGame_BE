import { Schema, model } from 'mongoose';
import * as bcrypt from 'bcrypt-nodejs';

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
            type: Schema.Types.ObjectId,
            ref: 'permissions'
        },
        mobile: {
            type: Number
        },
        balance: {
            type: Number,
            default: '0',
        },
        publicAddress: {
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
        ip: {
            type: String
        },
        country: {
            type: String
        },
        iReferral: {
            type: String
        },
        rReferral: {
            type: String
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
        status: {
            type: Boolean,
            default: true
        }
    },
    { timestamps: true }
);

UsersSchema.methods.generateHash = (password: string) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10));
};

UsersSchema.methods.validPassword = (password: string, encrypted: string) => {
    return bcrypt.compareSync(password, encrypted);
};

UsersSchema.pre('findOneAndUpdate', function () {
    this.populate('permissionId', ['title']);
});

UsersSchema.pre('findOne', function () {
    this.populate('permissionId', ['title']);
});

UsersSchema.pre('find', function () {
    this.populate('permissionId', ['title']);
});

export const Users = model('users', UsersSchema);
