const createHttpError = require('http-errors')
const db = require('../models')
const Address = db.address

async function getList(req, res, next) {
  try {
    const addresses = await Address.find().sort({ createdAt: -1 })
    res.status(200).json(addresses)
  } catch (error) {
    next(error)
  }
}

async function getByUserId(req, res, next) {
  try {
    const { userId } = req.params
    const addresses = await Address.find({ user_id: userId, status: true }).sort({ createdAt: -1 })
    res.status(200).json(addresses)
  } catch (error) {
    next(error)
  }
}

async function getById(req, res, next) {
  try {
    const { id } = req.params
    const address = await Address.findById(id)
    if (!address) {
      throw createHttpError.NotFound('Address not found')
    }
    res.status(200).json(address)
  } catch (error) {
    next(error)
  }
}

async function create(req, res, next) {
  try {
    const { user_id, address_line1, address_line2, city, district, ward, postalCode, phone, country } = req.body
    if (!user_id || !address_line1 || !phone) {
      throw createHttpError.BadRequest('user_id, address_line1, and phone are required')
    }
    const newAddress = new Address({
      user_id,
      address_line1,
      address_line2,
      city,
      district,
      ward,
      postalCode,
      phone,
      country: country || 'Vietnam',
      status: true
    })
    await newAddress.save()
    res.status(201).json(newAddress)
  } catch (error) {
    next(error)
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params
    const { address_line1, address_line2, city, district, ward, postalCode, phone, country, status } = req.body
    const address = await Address.findById(id)
    if (!address) {
      throw createHttpError.NotFound('Address not found')
    }
    if (address_line1 !== undefined) address.address_line1 = address_line1
    if (address_line2 !== undefined) address.address_line2 = address_line2
    if (city !== undefined) address.city = city
    if (district !== undefined) address.district = district
    if (ward !== undefined) address.ward = ward
    if (postalCode !== undefined) address.postalCode = postalCode
    if (phone !== undefined) address.phone = phone
    if (country !== undefined) address.country = country
    if (status !== undefined) address.status = status
    await address.save()
    res.status(200).json(address)
  } catch (error) {
    next(error)
  }
}

async function deleteById(req, res, next) {
  try {
    const { id } = req.params
    const address = await Address.findByIdAndDelete(id)
    if (!address) {
      throw createHttpError.NotFound('Address not found')
    }
    res.status(200).json({ message: 'Address deleted successfully', address })
  } catch (error) {
    next(error)
  }
}

module.exports = {
  getList,
  getByUserId,
  getById,
  create,
  update,
  deleteById
}

