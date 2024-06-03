import { Schema, model } from 'mongoose';

const BonusHistorySchema = new Schema(
    {
        email: {
            type: String,
        },
        periodId: {
            type: String,
            default: ''
        },
        level1Email: {
            type: String,
            default: ''
        },
        level2Email: {
            type: String,
            default: ''
        },
        level1Amount: {
            type: Number,
            default: 0
        },
        level2Amount: {
            type: Number,
            default: 0
        },
        tradeAmount: {
            type: Number,
            default: 0
        },
    },
    { timestamps: true }
);

export const BonusHistory = model('bonus_History', BonusHistorySchema);
