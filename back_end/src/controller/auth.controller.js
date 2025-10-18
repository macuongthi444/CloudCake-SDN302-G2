const db = require("../models")
const bcrypt = require("bcrypt")
const User = db.user
const Role = db.role
const jwt = require('jsonwebtoken')
const createHttpError = require('http-errors')
const config = require("../config/auth.config")
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
require('dotenv').config();

function formatPhoneNumber(phone) {
    if (!phone.startsWith('84') && phone.startsWith('0')) {
        return '84' + phone.substring(1); // Thay 0 bằng 84
    }
    return phone;
}


async function signUp(req, res, next) {
    try {
        const newUser = new User({
            email: req.body.email,
            password: bcrypt.hashSync(req.body.password, parseInt(process.env.PASSWORD_KEY)),
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            phone: formatPhoneNumber(req.body.phone)
        })

        if (req.body.roles) {
            // Admin add new User
            const roles = await Role.find({ name: { $in: req.body.roles } }).exec()
            // Update newUser
            newUser.roles = roles.map(r => r._id)
            await User.create(newUser)
                .then(createdUser => res.status(201).json(createdUser))
        } else {
            // Visitor create new user
            const role = await Role.findOne({ name: "MEMBER" }).exec()
            newUser.roles = [role._id]
            await User.create(newUser)
                .then(createdUser => res.status(201).json(createdUser))
        }
    } catch (error) {
        next(error)
    }
}

async function signIn(req, res, next) {
    try {
        if (!req.body.email || !req.body.password)
            throw createHttpError.BadRequest("Email or password is required")

        // Find user and populate roles
        const existUser = await User.findOne({ email: req.body.email }).populate("roles", '-__v')
        if (!existUser)
            throw createHttpError.BadRequest(`Email ${req.body.email} not registered`)

        const isMatchPassword = bcrypt.compareSync(req.body.password, existUser.password)
        if (!isMatchPassword)
            throw createHttpError.BadRequest("Password incorrect")

        // Generate AccessToken - using JsonWebToken
        const token = jwt.sign({ id: existUser._id }, config.secret, {
            algorithm: "HS256",
            expiresIn: config.jwtExpiration
        })


        // Process roles with better error handling
        const authorities = []
        if (existUser.roles && existUser.roles.length > 0) {
            for (let i = 0; i < existUser.roles.length; i++) {
                const role = existUser.roles[i];
                if (role && role.name) {
                    authorities.push("ROLE_" + role.name);
                } else {
                    // Default role if structure is invalid
                    console.warn("Found invalid role structure:", role);
                    authorities.push("MEMBER");
                }
            }
        } else {
            // Default role if no roles found
            console.warn("No roles found for user, adding default MEMBER role");
            authorities.push("MEMBER");
        }


        res.status(200).json({
            id: existUser._id,
            email: existUser.email,
            accessToken: token,
            roles: authorities
        })
    } catch (error) {
        next(error)
    }
}

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `http://${process.env.HOST_NAME}:${process.env.PORT}/api/auth/google/callback`
}, async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ email: profile.emails[0].value });

        if (!user) {
            const newUser = new User({
                email: profile.emails[0].value,
                firstName: profile.name.givenName || 'Google',
                lastName: profile.name.familyName || 'User',
                password: bcrypt.hashSync(Math.random().toString(36).slice(-8), 10),
                phone: '84912345678' // Số điện thoại mặc định
            });

            // Gán quyền mặc định
            const role = await Role.findOne({ name: "MEMBER" });
            newUser.roles = [role._id]; // Cập nhật thuộc tính roles cho newUser

            await newUser.save(); // Lưu người dùng mới
            user = newUser; // Gán user mới vào biến user
        }

        return done(null, user);
    } catch (error) {
        return done(error, null);
    }
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id);
    done(null, user);
});

// Controller xử lý đăng nhập bằng Google
function googleAuth(req, res, next) {
    passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
}

function googleAuthCallback(req, res, next) {
    passport.authenticate('google', { session: false }, async (err, user) => {
        if (err || !user) {
            console.error('Google auth error:', err); // Ghi log lỗi
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=true`);
        }

        try {
            // Fetch roles more explicitly
            const populatedUser = await User.findById(user._id).populate('roles');

            // Generate JWT token
            const token = jwt.sign({ id: user._id }, config.secret, {
                algorithm: "HS256",
                expiresIn: config.jwtExpiration
            });

            // Process roles with better handling
            const authorities = [];
            if (populatedUser.roles && populatedUser.roles.length > 0) {
                for (let i = 0; i < populatedUser.roles.length; i++) {
                    const role = populatedUser.roles[i];
                    if (role && role.name) {
                        authorities.push("ROLE_" + role.name);
                    } else {
                        authorities.push("MEMBER");
                    }
                }
            } else {
                authorities.push("MEMBER");
            }


            // Create user data object
            const userData = {
                id: user._id.toString(),
                email: user.email,
                accessToken: token,
                roles: authorities
            };

            const userDataEncoded = encodeURIComponent(JSON.stringify(userData));
            res.redirect(`${process.env.FRONTEND_URL}/login?googleAuth=${userDataEncoded}`);
        } catch (error) {
            console.error("Error in Google auth callback:", error);
            return res.redirect(`${process.env.FRONTEND_URL}/login?error=true`);
        }
    })(req, res, next);
}



const authController = {
    signUp,
    signIn,
    googleAuth,
    googleAuthCallback
}

module.exports = authController