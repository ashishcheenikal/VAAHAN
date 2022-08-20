const mongoose = require('mongoose');

let config = {
    mongoUri : 'mongodb://localhost:27017/VaaHan',
    connect: () => {
        mongoose.connect(config.mongoUri).then((res) => {
            console.log("mongodb connected")
        })
    }
}
module.exports = config