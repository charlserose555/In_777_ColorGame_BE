import { Schema, model } from 'mongoose';

const BonusApplyHistorySchema = new Schema(
    {
        email: {
            type: String,
        },        
        amount: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            default: "order"
        },
    },
    { timestamps: true }
);

export const BonusApplyHistory = model('bonus_apply_history', BonusApplyHistorySchema);
