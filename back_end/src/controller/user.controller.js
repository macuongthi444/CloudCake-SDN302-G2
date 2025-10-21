const db = require("../models")
const cryto = require('crypto')
const nodemailer = require('nodemailer')
const User = db.user
const Role = db.role
const bcrypt = require("bcrypt")
require('dotenv').config()

// Updated to handle international phone numbers
function formatPhoneNumber(phone) {
    if (!phone) return phone;
    
    // Remove any non-digit characters (like +, spaces, or dashes)
    let cleanPhone = phone.replace(/\D/g, '');
    
    // Handle Vietnamese numbers specifically (local format starting with 0)
    if (cleanPhone.startsWith('0') && cleanPhone.length >= 10 && cleanPhone.length <= 11) {
        return '84' + cleanPhone.substring(1);
    }
    
    // For all other numbers, ensure they start with a country code
    // If phone doesn't start with a valid country code digit (1-9), default to Vietnam country code
    if (!/^[1-9]/.test(cleanPhone)) {
        return '84' + cleanPhone;
    }
    
    return cleanPhone;
}

async function create(req, res, next) {
    try {
        // Lấy thông tin từ request body
        const { firstName, lastName, email, phone, password, roles } = req.body;

        // Tìm role dựa trên tên
        let userRoles = [];
        if (roles && Array.isArray(roles)) {
            const foundRoles = await Role.find({ name: { $in: roles } });
            userRoles = foundRoles.map(role => role._id);
        } else {
            // Nếu không có roles, gán role mặc định
            const defaultRole = await Role.findOne({ name: "MEMBER" });
            if (defaultRole) {
                userRoles = [defaultRole._id];
            }
        }

        // Tạo user mới
        const newUser = new User({
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password,10),
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phone: formatPhoneNumber(req.body.phone),
            roles: userRoles
        })

        // Save into DB
        await newUser.save()
            .then(newDoc => res.status(201).json(newDoc))
            .catch(error => next(error))
    } catch (error) {
        next(error);
    }
}

async function getUserById(req, res, next) {
    try {
        const { id } = req.params; // Lấy ID từ tham số URL
        const user = await User.findById(id); // Tìm người dùng theo ID

        if (!user) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        res.status(200).json(user); // Trả về thông tin người dùng
    } catch (error) {
        next(error); // Xử lý lỗi
    }
}

async function accessAll(req, res, next) {
    res.send("All users access")
}

async function accessByMember(req, res, next) {
    res.send("Member access")
}

async function accessBySeller(req, res, next) {
    res.send("Seller access")
}

async function accessByAdmin(req, res, next) {
    res.send("Admin access")
}
async function getAllUser(req, res, next) {
    try {
        await User.find()
            .then(allDoc => res.status(200).json(allDoc))
            .catch(error => next(error))
    } catch (error) {
        next(error)
    }
}

async function update(req, res, next) {
    try {
      const { id } = req.params
      const updateUser = {
        // Chỉ cập nhật các trường được cung cấp trong request
        ...(req.body.firstName !== undefined && { firstName: req.body.firstName }),
        ...(req.body.lastName !== undefined && { lastName: req.body.lastName }),
        ...(req.body.phone !== undefined && { phone: formatPhoneNumber(req.body.phone) }),
        ...(req.body.email !== undefined && { email: req.body.email }),
        ...(req.body.password !== undefined && { password: req.body.password }),
        ...(req.body.type !== undefined && { type: req.body.type }),
        ...(req.body.status !== undefined && { status: req.body.status })
      }
      
      await User.findByIdAndUpdate(
        id,
        { $set: updateUser },
        { new: true }
      )
        .then(updateDoc => res.status(200).json(updateDoc))
        .catch(error => next(error))
    } catch (error) {
      next(error)
    }
  }

async function deleteUser(req, res, next) {
    try {
        const { id } = req.params
        await User.findByIdAndDelete(id)
            .then(deleteDoc => res.status(200).json({
                "message": "Delete successful",
                deleteDoc
            }))
            .catch(error => next(error))
    } catch (error) {
        next(error)
    }
}

async function existedUser(req, res, next) {
    try {
        const { email } = req.params
        await User.findOne({ email: email })
            .then(exitsDoc => res.status(200).json(exitsDoc))
            .catch(error => next(error))
    } catch (error) {
        next(error)
    }
}

async function forgotPassword(req, res, next) {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Email không tồn tại' });
        }

        // Tạo mã xác nhận (OTP) gồm 6 số
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        const resetTokenExpire = Date.now() + 10 * 60 * 1000; // 10 phút

        // Lưu OTP và thời gian hết hạn vào database
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpire = resetTokenExpire;
        await user.save();

        // Gửi email chứa mã OTP
            const transporter = nodemailer.createTransport({
                service: 'gmail',
                auth: {
                user: process.env.SERVICE_EMAIL, // Thay bằng email của bạn
                pass: process.env.SERVICE_PASSWORD  // Thay bằng mật khẩu email
                }
            });

            const mailOptions = {
            from: `"CloudCake" `,
            to: user.email,
            subject: 'CloudCake - Đặt lại mật khẩu của bạn',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
                    <div style="background-color: #ffffff; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <div style="text-align: center;">
                            <img src="https://via.placeholder.com/150x50?text=CloudCake" alt="CloudCake Logo" style="max-width: 150px; margin-bottom: 20px;">
                        </div>
                        <h2 style="color: #15803d; font-size: 24px; margin-bottom: 20px; text-align: center;">Đặt lại mật khẩu CloudCake</h2>
                        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            Xin chào ${user.firstName || 'Quý khách'},<br>
                            Bạn đã yêu cầu đặt lại mật khẩu cho tài khoản CloudCake của mình. Vui lòng sử dụng mã OTP dưới đây để tiếp tục:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <span style="display: inline-block; background-color: #15803d; color: #ffffff; font-size: 24px; font-weight: bold; padding: 10px 20px; border-radius: 5px; letter-spacing: 2px;">${resetToken}</span>
                        </div>
                        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                            Mã OTP này có hiệu lực trong <strong>10 phút</strong>. Vui lòng nhập mã này vào trang đặt lại mật khẩu để hoàn tất quá trình.
                        </p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="http://localhost:3000/reset-password" style="display: inline-block; background-color: #15803d; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 5px; font-size: 16px; font-weight: bold;">Đặt lại mật khẩu ngay</a>
                        </div>
                        <p style="color: #333333; font-size: 16px; line-height: 1.6;">
                            Trân trọng,<br>
                            Đội ngũ CloudCake
                        </p>
                    </div>
                    <div style="text-align: center; color: #999999; font-size: 12px; margin-top: 20px;">
                        &copy; 2025 CloudCake. All rights reserved.
                    </div>
                </div>
            `
        };

            await transporter.sendMail(mailOptions);

            res.status(200).json({ message: 'Mã xác nhận đã được gửi vào email' });
    } catch (error) {
        next(error);
    }
}

async function resetPassword(req, res, next) {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'Email không tồn tại' });
        }

        // Kiểm tra mã OTP và thời gian hết hạn
        if (!user.resetPasswordToken || user.resetPasswordExpire < Date.now() || user.resetPasswordToken !== otp) {
            return res.status(400).json({ message: 'Mã xác nhận không hợp lệ hoặc đã hết hạn' });
        }

        // Cập nhật mật khẩu mới
        user.password = bcrypt.hashSync(newPassword, parseInt(process.env.PASSWORD_KEY));
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();

        res.status(200).json({ message: 'Mật khẩu đã được đặt lại thành công' });
    } catch (error) {
        next(error);
    }
}

const userController = {
    create,
    getAllUser,
    update,
    deleteUser,
    existedUser,
    accessAll,
    accessByMember,
    accessByAdmin,
    accessBySeller,
    getUserById,
    forgotPassword,
    resetPassword,
}

module.exports = userController