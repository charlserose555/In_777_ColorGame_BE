import { Schema, model } from 'mongoose';
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const WithDrawalSchema = new Schema(
    {
        order_Id: {
            type: Number,
            default: 1
        },
        email: {
            type: String,
        },
        amount: {
            type: Number,
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
        status: {
            type: String,
            default: "order"
        }
    },
    { timestamps: true }
);

WithDrawalSchema.plugin(AutoIncrement, { inc_field: 'order_Id' });

export const WithDrawalOrder = model('withdrawal_order', WithDrawalSchema);
