import { Schema, model } from 'mongoose';

const ColorTransOrderSchema = new Schema(
    {
        email: {
            type: String,
        },
        transctionId: {
            type: String,
        },
        amount: {
            type: Number,
            default: 0
        },
        type: {
            type: String,
        },
        status: {
            type: Number,
            default: 1
        },
    },
    { timestamps: true }
);

export const ColorTransOrder = model('color_trans_order', ColorTransOrderSchema);
