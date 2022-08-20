const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
  adminname: {
    type: String,
    required: true,
  },
  adminemail: {
    type: String,
    required: true,
  },
  adminnumber: {
    type: String,
    required: true,
  },
  adminpassword: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("admin", AdminSchema);
