const mongoose = require('mongoose')
const { Schema } = mongoose

const paymentMethodSchema = new Schema({
    name: { type: String, required: [true, "Payment method name is required"], trim: true },
    description: { type: String, trim: true },
    icon: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    paymentCode: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        enum: ['COD', 'VNPAY', 'PAYOS']
    },
    isOnline: { type: Boolean, default: false },
    supportsRefund: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    config: { type: Schema.Types.Mixed }
}, { timestamps: true })

paymentMethodSchema.index({ isActive: 1, sortOrder: 1 })

const PaymentMethod = mongoose.model("paymentMethods", paymentMethodSchema)
module.exports = PaymentMethod


