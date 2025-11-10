const mongoose = require('mongoose');
const Schema = mongoose.Schema;
 
const shopSchema = new Schema({
     name: {
         type: String,
         required: true
       },
       username: {
         type: String,
         required: true,
         unique: true
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
       logo: {
         type: String,
         default: null
       },
       status: {
         type: String,
         default: "pending",
         required: true
       },
       rating: {
         type: Number,
         default: 0,
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
       address: {
         type: String,
         default: null,
         required: true
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
       description: {
         type: String,
         default: null
       },
       image_cover: {
         type: String,
         default: null
       },
       // Thay đổi để lưu 2 ảnh CCCD riêng biệt
       identity_card_image_front: {
         type: String,
         default: null
       },
       identity_card_image_back: {
         type: String,
         default: null
       },
       // Thêm trường mới để lưu ảnh giấy phép kinh doanh
       business_license: {
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
       }
     });
 
const Shop = mongoose.model('Shop', shopSchema);
module.exports = Shop;