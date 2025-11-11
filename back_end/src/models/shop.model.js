const mongoose = require('mongoose');
const Schema = mongoose.Schema;

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
  CCCD: {
    type: String,
    required: true
  },
  nation_id: {
    type: Number,
    default: null
  },
  province_id: {
    type: Number,
    default: null
  },
  response_time: {
    type: String,
    default: null
  },
  is_active: {
    type: Number,
    default: 1,
    required: true
  },
  follower: {
    type: Number,
    default: 0,
    required: true
  },
  user_id: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  website: {
    type: String,
    default: null
  },
  image_cover: {
    type: String,
    default: null
  },
  
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'],
    default: 'PENDING'
  },
  isActive: {
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
});

// Indexes
shopSchema.index({ ownerId: 1 })
shopSchema.index({ status: 1 })
shopSchema.index({ isActive: 1 })

const Shop = mongoose.model("Shop", shopSchema)
module.exports = Shop














