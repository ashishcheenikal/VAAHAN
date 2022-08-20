const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      
    },
    email: {
      type: String,
      
    },
    number: {
      type: String,
      
    },
    password: {
      type: String,
      
    },
    status:{
      type: Boolean,
      required: true
    },
    atlNumber:{
      type: String,
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
