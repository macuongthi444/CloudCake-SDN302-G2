const express = require('express')
const bodyParser = require('body-parser')
const authJwt = require('../middlewares/jwtAuth')
const orderController = require('../controller/order.controller')
const vnpayController = require('../controller/vnpay.controller')

const OrderRouter = express.Router()
OrderRouter.use(bodyParser.json())

OrderRouter.post('/create-from-cart', authJwt.verifyToken, orderController.createFromCart)
OrderRouter.get('/find/:id', authJwt.verifyToken, orderController.getById)
OrderRouter.get('/user/:userId', authJwt.verifyToken, orderController.getByUserId)

// VNPay callback route (public, no auth required)
// Handle both correct format (?params) and incorrect format (&params)
OrderRouter.get('/vnpay-callback*', (req, res, next) => {
  console.log('\n========== VNPay: CALLBACK ROUTE HIT ==========')
  console.log('Original req.url:', req.url)
  console.log('Original req.path:', req.path)
  console.log('Original req.query:', req.query)
  console.log('Original req.originalUrl:', req.originalUrl)
  
  // If URL has params appended with & instead of ?, fix it
  // VNPay sometimes redirects to: /vnpay-callback&vnp_TmnCode=... instead of /vnpay-callback?vnp_TmnCode=...
  if (req.url.includes('&vnp_') && !req.url.includes('?vnp_')) {
    console.log('⚠️ VNPay callback URL has incorrect format (using & instead of ?), fixing...')
    
    // Parse the malformed URL
    const urlParts = req.url.split('&')
    if (urlParts.length > 1) {
      // First part is the path, rest are query params
      const path = urlParts[0]
      const queryString = urlParts.slice(1).join('&')
      
      // Reconstruct URL with proper query string
      req.url = path + '?' + queryString
      console.log('Fixed req.url:', req.url)
      
      // Re-parse query using url module
      const url = require('url')
      const parsed = url.parse(req.url, true)
      req.query = parsed.query
      console.log('Fixed req.query:', req.query)
    }
  } else if (req.url.includes('?vnp_')) {
    console.log('✅ VNPay callback URL format is correct')
  }
  
  console.log('Final req.url:', req.url)
  console.log('Final req.query:', req.query)
  console.log('==========================================\n')
  
  return vnpayController.returnCallback(req, res, next)
})

module.exports = OrderRouter




