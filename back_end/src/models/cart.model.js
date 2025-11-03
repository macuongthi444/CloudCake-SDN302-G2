const mongoose = require('mongoose')
const { Schema } = mongoose

const cartItemSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        required: [true, "Product ID is required"],
        ref: 'Product'
    },
    variantId: {
        type: Schema.Types.ObjectId,
        required: [true, "Product Variant ID is required"],
        ref: 'ProductVariant'
    },
    productName: {
        type: String,
        required: [true, "Product name is required"],
        trim: true
    },
    variantName: {
        type: String,
        required: [true, "Variant name is required"],
        trim: true
        // VD: "Nhỏ - Vị Dâu"
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Quantity must be at least 1"]
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price must be positive"]
    },
    image: {
        type: String, // URL to product or variant image
        trim: true
    }
})

const cartSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        required: [true, "User ID is required"],
        ref: 'users',
        unique: true // Each user can only have one active cart
    },
    items: [cartItemSchema],
    totalPrice: {
        type: Number,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
})

// Calculate total price before saving
cartSchema.pre('save', function(next) {
    this.totalPrice = this.items.reduce((total, item) => {
        return total + (item.price * item.quantity)
    }, 0)
    next()
})

const Cart = mongoose.model("carts", cartSchema)
module.exports = Cart


