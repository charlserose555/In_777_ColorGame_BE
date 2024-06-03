import { Schema, model } from 'mongoose';

const BankCardSchema = new Schema(
    {
        email: {
            type: String,
        },
        actualName: {
            type: String,
            default: 0
        },
        ifscCode: {
            type: String,
            default: 0
        },
        bankName: {
            type: String,
            default: 0
        },
        accountNumber: {
            type: String,
            default: 0
        },
        mobile: {
            type: String,
            default: 0
        },
    },
    { timestamps: true }
);

export const BankCard = model('bank_card', BankCardSchema);