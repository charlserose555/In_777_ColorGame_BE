import { Schema, model } from 'mongoose';

const BalanceHistorySchema = new Schema(
    {
        email: {
            type: String,
        },
        orderId: {
            type: String
        },
        amount: {
            type: Number
        },
        type: {
            type: String
        },
        actionType: {
            type: String,
        }
    },
    { timestamps: true }
);

export const BalanceHistory = model('balance_history', BalanceHistorySchema);
