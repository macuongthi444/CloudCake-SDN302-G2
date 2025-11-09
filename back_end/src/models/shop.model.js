const mongoose = require('mongoose')
const { Schema } = mongoose

const shopSchema = new Schema({
    name: {
        type: String,
        required: [true, "Shop name is required"],
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    ownerId: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: [true, "Owner ID is required"],
        unique: true // Một user chỉ có thể sở hữu một shop
    },
    logo: {
        type: String, // URL to shop logo
        trim: true
    },
    coverImage: {
        type: String, // URL to cover image
        trim: true
    },
    address: {
        street: String,
        city: String,
        district: String,
        ward: String,
        postalCode: String
    },
    phone: {
         type: String,
         default: null
       },
    email: {
         type: String,
         required: true,
         unique: true
       },
    status: {
        type: String,
        enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'],
        default: 'PENDING'
    },
    isActive: {
        type: Boolean,
        default: false // Chỉ active khi được admin duyệt
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
    openingHours: {
        monday: { open: String, close: String },
        tuesday: { open: String, close: String },
        wednesday: { open: String, close: String },
        thursday: { open: String, close: String },
        friday: { open: String, close: String },
        saturday: { open: String, close: String },
        sunday: { open: String, close: String }
    },
    bankAccount: {
        bankName: String,
        accountNumber: String,
        accountHolder: String
    }
}, {
    timestamps: true
})

// Indexes
shopSchema.index({ ownerId: 1 })
shopSchema.index({ status: 1 })
shopSchema.index({ isActive: 1 })

const Shop = mongoose.model("Shop", shopSchema)
module.exports = Shop







