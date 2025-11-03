const mongoose = require('mongoose')
const { Schema } = mongoose

const productSchema = new Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    shortDescription: {
        type: String,
        trim: true,
        maxlength: 200
    },
    shopId: {
        type: Schema.Types.ObjectId,
        ref: 'Shop',
        required: [true, "Shop ID is required"]
    },
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, "Category ID is required"]
    },
    basePrice: {
        type: Number,
        required: [true, "Base price is required"],
        min: [0, "Price must be positive"]
    },
    discountedPrice: {
        type: Number,
        min: [0, "Discounted price must be positive"]
    },
    sku: {
        type: String,
        trim: true,
        uppercase: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    images: [{
        url: {
            type: String,
            required: true
        },
        isPrimary: {
            type: Boolean,
            default: false
        },
        alt: String
    }],
    ingredients: [{
        type: String,
        trim: true
    }],
    allergens: [{
        type: String,
        trim: true // VD: "Gluten", "Dairy", "Nuts"
    }],
    nutritionalInfo: {
        calories: Number,
        protein: Number,
        carbs: Number,
        fat: Number,
        fiber: Number,
        sugar: Number
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
    shelfLife: {
        value: {
            type: Number,
            min: 0
        },
        unit: {
            type: String,
            enum: ['hours', 'days'],
            default: 'days'
        }
    },
    status: {
        type: String,
        enum: ['DRAFT', 'ACTIVE', 'OUT_OF_STOCK', 'DISCONTINUED'],
        default: 'DRAFT'
    },
    isActive: {
        type: Boolean,
        default: false
    },
    isFeatured: {
        type: Boolean,
        default: false
    },
    rating: {
        average: {
            type: Number,
            default: 0,
            min: 0,
            max: 5
        },
        count: {
            type: Number,
            default: 0
        }
    },
    viewCount: {
        type: Number,
        default: 0
    },
    salesCount: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

// Indexes for performance
productSchema.index({ shopId: 1, status: 1 })
productSchema.index({ categoryId: 1, isActive: 1 })
productSchema.index({ isFeatured: 1, isActive: 1 })
productSchema.index({ name: 'text', description: 'text', tags: 'text' }) // Text search

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
    if (this.discountedPrice && this.basePrice) {
        return Math.round(((this.basePrice - this.discountedPrice) / this.basePrice) * 100)
    }
    return 0
})

// Method to get display price
productSchema.methods.getDisplayPrice = function() {
    return this.discountedPrice || this.basePrice
}

const Product = mongoose.model("Product", productSchema)
module.exports = Product
