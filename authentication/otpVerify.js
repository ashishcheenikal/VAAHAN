const Promise = require("promise");
const env = require('dotenv').config()

config = {
  serviceID: process.env.serviceID,
  accountSID: process.env.accountSID,
  authToken: process.env.authToken,
};

const client = require("twilio")(config.accountSID, config.authToken);

module.exports = {
  getOtp: (number) => {
    console.log(number);
    number = "+91" + number;
    return new Promise((resolve, reject) => {
      client.verify.v2
        .services(process.env.serviceID)
        .verifications.create({ to: number, channel: "sms" })
        .then((response) => {
          resolve(response);
          console.log("promise done");
        });
    });
  },
  checkOtp: (otp, number) => {
    console.log("checkotp working");
    number = "+91" + number;
    return new Promise((resolve, reject) => {
      client.verify.v2
        .services(process.env.serviceID)
        .verificationChecks.create({ to: number, code: otp })
        .then((verification_check) => {
          console.log(verification_check.status);
          resolve(verification_check.status);
        });
    });
  },
};
