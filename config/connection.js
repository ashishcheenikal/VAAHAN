const mongoose = require('mongoose');
const env = require('dotenv').config()

let config = {
    mongoUri : `mongodb+srv://AshishCheenikal:${process.env.ATLAS_PASSWORD}@cluster0.0p1xuis.mongodb.net/VaaHan`,
    connect: () => {
        mongoose.connect(config.mongoUri).then((res) => {
            console.log("mongodb connected")
        })
    }
}
module.exports = config