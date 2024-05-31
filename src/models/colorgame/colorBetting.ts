import { Schema, model } from 'mongoose';

const ColorBettingSchema = new Schema(
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
        }
    },
    { timestamps: true }
);

export const ColorBetting = model('color_betting', ColorBettingSchema);
