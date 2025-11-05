const mongoose = require('mongoose')
const { Schema } = mongoose

const paymentMethodSchema = new Schema({
    name: {
        type: String,
        required: [true, "Payment method name is required"],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    icon: {
        type: String, // URL to payment icon or image
        trim: true
    },
    paymentCode: {
        type: String, // Unique code like 'COD', 'VISA', 'MOMO', etc.
        unique: true,
        trim: true
    }
}, {
    timestamps: true
})

const PaymentMethod = mongoose.model("paymentMethods", paymentMethodSchema)
module.exports = PaymentMethod


