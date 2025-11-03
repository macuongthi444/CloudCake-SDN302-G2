const mongoose = require('mongoose')
const { Schema } = mongoose

const orderItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    variantId: {
        type: Schema.Types.ObjectId,
        ref: 'ProductVariant',
        required: true
    },
    productName: {
        type: String,
        required: true
    },
    variantName: {
        type: String,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    unitPrice: {
        type: Number,
        required: true,
        min: 0
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0
    },
    image: String
}, { _id: false })

const orderSchema = new Schema({
    orderNumber: {
        type: String,
        unique: true,
        required: true
        // Format: ORD-YYYYMMDD-XXXX (auto-generated)
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: [true, "User ID is required"]
    },
    shopId: {
        type: Schema.Types.ObjectId,
        ref: 'Shop',
        required: [true, "Shop ID is required"]
    },
    items: [orderItemSchema],
    subtotal: {
        type: Number,
        required: true,
        min: 0
    },
    shippingFee: {
        type: Number,
        default: 0,
        min: 0
    },
    discount: {
        type: Number,
        default: 0,
        min: 0
    },
    couponId: {
        type: Schema.Types.ObjectId,
        ref: 'Coupon',
        default: null
    },
    totalAmount: {
        type: Number,
        required: true,
        min: 0
    },
    status: {
        type: String,
        enum: [
            'PENDING',           // Chờ xử lý
            'CONFIRMED',         // Đã xác nhận
            'PREPARING',         // Đang chuẩn bị
            'READY',             // Sẵn sàng giao
            'SHIPPING',          // Đang giao hàng
            'DELIVERED',         // Đã giao
            'CANCELLED',         // Đã hủy
            'REFUNDED'           // Đã hoàn tiền
        ],
        default: 'PENDING'
    },
    paymentStatus: {
        type: String,
        enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
        default: 'PENDING'
    },
    paymentMethodId: {
        type: Schema.Types.ObjectId,
        ref: 'PaymentMethod',
        required: true
    },
    shippingMethodId: {
        type: Schema.Types.ObjectId,
        ref: 'ShippingMethod',
        required: true
    },
    shippingAddress: {
        address_line1: { type: String, required: true },
        address_line2: String,
        city: { type: String, required: true },
        district: String,
        ward: String,
        postalCode: String,
        phone: { type: String, required: true },
        recipientName: { type: String, required: true }
    },
    notes: {
        type: String,
        trim: true,
        maxlength: 500
    },
    deliveryDate: {
        type: Date
        // Ngày giao hàng dự kiến
    },
    deliveredAt: {
        type: Date
    },
    cancelledAt: {
        type: Date
    },
    cancellationReason: {
        type: String,
        trim: true
    },
    trackingNumber: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
})

// Indexes
orderSchema.index({ userId: 1, createdAt: -1 })
orderSchema.index({ shopId: 1, status: 1 })
orderSchema.index({ orderNumber: 1 })
orderSchema.index({ status: 1, createdAt: -1 })

// Auto-generate order number before save
orderSchema.pre('save', async function(next) {
    if (!this.orderNumber) {
        const date = new Date()
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '')
        const count = await mongoose.model('Order').countDocuments({
            createdAt: {
                $gte: new Date(date.setHours(0, 0, 0, 0)),
                $lt: new Date(date.setHours(23, 59, 59, 999))
            }
        })
        this.orderNumber = `ORD-${dateStr}-${String(count + 1).padStart(4, '0')}`
    }
    next()
})

const Order = mongoose.model("Order", orderSchema)
module.exports = Order





