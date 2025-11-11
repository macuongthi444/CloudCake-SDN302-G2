const db = require("../models")
const Shop = db.shop
const User = db.user
const createHttpError = require('http-errors')

// Get all shops (public)
async function getAll(req, res, next) {
    try {
        const { status, is_active } = req.query
        const query = {}

        if (status) query.status = status
        if (is_active !== undefined) query.is_active = is_active === 'true'

        const shops = await Shop.find(query)
            .populate('ownerId', 'firstName lastName email')
            .sort({ createdAt: -1 })
            .lean() // Tối ưu performance

        res.status(200).json(shops)
    } catch (error) {
        next(error)
    }
}

// Get shop by ID (public)
async function getById(req, res, next) {
    try {
        const { id } = req.params
        const shop = await Shop.findById(id)
            .populate('ownerId', 'firstName lastName email')

        if (!shop) {
            throw createHttpError.NotFound("Shop not found")
        }

        res.status(200).json(shop)
    } catch (error) {
        next(error)
    }
}

// Get shop by owner ID (protected)
async function getMyShop(req, res, next) {
    try {
        const userId = req.userId

        const shop = await Shop.findOne({ ownerId: userId })
            .populate('ownerId', 'firstName lastName email')

        if (!shop) {
            return res.status(200).json(null)
        }

        res.status(200).json(shop)
    } catch (error) {
        next(error)
    }
}

// Create shop (Seller only)
async function create(req, res, next) {
    try {
        const userId = req.userId

        // Check if user already has a shop
        const existingShop = await Shop.findOne({ ownerId: userId })
        if (existingShop) {
            throw createHttpError.BadRequest("You already have a shop")
        }

        const {
            name,
            description,
            logo,
            coverImage,
            address,
            phone,
            email,
            openingHours,
            bankAccount

        } = req.body

        if (!name) {
            throw createHttpError.BadRequest("Shop name is required")
        }

        const newShop = new Shop({
            name,
            description,
            logo,
            coverImage,
            ownerId: userId,
            address: address || {},
            phone,
            email,
            openingHours: openingHours || {},
            bankAccount: bankAccount || {},
            status: 'PENDING',
            is_active: false
        })

        await newShop.save()

        const populatedShop = await Shop.findById(newShop._id)
            .populate('ownerId', 'firstName lastName email')

        res.status(201).json(populatedShop)
    } catch (error) {
        next(error)
    }
}

// Update shop (Owner or Admin)
async function update(req, res, next) {
    try {
        const { id } = req.params
        const userId = req.userId
        const isAdmin = req.user.roles.some(role => role.name === 'ADMIN')

        const shop = await Shop.findById(id).populate('ownerId');
        if (!shop) {
            throw createHttpError.NotFound("Shop not found")
        }

        // Check permissions
        if (!isAdmin && (!shop.ownerId || shop.ownerId._id.toString() !== userId)) {
            throw createHttpError.Forbidden("You can only update your own shop")
        }

        // Update fields
        const updatableFields = [
            'name', 'description', 'logo', 'coverImage',
            'address', 'phone', 'email', 'openingHours', 'bankAccount'
        ]

        updatableFields.forEach(field => {
            if (req.body[field] !== undefined) {
                if (typeof req.body[field] === 'object') {
                    shop[field] = { ...shop[field], ...req.body[field] }
                } else {
                    shop[field] = req.body[field]
                }
            }
        })

        await shop.save()

        const populatedShop = await Shop.findById(shop._id)
            .populate('ownerId', 'firstName lastName email')

        res.status(200).json(populatedShop)
    } catch (error) {
        next(error)
    }
}

// Updatze shop status (Admin only)
async function updateStatus(req, res, next) {
    try {
        const { id } = req.params
        const { status } = req.body

        if (!['PENDING', 'ACTIVE', 'SUSPENDED', 'REJECTED'].includes(status)) {
            throw createHttpError.BadRequest("Invalid status")
        }

        const shop = await Shop.findById(id)
        if (!shop) {
            throw createHttpError.NotFound("Shop not found")
        }

        shop.status = status
        shop.is_active = status === 'ACTIVE'

        await shop.save()

        const populatedShop = await Shop.findById(shop._id)
            .populate('ownerId', 'firstName lastName email')

        res.status(200).json({
            message: "Shop status updated successfully",
            shop: populatedShop
        })
    } catch (error) {
        next(error)
    }
}
const uploadShopImage = async (req, res, next) => {
    try {
        console.log("req.file:", req.file);
        console.log("req.body:", req.body);

        if (!req.file) {
            throw createHttpError.BadRequest("Không có file được upload");
        }

        const shopId = req.params.id;
        const field = req.body.field || 'logo';
        const validFields = ['logo', 'coverImage'];
        if (!validFields.includes(field)) {
            throw createHttpError.BadRequest("Trường không hợp lệ");
        }

        const userId = req.userId;
        const isAdmin = req.user?.roles?.some(role => role.name === 'ADMIN') || false;

        const shop = await Shop.findById(shopId).populate('ownerId');
        if (!shop) throw createHttpError.NotFound("Shop không tồn tại");

        // KIỂM TRA QUYỀN
        if (!isAdmin && (!shop.ownerId || shop.ownerId._id.toString() !== userId)) {
            throw createHttpError.Forbidden("Bạn chỉ có thể cập nhật ảnh cửa hàng của mình");
        }

        // XÓA ẢNH CŨ
        if (shop[field]) {
            const publicId = shop[field].split('/').pop().split('.')[0];
            await cloudinary.uploader.destroy(publicId).catch(() => { });
        }

        const imageUrl = req.file.path;

        // SỬA TẠI ĐÂY: DÙNG updateOne + $set + runValidators: false
        await Shop.updateOne(
            { _id: shopId },
            { $set: { [field]: imageUrl } },
            { runValidators: false } // BỎ QUA VALIDATION
        );

        // Lấy lại shop để trả về
        const updatedShop = await Shop.findById(shopId).populate('ownerId');

        res.json({
            message: "Upload thành công",
            [field]: imageUrl,
            shop: updatedShop
        });
    } catch (error) {
        next(error);
    }
};
const deleteShop = async (req, res, next) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop || shop.is_active === 0) {
            throw createHttpError.NotFound("Shop not found");
        }

        // Xóa logo và image_cover từ Cloudinary nếu có
        if (shop.logo && shop.logo.includes('cloudinary')) {
            await removeFile(shop.logo);
        }

        if (shop.image_cover && shop.image_cover.includes('cloudinary')) {
            await removeFile(shop.image_cover);
        }

        shop.is_active = 0; // Thay đổi trạng thái thành không hoạt động
        await shop.save();
        res.status(200).json({ message: "Shop deleted successfully" });
    } catch (error) {
        if (error.name === 'CastError') {
            return next(createHttpError.BadRequest("Invalid shop ID"));
        }
        next(error);
    }
};
const approveShop = async (req, res, next) => {
    try {
        const shop = await Shop.findById(req.params.id);
        if (!shop || shop.is_active === 0) {
            throw createHttpError.NotFound("Không tìm thấy cửa hàng");
        }

        shop.status = "ACTIVE";

        await shop.save();

        // Gửi email thông báo chấp nhận
        try {
            // Tạo transporter
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SERVICE_EMAIL,
                    pass: process.env.SERVICE_PASSWORD
                }
            });

            // Tạo nội dung email
            const mailOptions = {
                from: process.env.SERVICE_EMAIL,
                to: shop.email,
                subject: 'Đăng ký cửa hàng của bạn đã được phê duyệt',
                html: `
                    <h1>Chúc mừng! Cửa hàng của bạn đã được phê duyệt</h1>
                    <p>Kính gửi ${shop.name},</p>
                    <p>Chúng tôi rất vui mừng thông báo rằng đăng ký cửa hàng của bạn đã được phê duyệt. Bạn có thể bắt đầu bán hàng trên nền tảng của chúng tôi ngay bây giờ.</p>
                    <p>Thông tin cửa hàng:</p>
                    <ul>
                        <li><strong>Tên cửa hàng:</strong> ${shop.name}</li>
                        <li><strong>Tên đăng nhập:</strong> ${shop.username}</li>
                        <li><strong>Email:</strong> ${shop.email}</li>
                    </ul>
                    <p>Cảm ơn bạn đã lựa chọn nền tảng của chúng tôi.</p>
                    <p>Trân trọng,<br>Đội ngũ Quản trị</p>
                `
            };

            // Gửi email
            await transporter.sendMail(mailOptions);
            console.log(`Email thông báo phê duyệt đã gửi đến ${shop.email}`);

        } catch (emailError) {
            // Ghi log lỗi nhưng không làm fail request
            console.error("Không thể gửi email thông báo phê duyệt:", emailError);
        }

        res.status(200).json({ message: "Phê duyệt cửa hàng thành công", shop });
    } catch (error) {
        if (error.name === 'CastError') {
            return next(createHttpError.BadRequest("ID cửa hàng không hợp lệ"));
        }
        next(error);
    }
};
const rejectShop = async (req, res, next) => {
    try {
        const { reason } = req.body;
        const rejectionReason = reason || "Không đáp ứng yêu cầu của chúng tôi";

        const shop = await Shop.findById(req.params.id);
        if (!shop || shop.is_active === 0) {
            throw createHttpError.NotFound("Không tìm thấy cửa hàng");
        }

        shop.status = "REJECTED";
        shop.reject_reason = rejectionReason;

        await shop.save();
        const Role = require('../models/Role'); // Đảm bảo có model Role
        const sellerRole = await Role.findOne({ name: 'SELLER' });
        if (!sellerRole) {
            console.error("Role SELLER không tồn tại trong DB!");
            throw createHttpError.InternalServerError("Role SELLER missing");
        }

        const user = shop.ownerId;
        if (user && !user.roles.includes(sellerRole._id)) {
            user.roles.push(sellerRole._id);
            await user.save();
            console.log(`User ${user.email} đã được thêm role SELLER`);
        }

        res.json({
            message: "Duyệt thành công! User đã trở thành Seller",
            shop
        });
        // Gửi email thông báo từ chối
        try {
            // Tạo transporter
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                    user: process.env.SERVICE_EMAIL,
                    pass: process.env.SERVICE_PASSWORD
                }
            });

            // Tạo nội dung email
            const mailOptions = {
                from: process.env.SERVICE_EMAIL,
                to: shop.email,
                subject: 'Cập nhật trạng thái đăng ký cửa hàng của bạn',
                html: `
                    <h1>Cập nhật trạng thái đăng ký cửa hàng</h1>
                    <p>Kính gửi ${shop.name},</p>
                    <p>Cảm ơn bạn đã quan tâm đến việc bán hàng trên nền tảng của chúng tôi. Rất tiếc, chúng tôi không thể phê duyệt đăng ký cửa hàng của bạn tại thời điểm này.</p>
                    <p><strong>Lý do từ chối:</strong> ${rejectionReason}</p>
                    <p>Thông tin cửa hàng:</p>
                    <ul>
                        <li><strong>Tên cửa hàng:</strong> ${shop.name}</li>
                        <li><strong>Tên đăng nhập:</strong> ${shop.username}</li>
                        <li><strong>Email:</strong> ${shop.email}</li>
                    </ul>
                    <p>Bạn có thể khắc phục các vấn đề đã nêu và gửi đơn đăng ký mới trong tương lai.</p>
                    <p>Nếu bạn có bất kỳ câu hỏi hoặc cần làm rõ thêm, vui lòng trả lời email này.</p>
                    <p>Trân trọng,<br>Đội ngũ Quản trị</p>
                `
            };

            // Gửi email
            await transporter.sendMail(mailOptions);
            console.log(`Email thông báo từ chối đã gửi đến ${shop.email}`);

        } catch (emailError) {
            // Ghi log lỗi nhưng không làm fail request
            console.error("Không thể gửi email thông báo từ chối:", emailError);
        }

        res.status(200).json({ message: "Từ chối cửa hàng", shop });
    } catch (error) {
        if (error.name === 'CastError') {
            return next(createHttpError.BadRequest("ID cửa hàng không hợp lệ"));
        }
        next(error);
    }
};
const unlockShop = async (req, res, next) => {
    try {
        // Use findById without checking is_active status
        const shop = await Shop.findById(req.params.id);
        if (!shop) {
            throw createHttpError.NotFound("Shop not found");
        }

        // Set is_active to 1 (unlocked)
        shop.is_active = 1;
        await shop.save();

        res.status(200).json({
            message: "Shop unlocked successfully",
            shop
        });
    } catch (error) {
        if (error.name === 'CastError') {
            return next(createHttpError.BadRequest("Invalid shop ID"));
        }
        next(error);
    }
};
const shopController = {
    getAll,
    getById,
    getMyShop,
    create,
    update,
    updateStatus,
    uploadShopImage,
    deleteShop,
    approveShop,
    rejectShop,
    unlockShop
}

module.exports = shopController





