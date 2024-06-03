import { Schema, model } from 'mongoose';

const UserWingoResultSchema = new Schema(
    {
        email: {
            type: String,
        },
        periodId: {
            type: String,
        },
        gameType: {
            type: String,
        },
        betType: {
            type: String,
        },
        amount: {
            type: Number,
            default: 0
        },
        paidAmount: {
            type: Number,
            default: 0
        },
        fee: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            default: ""
        },
    },
    { timestamps: true }
);

export const UserWingoResult = model('user_wingo_result', UserWingoResultSchema);