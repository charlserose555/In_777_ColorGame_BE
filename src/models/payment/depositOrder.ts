import { Schema, model } from 'mongoose';
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const DepsoitOrderSchema = new Schema(
    {
        order_id: {
            type: Number,
            default: 1
        },
        email: {
            type: String,
        },
        mobileNumber: {
            type: String,
        },
        amount: {
            type: Number,
            default: 0
        },
        payment_method: {
            type: String,
            default: 'manual'
        },
        upi: {
            type: String,
            default: '',
        },
        ref_no: {
            type: String,
            default: '',
        },
        status: {
            type: String,
            default: "order"
        }
    },
    { timestamps: true }
);

DepsoitOrderSchema.plugin(AutoIncrement, { inc_field: 'order_id' });

export const DepositOrder = model('deposit_order', DepsoitOrderSchema);
