import { Schema, model } from 'mongoose';

const BonusSchema = new Schema(
    {
        email: {
            type: String,
        },
        amount: {
            type: Number,
            default: 0
        },
        level1: {
            type: Number,
            default: 0
        },
        level2: {
            type: Number,
            default: 0
        },
        users_count: {
            type: Number,
            default: 0
        },
        level1_users: {
            type: Array,
            default: []
        },
        level2_users: {
            type: Array,
            default: []
        },
    },
    { timestamps: true }
);

export const Bonus = model('bonus', BonusSchema);
