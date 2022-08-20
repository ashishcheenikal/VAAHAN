const Promise = require("promise");
const mongoose = require("mongoose");
const usermodel = require("../model/usersignup");
const bcrypt = require("bcrypt");
const { response } = require("../app");
const { reject, resolve } = require("promise");

module.exports = {
  dosignup: (userData) => {
    console.log(userData);
    return new Promise(async (resolve, reject) => {
      let { name, email, number, password } = userData;
      let status = true;
      password = await bcrypt.hash(password, 10);
      user = new usermodel({
        name,
        email,
        number,
        password,
        status
      });

      user
        .save()
        .then((data) => {
          console.log(data);
          resolve(data);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  },

  dologin: (logindata) => {
    const { email, password } = logindata;
    return new Promise(async (resolve, reject) => {
      let user = await usermodel.findOne({ email });
      const response = {
        usernotfound: false,
      };
      if (user) {
        bcrypt.compare(password, user.password, (err, valid) => {
          if (valid) {
            response.valid = true;
            response.user = user;
            resolve(response);
          } else {
            response.valid = false;
            resolve(response);
          }
        });
      } else {
        response.usernotfound = true;
        resolve(response);
      }
    });
  },
  userexist: (userdata) => {
    return new Promise(async (resolve, reject) => {
      let { name, email, number, password } = userdata;
      const response = {};
      let user = await usermodel.findOne({ email });
      if (user) {
        response.alreadyregistered = true;
        resolve(response);
      } else {
        response.alreadyregistered = false;
        resolve(response);
      }
    });
  },
  mobileExist: (number) => {
    return new Promise(async (resolve, reject) => {
      const response = {};
      let user = await usermodel.findOne({number});
      if (user) {
        response.user = user;
        response.userfound = true;
        resolve(response);
      } else {
        response.userfound = false;
        resolve(response);
      }
    });
  },
};
