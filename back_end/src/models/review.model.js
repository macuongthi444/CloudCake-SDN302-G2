const mongoose = require('mongoose')
const { Schema } = mongoose

const reviewSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, "Product ID is required"]
    },
    orderId: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        default: null // Optional - để biết review từ đơn hàng nào
    },
    userId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: [true, "User ID is required"]
    },
    rating: {
        type: Number,
        required: [true, "Rating is required"],
        min: 1,
        max: 5
    },
    title: {
        type: String,
        trim: true,
        maxlength: 200
    },
    comment: {
        type: String,
        trim: true,
        maxlength: 1000
    },
    images: [{
        url: {
            type: String,
            required: true
        }
    }],
    verifiedPurchase: {
        type: Boolean,
        default: false // True nếu đã mua sản phẩm này
    },
    helpfulCount: {
        type: Number,
        default: 0
    },
    isApproved: {
        type: Boolean,
        default: false // Admin/Seller có thể duyệt review
    },
    shopResponse: {
        comment: {
            type: String,
            trim: true,
            maxlength: 500
        },
        respondedAt: {
            type: Date
        },
        respondedBy: {
            type: Schema.Types.ObjectId,
            ref: 'users'
        }
    }
}, {
    timestamps: true
})

// Indexes
reviewSchema.index({ productId: 1, isApproved: 1, createdAt: -1 })
reviewSchema.index({ userId: 1 })
reviewSchema.index({ rating: 1 })
reviewSchema.index({ verifiedPurchase: 1 })

// Prevent duplicate reviews from same user for same product
reviewSchema.index({ productId: 1, userId: 1 }, { unique: true })

const Review = mongoose.model("Review", reviewSchema)
module.exports = Review







