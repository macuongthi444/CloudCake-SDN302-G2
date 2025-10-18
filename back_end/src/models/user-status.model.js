// userStatus.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userStatusSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: 'users',
        required: true,
        unique: true
    },
    is_online: {
        type: Boolean,
        default: false
    },
    last_active: {
        type: Date,
        default: Date.now
    }
});

const UserStatus = mongoose.model('UserStatus', userStatusSchema);
module.exports = UserStatus;