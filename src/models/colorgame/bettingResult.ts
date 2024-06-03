import { Schema, model } from 'mongoose';

const BettingResultSchema = new Schema(
    {
        periodId: {
            type: String,
        },
        totalTradeAmount: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            default: 0,
        },
        randomPrice: {
            type: Number,
            default: 0,
        },
        number: {
            type: Number,
            default: 0
        },
        randomNumber: {
            type: Number,
            default: 0
        },
        color: {
            type: String,
            default: ''
        },
        randomColor: {
            type: String,
            default: ''
        },
        gameType: {
            type: String,
            default: ''
        },
        betType: {
            type: String,
            default: ''
        },
    },
    { timestamps: true }
);

export const BettingResult = model('betting_result', BettingResultSchema);
