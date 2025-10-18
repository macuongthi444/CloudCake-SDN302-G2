const createHttpError = require('http-errors');
const db = require("../models");
const User = db.user;
const Role = db.role;
const ROLES = db.ROLES; 

async function checkExistUser(req, res, next) {
    try {
        // Kiểm tra email và password
        if (!req.body.email || !req.body.password) {
            throw createHttpError.BadRequest("Email or password is required");
        }

        // Kiểm tra xem email đã tồn tại chưa
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
            throw createHttpError.BadRequest("This email already exists");
        }

        next(); 
    } catch (error) {
        next(error); 
    }
}

async function checkExistRoles(req, res, next) {
    try {
        // Kiểm tra vai trò nếu có
        if (req.body.roles) {
            for (let i = 0; i < req.body.roles.length; i++) {
                if (!ROLES.includes(req.body.roles[i])) {
                    throw createHttpError.BadRequest(`Role '${req.body.roles[i]}' does not exist`);
                }
            }
        }

        next(); 
    } catch (error) {
        next(error); 
    }
}

const VerifySignUp = {
    checkExistUser,
    checkExistRoles
};

module.exports = VerifySignUp; 