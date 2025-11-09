const cloudinary = require('cloudinary').v2;
require('dotenv').config();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'dqanjlzvj',
    api_key: process.env.CLOUDNARY_API_KEY || '941593453823453', 
    api_secret: process.env.CLOUDNARY_API_SECRET || 'ucmscbTIuRjg8ndsPsN5a2Qe4UU'
});

module.exports = cloudinary;







