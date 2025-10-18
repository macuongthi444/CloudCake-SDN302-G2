const express = require('express')
const bodyParser = require('body-parser')
const { userController } = require('../controller')


const userRouter = express.Router()
userRouter.use(bodyParser.json())

userRouter.post("/create", userController.create)
userRouter.get("/list", userController.getAllUser)
userRouter.put("/edit/:id", userController.update)
userRouter.delete("/delete/:id", userController.deleteUser)
userRouter.get("/find/:email",userController.existedUser)
userRouter.get("/all", userController.accessAll)

userRouter.get('/:id', userController.getUserById);
module.exports = userRouter;