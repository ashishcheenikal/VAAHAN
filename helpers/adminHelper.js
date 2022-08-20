const mongoose = require("mongoose");
const { resolve, reject } = require("promise");
const categoryModel = require("../model/category");
const subCategoryModel = require("../model/subCategory");
const productModel = require("../model/product");
const { populate } = require("../model/usersignup");
const userModel = require("../model/usersignup");
const couponModel = require("../model/coupon");
const orderModel = require("../model/order")
const { response } = require("../app");

module.exports = {
  addCategory: (data) => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      let categoryName = data.categoryName.toUpperCase();
      let categoryCode = data.categoryCode.toUpperCase();
      let exist = await categoryModel.findOne({ categoryCode: categoryCode });
      if (exist) {
        response.exist = true;
        resolve(response);
        console.log(response);
      } else {
        newCategory = new categoryModel({
          categoryName,
          categoryCode,
        });
        newCategory.save().then((data) => {
          response.exist = false;
          response.data = data;
          resolve(response);
        });
      }
    });
  },
  showCategory: () => {
    return new Promise(async (resolve, reject) => {
      let category = await categoryModel.find({}).lean();
      resolve(category);
    });
  },
  getCategory: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const cat_id = mongoose.Types.ObjectId(id);
        let category = await categoryModel.findOne({ _id: cat_id }).lean();
        resolve(category);
      } catch (err) {
        reject(err);
      }
    });
  },
  editCategory: (data) => {
    return new Promise(async (resolve, reject) => {
      data.categoryName = data.categoryName.toUpperCase();
      let category = await categoryModel.findById(data.id);
      let status = {
        check: false,
      };
      if (!category) {
        status.check = true;
        resolve(data);
      } else {
        categoryModel
          .findByIdAndUpdate(data.id, { categoryName: data.categoryName })
          .then((data) => {
            resolve(data);
          });
      }
    });
  },
  deleteCategory: (id) => {
    return new Promise((resolve, reject) => {
      try {
        categoryModel.findByIdAndDelete(id).then((data) => {
          resolve(data);
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  addSubCategory: (data) => {
    let { SubCategoryName, Category } = data;
    SubCategoryName = SubCategoryName.toUpperCase();
    return new Promise((resolve, reject) => {
      newSubCatagory = new subCategoryModel({
        SubCategoryName,
        Category,
      });

      newSubCatagory.save().then((subCatagory) => {
        resolve(subCatagory);
      });
    });
  },
  showSubCategory: () => {
    return new Promise(async (resolve, reject) => {
      let subCategory = await subCategoryModel.find({}).lean();
      resolve(subCategory);
    });
  },
  getSubCategory: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        const cat_id = mongoose.Types.ObjectId(id);
        let subCategory = await subCategoryModel
          .find({ Category: cat_id })
          .lean();
        resolve(subCategory);
      } catch (err) {
        reject(err);
      }
    });
  },
  addProducts: (data) => {
    let {
      title,
      description,
      brand,
      aboutBrand,
      categoryName,
      SubCategoryName,
      partNo,
      quantity,
      price,
      discountPrice,
    } = data;
    return new Promise((resolve, reject) => {
      let product = new productModel({
        title,
        description,
        brand,
        aboutBrand,
        categoryName,
        SubCategoryName,
        partNo,
        quantity,
        price,
        discountPrice,
      });
      product.save().then((data) => {
        resolve(data._id);
      });
    });
  },
  showProduct: () => {
    return new Promise(async (resolve, reject, next) => {
      try {
        const product = await productModel
          .find({})
          .populate("categoryName")
          .populate("SubCategoryName")
          .lean();
        resolve(product);
      } catch (err) {
        reject(err);
      }
    });
  },
  getProduct: (id) => {
    return new Promise(async (resolve, reject, next) => {
      try {
        let Pro_id = mongoose.Types.ObjectId(id);
        const product = await productModel
          .findById({ _id: Pro_id })
          .populate()
          .lean();
        resolve(product);
      } catch (err) {
        reject(err);
      }
    });
  },
  editProduct: (data) => {
    return new Promise(async (resolve, reject) => {
      data.title = data.title.toUpperCase();
      let product = await productModel.findById(data.id);
      let status = {
        check: false,
      };
      if (!product) {
        status.check = true;
        resolve(data);
      } else {
        productModel
          .findByIdAndUpdate(data.id, {
            title: data.title,
            description: data.description,
            brand: data.brand,
            aboutBrand: data.aboutBrand,
            categoryName: data.categoryName,
            SubCategoryName: data.SubCategoryName,
            partNo: data.partNo,
            quantity: data.quantity,
            price: data.price,
            discountPrice: data.discountPrice,
          })
          .then((data) => {
            resolve(data);
          });
      }
    });
  },
  deleteProduct: (id) => {
    return new Promise((resolve, reject) => {
      try {
        productModel.findByIdAndDelete(id).then((data) => {
          resolve(data);
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  getAllUser: () => {
    return new Promise(async (resolve, reject) => {
      try {
        let users = await userModel.find().lean();
        resolve(users);
      } catch (err) {
        reject(err);
      }
    });
  },
  changeStatus: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await userModel.findById(id).lean();
        if (user.status) {
          userModel.findByIdAndUpdate(id, { status: false }).then((data) => {
            resolve(data);
          });
        } else {
          userModel.findByIdAndUpdate(id, { status: true }).then((data) => {
            resolve(data);
          });
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  addNewCoupon: (couponData) => {
    return new Promise(async (resolve, reject) => {
      let { name, code, description, percentage } = couponData;
      code = code.toUpperCase();
      let response = {};
      let coupon = await couponModel.findOne({ code: code });
      if (coupon) {
        response.exist = true;
        resolve(response);
      } else {
        newCoupon = new couponModel({
          name,
          code,
          description,
          percentage,
        });
        newCoupon.save().then((data) => {
          response.exist = false;
          resolve(response);
        });
      }
    });
  },
  getAllCoupons: () => {
    return new Promise(async (resolve, reject) => {
      couponModel
        .find({})
        .lean()
        .then((coupons) => {
          resolve(coupons);
        });
    });
  },
  editCoupon: (data, id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let codeById = await couponModel.findById(id);
        let code1 = await couponModel.findOne({ code: data.code });
        if (codeById.code === data.code || !code1) {
          let code = data.code.toUpperCase();
          couponModel
            .findByIdAndUpdate(id, {
              name: data.name,
              code: code,
              description: data.description,
              percentage: data.percentage,
            })
            .then((response) => {
              resolve(response);
            });
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  deleteCoupon: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        couponModel.findByIdAndDelete(id).then((response) => {
          console.log(response);
          resolve(response);
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  changeShipping: (id, data) => {
    return new Promise((resolve, reject) => {
        orderModel
          .findOneAndUpdate({ _id: id }, { deliveryStatus: data.shipping })
          .then((data) => {
            resolve();
          })
          .catch((err) => {
            reject(err);
          });
    });
  },
  getAllOrders: () => {
    return new Promise(async (resolve, reject) => {
      let response = {};
      orderModel
        .find({})
        .populate("user")
        .populate("orderItems.product")
        .populate("orderItems.product.categoryName")
        .populate("deliveryDetails")
        .lean()
        .then((order) => {
          resolve(order);
        });
    });
  }
};
