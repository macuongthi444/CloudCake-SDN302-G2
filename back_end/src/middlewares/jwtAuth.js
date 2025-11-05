const jwt = require('jsonwebtoken')
const config = require('../config/auth.config')
const db = require("../models")
const User = db.user
const createHttpError = require('http-errors')

// Middleware to verify JWT token
const verifyToken = async (req, res, next) => {
    try {
        let token = req.headers["x-access-token"] || req.headers["authorization"];

        if (!token) {
            throw createHttpError.Unauthorized("No token provided")
        }

        // Remove "Bearer " if present
        if (token.startsWith('Bearer ')) {
            token = token.slice(7, token.length);
        }

        // Verify token
        const decoded = jwt.verify(token, config.secret);
        
        // Find user and populate roles
        const user = await User.findById(decoded.id).populate('roles', '-__v');
        
        if (!user) {
            throw createHttpError.Unauthorized("User not found")
        }

        // Attach user info to request
        req.userId = decoded.id;
        req.user = user;
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(createHttpError.Unauthorized("Invalid token"))
        }
        if (error.name === 'TokenExpiredError') {
            return next(createHttpError.Unauthorized("Token expired"))
        }
        next(error);
    }
}

// Middleware to check if user has admin role
const isAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.roles) {
            return next(createHttpError.Forbidden("Require Admin role"))
        }

        const userRoles = req.user.roles;
        let isAdminUser = false;

        for (let i = 0; i < userRoles.length; i++) {
            if (userRoles[i].name === "ADMIN") {
                isAdminUser = true;
                break;
            }
        }

        if (!isAdminUser) {
            return next(createHttpError.Forbidden("Require Admin role"))
        }

        next();
    } catch (error) {
        next(error);
    }
}

// Middleware to check if user has seller role
const isSeller = async (req, res, next) => {
    try {
        if (!req.user || !req.user.roles) {
            return next(createHttpError.Forbidden("Require Seller role"))
        }

        const userRoles = req.user.roles;
        let isSellerUser = false;

        for (let i = 0; i < userRoles.length; i++) {
            if (userRoles[i].name === "SELLER") {
                isSellerUser = true;
                break;
            }
        }

        if (!isSellerUser) {
            return next(createHttpError.Forbidden("Require Seller role"))
        }

        next();
    } catch (error) {
        next(error);
    }
}

// Middleware to check if user has seller or admin role
const isSellerOrAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.roles) {
            return next(createHttpError.Forbidden("Require Seller or Admin role"))
        }

        const userRoles = req.user.roles;
        let hasPermission = false;

        for (let i = 0; i < userRoles.length; i++) {
            if (userRoles[i].name === "SELLER" || userRoles[i].name === "ADMIN") {
                hasPermission = true;
                break;
            }
        }

        if (!hasPermission) {
            return next(createHttpError.Forbidden("Require Seller or Admin role"))
        }

        next();
    } catch (error) {
        next(error);
    }
}

const authJwt = {
    verifyToken,
    isAdmin,
    isSeller,
    isSellerOrAdmin
}

module.exports = authJwt


