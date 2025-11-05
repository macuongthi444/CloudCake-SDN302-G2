const express = require('express');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const httpErrors = require('http-errors');
const db = require('./src/models');
const http = require('http');

require('dotenv').config();
const {
  AuthRouter,
  UserRouter,
  RoleRouter,
  PaymentRouter,
  CartRouter,
  ProductRouter,
  ProductVariantRouter,
  CategoryRouter,
  ShopRouter,
} = require('./src/routers');

const session = require('express-session');
const cors = require('cors');
const path = require('path');
const fs = require('fs');


// Khởi tạo Express và server
const app = express();
const server = http.createServer(app);

const corsOrigins = process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000'];
const corsMethods = process.env.CORS_METHODS ? process.env.CORS_METHODS.split(',') : ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];
const corsHeaders = process.env.CORS_HEADERS ? process.env.CORS_HEADERS.split(',') : ['Content-Type', 'Authorization', 'x-access-token'];


app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(cors({
  // Cho phép truy cập từ cả localhost:3000 và IP cụ thể
  origin: corsOrigins,
  credentials: true,
  methods: corsMethods,
  allowedHeaders: corsHeaders
}));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'default_secret',
    resave: false,
    saveUninitialized: true,
  })
);
// Định tuyến root
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Welcome to RESTFul API - NodeJS",
  });
});

// Đăng ký các route
app.use('/api/auth', AuthRouter);
app.use('/api/user', UserRouter);
app.use('/api/role', RoleRouter);
app.use('/api/payment', PaymentRouter);
app.use('/api/cart', CartRouter);
app.use('/api/product', ProductRouter);
app.use('/api/product-variant', ProductVariantRouter);
app.use('/api/category', CategoryRouter);
app.use('/api/shop', ShopRouter);


// Kiểm soát lỗi
app.use(async (req, res, next) => {
  next(httpErrors.NotFound());
});
app.use((err, req, res, next) => {
  // Log error details for debugging
  console.error('Error occurred:', {
    status: err.status || 500,
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method,
    body: req.body
  });

  res.status(err.status || 500).json({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});


// Khởi động server
server.listen(process.env.PORT || 9999, process.env.HOST_NAME || 'localhost', () => {
    console.log(`Server is running on http://${process.env.HOST_NAME || 'localhost'}:${process.env.PORT || 9999}`);
  db.connectDB();
  
});

module.exports = server;