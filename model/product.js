const mongoose = require("mongoose"),

Schema = mongoose.Schema


const ProductSchema = new mongoose.Schema({
    title:{
        type: String, 
    },
    description:{
        type: String, 
    },
    brand:{
        type: String, 
    },
    aboutBrand:{
        type: String, 
    },
    categoryName:{
        type: Schema.Types.ObjectId,
        ref:'Category'
    },
    SubCategoryName:{
        type:Schema.Types.ObjectId,
        ref:'SubCategory'
    },
    partNo:{
        type: String, 
    },
    quantity:{
        type:Number,
    },
    price:{
        type:Number,
    },
    discountPrice:{
        type:Number,
    }
},{timestamps:true}) 

module.exports = mongoose.model("Product",ProductSchema);