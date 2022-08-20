
const mongoose = require('mongoose');

const Schema = mongoose.Schema ;

const couponSchema = new Schema({
    name: {
        type: String,
    },
    code:{
        type: String,
    },
    description:{
        type: String,
    },
    percentage:{
        type: Number,
    },
    users:[
        {
            type:Schema.Types.ObjectId,
            ref: "User"
        }
    ],
},
{
    timestamps: true
})

module.exports = mongoose.model('Coupon',couponSchema);