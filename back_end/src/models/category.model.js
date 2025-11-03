const mongoose = require('mongoose')
const { Schema } = mongoose

const categorySchema = new Schema({
    name: {
        type: String,
        required: [true, "Category name is required"],
        trim: true,
        unique: true
    },
    description: {
        type: String,
        trim: true
    },
    image: {
        type: String, // URL to category image
        trim: true
    },
    icon: {
        type: String, // Icon name or URL
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    parentId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        default: null // For sub-categories
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
})

// Index for faster queries
categorySchema.index({ isActive: 1, sortOrder: 1 })
categorySchema.index({ parentId: 1 })

const Category = mongoose.model("Category", categorySchema)
module.exports = Category





