import { Schema, model } from 'mongoose';

const WingoBettingSchema = new Schema(
    {
        email: {
            type: String,
        },
        gamePeriod: {
            type: String,
        },
        gameType: {
            type: String,
        },
        betType: {
            type: String,
        },
        betValue: {
            type: String,
        },
        amount: {
            type: Number,
        },
        resultNumber: {
            type: String,
            default: ''
        },
        resultColor: {
            type: String,
            default: ''
        },
        status: {
            type: String,
            default: "pending"
        }
    },
    { timestamps: true }
);

export const WingoBetting = model('wingo_betting', WingoBettingSchema);
