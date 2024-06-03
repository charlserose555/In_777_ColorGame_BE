import { Schema, model } from 'mongoose';

const mongoose = require('mongoose');
const AutoIncrement = require('mongoose-sequence')(mongoose);

const AdminUPISchema = new Schema(
    {
        id: {
            type: Number,
            default: 0
        },
        upi: {
            type: String,
            default: ''
        },
        amount: {
            type: Number,
            default: 0
        },
        status: {
            type: String,
            default: 'active'
        },
    },
    { timestamps: true }
);

AdminUPISchema.plugin(AutoIncrement, { inc_field: 'id' });

export const adminUPI = model('admin_upi', AdminUPISchema);
