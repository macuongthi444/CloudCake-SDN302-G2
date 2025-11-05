const mongoose = require('mongoose')
const { Schema } = mongoose

const couponSchema = new Schema({
    code: {
        type: String,
        required: [true, "Coupon code is required"],
        unique: true,
        uppercase: true,
        trim: true
    },
    name: {
        type: String,
        required: [true, "Coupon name is required"],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    type: {
        type: String,
        enum: ['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'],
        required: true
    },
    value: {
        type: Number,
        required: [true, "Coupon value is required"],
        min: 0
    },
    minPurchaseAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    maxDiscountAmount: {
        type: Number,
        default: null, // For percentage coupons
        min: 0
    },
    shopId: {
        type: Schema.Types.ObjectId,
        ref: 'Shop',
        default: null // null = apply to all shops
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        default: null // null = apply to all categories
    },
    applicableProducts: [{
        type: Schema.Types.ObjectId,
        ref: 'Product'
    }],
    validFrom: {
        type: Date,
        required: true
    },
    validUntil: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        default: null, // null = unlimited
        min: 1
    },
    usageCount: {
        type: Number,
        default: 0,
        min: 0
    },
    perUserLimit: {
        type: Number,
        default: 1, // Số lần một user có thể dùng
        min: 1
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
})

// Indexes
couponSchema.index({ code: 1 })
couponSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 })
couponSchema.index({ shopId: 1 })

// Method to check if coupon is valid
couponSchema.methods.isValid = function() {
    const now = new Date()
    return this.isActive &&
           now >= this.validFrom &&
           now <= this.validUntil &&
           (this.usageLimit === null || this.usageCount < this.usageLimit)
}

// Method to calculate discount
couponSchema.methods.calculateDiscount = function(subtotal) {
    if (!this.isValid()) return 0
    if (subtotal < this.minPurchaseAmount) return 0

    let discount = 0
    if (this.type === 'PERCENTAGE') {
        discount = (subtotal * this.value) / 100
        if (this.maxDiscountAmount) {
            discount = Math.min(discount, this.maxDiscountAmount)
        }
    } else if (this.type === 'FIXED_AMOUNT') {
        discount = Math.min(this.value, subtotal)
    }

    return Math.round(discount)
}

const Coupon = mongoose.model("Coupon", couponSchema)
module.exports = Coupon






