const mongoose = require('mongoose')
const { Schema } = mongoose

const productVariantSchema = new Schema({
    productId: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: [true, "Product ID is required"]
    },
    name: {
        type: String,
        required: [true, "Variant name is required"],
        trim: true
        // VD: "Nhỏ - Vị Dâu", "Vừa - Vị Socola"
    },
    attributes: {
        size: {
            type: String,
            enum: ['SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE', 'CUSTOM'],
            trim: true
        },
        flavor: {
            type: String,
            trim: true // VD: "Dâu", "Socola", "Vanilla", "Tiramisu"
        },
        shape: {
            type: String,
            trim: true // VD: "Tròn", "Vuông", "Trái tim", "Chữ nhật"
        },
        custom: {
            type: Map,
            of: String // For custom attributes
        }
    },
    price: {
        type: Number,
        required: [true, "Price is required"],
        min: [0, "Price must be positive"]
    },
    discountedPrice: {
        type: Number,
        min: [0, "Discounted price must be positive"]
    },
    sku: {
        type: String,
        trim: true,
        uppercase: true,
        unique: true,
        sparse: true
    },
    weight: {
        value: {
            type: Number,
            min: 0
        },
        unit: {
            type: String,
            enum: ['g', 'kg'],
            default: 'g'
        }
    },
    image: {
        type: String, // URL to variant-specific image
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    inventory: {
        quantity: {
            type: Number,
            default: 0,
            min: 0
        },
        lowStockThreshold: {
            type: Number,
            default: 10
        },
        trackInventory: {
            type: Boolean,
            default: true
        }
    }
}, {
    timestamps: true
})

// Indexes
productVariantSchema.index({ productId: 1, isActive: 1 })
productVariantSchema.index({ sku: 1 })

// Method to check if in stock
productVariantSchema.methods.isInStock = function() {
    if (!this.inventory.trackInventory) return true
    return this.inventory.quantity > 0
}

// Method to check if low stock
productVariantSchema.methods.isLowStock = function() {
    if (!this.inventory.trackInventory) return false
    return this.inventory.quantity <= this.inventory.lowStockThreshold
}

const ProductVariant = mongoose.model("ProductVariant", productVariantSchema)
module.exports = ProductVariant







