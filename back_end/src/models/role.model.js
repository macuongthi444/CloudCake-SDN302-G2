const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const roleSchema = new Schema({
  name: {
    type: String
  },
  permissions: {
    type: String
  },
  description: {
    type: String
  },
  created_at: {
    type: String
  },
  updated_at: {
    type: String
  }
});

const Role = mongoose.model('Role', roleSchema);
module.exports = Role;