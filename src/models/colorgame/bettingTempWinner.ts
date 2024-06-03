import { Schema, model } from 'mongoose';

const BettingTempWinnerSchema = new Schema(
    {
        periodId: {
            type: String,
        },
        number: {
            type: Number,
            default: 0,
        },
        color: {
            type: String,
            default: '',
        },
        total: {
            type: Number,
            default: 0
        },
        gameType: {
            type: String,
            default: ''
        },
        betType: {
            type: String,
            default: ''
        }
    },
    { timestamps: true }
);

export const BettingTempWinner = model('betting_tempwinner', BettingTempWinnerSchema);
