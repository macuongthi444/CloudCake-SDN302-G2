const express = require('express')
const bodyParser = require('body-parser')
const { categoryController } = require('../controller')
const authJwt = require('../middlewares/jwtAuth')

const CategoryRouter = express.Router()
CategoryRouter.use(bodyParser.json())

// Public routes
CategoryRouter.get("/list", categoryController.getAll)
CategoryRouter.get("/find/:id", categoryController.getById)

// Admin only routes
CategoryRouter.post("/create", authJwt.verifyToken, authJwt.isAdmin, categoryController.create)
CategoryRouter.put("/edit/:id", authJwt.verifyToken, authJwt.isAdmin, categoryController.update)
CategoryRouter.delete("/delete/:id", authJwt.verifyToken, authJwt.isAdmin, categoryController.deleteById)

module.exports = CategoryRouter














