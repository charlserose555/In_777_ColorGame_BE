import { Schema, model } from 'mongoose';

const PaymentSettingSchema = new Schema(
    {
        id: {
            type: Number,
        },
        rechargeAmount: {
            type: Number,
            default: 0,
        },
        withdrawalAmount: {
            type: Number,
            default: 0,
        },
        bonusAmount: {
            type: Number,
            default: 0,
        },
        rechargeBonus: {
            type: Number,
            default: 0,
        },
        invitation: {
            type: Number,
            default: 0,
        },
        level1: {
            type: Number,
            default: 0,
        },
        level2: {
            type: Number,
            default: 0,
        }
    },
    { timestamps: true }
);

export const PaymentSetting = model('payment_setting', PaymentSettingSchema);
