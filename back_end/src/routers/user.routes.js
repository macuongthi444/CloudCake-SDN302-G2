const express = require('express')
const bodyParser = require('body-parser')
const { userController } = require('../controller')
const authJwt = require('../middlewares/jwtAuth')


const userRouter = express.Router()
userRouter.use(bodyParser.json())

userRouter.post("/create", userController.create)
userRouter.get("/list", userController.getAllUser)
userRouter.put("/edit/:id", userController.update)
userRouter.delete("/delete/:id", userController.deleteUser)
userRouter.get("/find/:email",userController.existedUser)
userRouter.get("/all", userController.accessAll)
userRouter.get("/member", [authJwt.verifyToken] ,userController.accessByMember)
userRouter.get("/admin", [authJwt.verifyToken], [authJwt.isAdmin] ,userController.accessByAdmin)
userRouter.get("/seller", [authJwt.verifyToken], [authJwt.isSeller] ,userController.accessBySeller)


userRouter.get('/:id', userController.getUserById);

userRouter.post('/forgot-password', userController.forgotPassword);
userRouter.post('/reset-password', userController.resetPassword);
module.exports = userRouter;