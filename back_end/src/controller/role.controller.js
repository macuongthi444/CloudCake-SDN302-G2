const db = require("../models")
const Role = db.role

async function create(req, res, next) {
    try {
        const newRole = new Role({
            name: req.body.name,
            permissions: req.body.permissions,
            description: req.body.description,
            created_at: new Date(),
            updated_at: new Date()
        })

        // Save into DB
        await newRole.save()
            .then(newDoc => res.status(201).json(newDoc))
            .catch(error => next(error))
    } catch (error) {
        next(error)
    }
}
async function getAllRoles(req, res, next) {
    try {
        const roles = await Role.find(); 
        res.status(200).json(roles);
    } catch (error) {
        next(error);
    }
}

const userController = {
    create,
    getAllRoles,
}

module.exports = userController
