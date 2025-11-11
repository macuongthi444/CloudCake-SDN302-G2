const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary.config');
const createHttpError = require('http-errors');

// Configure multer storage with Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'cloudcake/products', // Folder name in Cloudinary
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [
            { width: 1000, height: 1000, crop: 'limit', quality: 'auto' }
        ]
    }
});
const shopImageStorage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'cloudcake/shops', // ĐÚNG: folder riêng cho shop
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 500, height: 500, crop: 'limit', quality: 'auto' }
        ]
    }
});
const uploadShopImageMiddleware = multer({
    storage: shopImageStorage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Chỉ chấp nhận file ảnh!'), false);
        }
    }
}).single('image');
// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    },
    fileFilter: (req, file, cb) => {
        // Check if file is an image
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed!'), false);
        }
    }
});

// Single image upload middleware
const uploadSingle = upload.single('image');

// Multiple images upload middleware
const uploadMultiple = upload.array('images', 10); // Max 10 images

// Create a memory storage multer instance for checking files first
const multerMemory = require('multer')({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB max file size
    }
});

// Optional upload middleware - only uploads if files are present
const uploadOptionalMultiple = (req, res, next) => {
    // Check if there are any files in the request
    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
        // Not multipart, skip upload middleware
        return next();
    }

    // First, use memory storage to parse and check if files exist
    multerMemory.any()(req, res, (parseErr) => {
        if (parseErr) {
            console.error('Error parsing multipart data:', parseErr.message || parseErr);
            return next(parseErr);
        }

        // Check if there are any 'images' files
        const imageFiles = req.files ? req.files.filter(f => f.fieldname === 'images') : [];

        if (imageFiles.length === 0) {
            // No image files to upload, skip Cloudinary upload
            console.log('No image files to upload, skipping Cloudinary');
            // Files are already parsed into req.body and req.files (in memory)
            // We'll just use req.body, ignore req.files
            req.files = []; // Clear memory files
            return next();
        }

        // There are image files, now use Cloudinary storage to upload
        // Re-parse with Cloudinary storage (this will re-read from request)
        // Actually, we need to recreate the request stream or use the files we have
        // For now, let's use a different approach: upload files we found

        // Use Cloudinary upload for each file
        const cloudinary = require('../config/cloudinary.config');
        const uploadPromises = imageFiles.map(file => {
            return new Promise((resolve, reject) => {
                const uploadStream = cloudinary.uploader.upload_stream(
                    {
                        folder: 'cloudcake/products',
                        transformation: [
                            { width: 1000, height: 1000, crop: 'limit', quality: 'auto' }
                        ]
                    },
                    (err, result) => {
                        if (err) return reject(err);
                        resolve({
                            path: result.secure_url,
                            filename: result.public_id
                        });
                    }
                );
                uploadStream.end(file.buffer);
            });
        });

        Promise.all(uploadPromises)
            .then(uploadedFiles => {
                // Replace memory files with Cloudinary URLs
                req.files = uploadedFiles.map((file, index) => ({
                    fieldname: 'images',
                    originalname: imageFiles[index].originalname,
                    encoding: imageFiles[index].encoding,
                    mimetype: imageFiles[index].mimetype,
                    path: file.path,
                    size: imageFiles[index].size
                }));
                next();
            })
            .catch(uploadErr => {
                console.error('Cloudinary upload error:', uploadErr.message || uploadErr);
                return next(uploadErr);
            });
    });
};

module.exports = {
    uploadSingle,
    uploadMultiple,
    uploadOptionalMultiple,
    uploadShopImageMiddleware
};


