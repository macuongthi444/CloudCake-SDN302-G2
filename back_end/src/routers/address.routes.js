const express = require('express')
const bodyParser = require('body-parser')
const addressController = require('../controller/address.controller')
const authJwt = require('../middlewares/jwtAuth')

const AddressRouter = express.Router()
AddressRouter.use(bodyParser.json())

AddressRouter.get('/list', authJwt.verifyToken, addressController.getList)
AddressRouter.get('/user/:userId', authJwt.verifyToken, addressController.getByUserId)
AddressRouter.get('/find/:id', authJwt.verifyToken, addressController.getById)
AddressRouter.post('/create', authJwt.verifyToken, addressController.create)
AddressRouter.put('/edit/:id', authJwt.verifyToken, addressController.update)
AddressRouter.delete('/delete/:id', authJwt.verifyToken, addressController.deleteById)

module.exports = AddressRouter


