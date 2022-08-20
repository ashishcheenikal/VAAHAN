const mongoose= require("mongoose");

const subCategorySchema = mongoose.Schema({
    SubCategoryName: {
        type: String,
        required: true,
    },
    Category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required:true
    },
},{timestamp:true})

module.exports = mongoose.model('SubCategory', subCategorySchema);