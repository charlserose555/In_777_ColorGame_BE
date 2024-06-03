import { Schema, model } from 'mongoose';

const WingoTransSchema = new Schema(
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
            type: String,
            default: ""
        },
    },
    { timestamps: true }
);

export const WingoTrans = model('wingo_trans', WingoTransSchema);
