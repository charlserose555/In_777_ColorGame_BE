import { Schema, model } from 'mongoose';
const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const WithDrawalSchema = new Schema(
    {
        order_id: {
            type: Number,
            default: 1
        },
        email: {
            type: String,
        },
        bankId: {
            type: Schema.Types.ObjectId,
            required: true,
            ref: 'bank_card'
        },
        amount: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            default: "order"
        }
    },
    { timestamps: true }
);

WithDrawalSchema.plugin(AutoIncrement, { inc_field: 'orderid' });

export const WithDrawalOrder = model('withdrawal_order', WithDrawalSchema);
