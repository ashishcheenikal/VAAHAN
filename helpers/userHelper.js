const Promise = require("promise");
const mongoose = require("mongoose");
// const categoryModel = require("../model/category");
// const subCategoryModel = require("../model/subCategory");
const productModel = require("../model/product");
// const { populate } = require("../model/usersignup");
const userModel = require("../model/usersignup");
const cartModel = require("../model/cart");
// const { response } = require("../app");
// const {
//   ConversationList,
// } = require("twilio/lib/rest/conversations/v1/conversation");
// const userAuth = require("../authentication/userAuth");
const addressModel = require("../model/address");
const orderModel = require("../model/order");
const wishListModel = require("../model/wishList");
const couponModel = require("../model/coupon");
const Razorpay = require("razorpay");
// const { reject } = require("promise");
// const { nextTick } = require("process");
// test

const env = require('dotenv').config()

var instance = new Razorpay({
  key_id: process.env.razor_key_id,
  key_secret: process.env.razor_key_secret,
});

const Helper = {
  addToCart: (userId, proId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let user_Id = mongoose.Types.ObjectId(userId);
        const response = {
          duplicate: false,
        };
        let cart = await cartModel.findOne({ user: user_Id });
        if (cart) {
          let cartProduct = await cartModel.findOne({
            user: user_Id,
            "cartItems.product": proId,
          });
          if (cartProduct) {
            cartModel
              .updateOne(
                { user: userId, "cartItems.product": proId },
                { $inc: { "cartItems.$.quantity": 1 } }
              )
              .then((data) => {
                response.inc = true;
                resolve(response);
              });
          } else {
            let cartArray = { product: proId, quantity: 1 };
            cartModel
              .findOneAndUpdate(
                { user: user_Id },
                { $push: { cartItems: cartArray } }
              )
              .then(async (data) => {
                let wishList = await wishListModel.findOne({
                  user: user_Id,
                  "wishListItems.product": proId,
                });
                if (wishList) {
                  wishListModel
                    .updateOne(
                      { user: userId },
                      {
                        $pull: {
                          wishListItems: { product: proId },
                        },
                      }
                    )
                    .then((data) => {
                      response.added = false;
                      response.data = data;
                      resolve(response);
                    });
                }
                resolve(data);
              });
          }
        } else {
          let product = proId;
          let quantity = 1;
          cart = new cartModel({
            user: userId,
            cartItems: [
              {
                product,
                quantity,
              },
            ],
          });
          cart.save().then(async (data) => {
            let wishList = await wishListModel.findOne({
              user: user_Id,
              "wishListItems.product": proId,
            });
            if (wishList) {
              wishListModel
                .updateOne(
                  { user: userId },
                  {
                    $pull: {
                      wishListItems: { product: proId },
                    },
                  }
                )
                .then((data) => {
                  response.added = false;
                  response.data = data;
                  resolve(response);
                });
            }
            resolve(data);
          });
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  showCartProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let response = {};
        let cartProducts = await cartModel
          .findOne({ user: userId })
          .populate("cartItems.product")
          .lean();
        if (cartProducts) {
          if (cartProducts.cartItems.length > 0) {
            response.notEmpty = true;
            response.cart = cartProducts;
            resolve(response);
          } else {
            response.notEmpty = false;
            resolve(response);
          }
        } else {
          response.notEmpty = false;
          resolve(response);
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  deleteFromCart: (userId, proId) => {
    return new Promise((resolve, reject) => {
      try {
        cartModel
          .updateOne(
            { user: userId },
            {
              $pull: {
                cartItems: { product: proId },
              },
            }
          )
          .then((data) => {
            resolve(data);
          });
      } catch (err) {
        reject(err);
      }
    });
  },
  cartCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = 0;
        let cartProduct = await cartModel.findOne({ user: userId });
        if (cartProduct) {
          count = cartProduct.cartItems.length;
        }
        resolve(count);
      } catch (err) {
        reject(err);
      }
    });
  },
  quantityPlus: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        cartModel
          .updateOne(
            { user: userId, "cartItems.product": proId },
            { $inc: { "cartItems.$.quantity": 1 } }
          )
          .then(async (data) => {
            let response = {};
            let cart = await cartModel.findOne({ user: userId }).lean();
            response.cart = cart;
            let count = null;
            for (let i = 0; i < cart.cartItems.length; i++) {
              if (cart.cartItems[i].product == proId) {
                count = cart.cartItems[i].quantity;
              }
            }
            response.count = count;
            resolve(response);
          });
      } catch (err) {
        reject(err);
      }
    });
  },
  quantityMinus: (proId, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        cartModel
          .updateOne(
            { user: userId, "cartItems.product": proId },
            { $inc: { "cartItems.$.quantity": -1 } }
          )
          .then(async (data) => {
            let response = {};
            let cart = await cartModel.findOne({ user: userId }).lean();
            response.cart = cart;
            console.log(cart);
            let count = null;
            for (let i = 0; i < cart.cartItems.length; i++) {
              if (cart.cartItems[i].product == proId) {
                count = cart.cartItems[i].quantity;
              }
            }
            if (count === 0) {
              Helper.deleteFromCart(userId, proId).then((data) => {
                response.data = data;
              });
            }
            response.count = count;
            resolve(response);
          });
      } catch (err) {
        reject(err);
      }
    });
  },
  profile: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let user = await userModel.findById(userId).lean();
        resolve(user);
      } catch (err) {
        reject(err);
      }
    });
  },
  editProfile: (data, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let emailCheck = await userModel.findOne({ email: data.email });
        let status = {
          alreadyExists: false,
        };
        if (emailCheck) {
          status.alreadyExists = true;
          resolve(data);
        } else {
          userModel
            .findByIdAndUpdate(userId, {
              name: data.name,
              email: data.email,
              atlNumber: data.atlNumber,
            })
            .then((data) => {
              resolve(data);
            });
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  getAddress: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let address = await addressModel.find({ User: userId }).lean();
        resolve(address);
      } catch (err) {
        reject(err);
      }
    });
  },
  addAddress: (data, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let defaultAddress = null;
        let address = await addressModel.find({ User: userId }).lean();
        if (address) {
          defaultAddress = false;
        } else {
          defaultAddress = true;
        }
        let Address = new addressModel({
          User: userId,
          name: data.name,
          number: data.number,
          address1: data.address1,
          address2: data.address2,
          district: data.district,
          state: data.state,
          country: data.country,
          pinCode: data.pinCode,
          defaultAddress,
        });
        Address.save().then((address) => {
          resolve(address);
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  total: (cart) => {
    return new Promise(async (resolve, reject) => {
      try {
        let total = cart.cartItems.reduce((acc, curr) => {
          acc = acc + curr.product.discountPrice * curr.quantity;
          return acc;
        }, 0);
        let response = {};
        let shipping = 0;
        if (total < 1000) {
          shipping = 100;
        }
        response.shipping = shipping;
        response.total = total;
        response.grandTotal = response.total + response.shipping;
        if (cart.discount) {
          response.grandTotal = response.grandTotal - cart.discount;
          response.discount = cart.discount;
        }
        resolve(response);
      } catch (err) {
        reject(err);
      }
    });
  },
  applyCoupon: (code, id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let response = {};
        response.discount = 0;
        code.code = code.code.toUpperCase();
        let coupon = await couponModel.findOne({ code: code.code });
        if (coupon) {
          let couponUser = await couponModel.findOne({
            code: code.code,
            users: { $in: [id] },
          });
          console.log(id, "applcpon", couponUser);
          if (couponUser) {
            response.status = false;
            resolve(response);
          } else {
            response.status = true;
            response.coupon = coupon;
            Helper.showCartProducts(id).then((cartProducts) => {
              Helper.total(cartProducts.cart).then((total) => {
                response.discount =
                  (total.grandTotal * coupon.percentage) / 100;
                response.grandTotal = total.grandTotal - response.discount;
                resolve(response);
              });
            });
          }
        } else {
          response.status = false;
          resolve(response);
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  couponUser: (userId, coupon) => {
    return new Promise((resolve, reject) => {
      try {
        couponModel
          .findByIdAndUpdate(coupon._id, { $push: { users: userId } })
          .then((data) => {
            resolve();
          })
          .catch((err) => reject(err));
      } catch (err) {
        reject(err);
      }
    });
  },
  PlaceOrder: (data, userId) => {
    let orderStatus;
    return new Promise(async (resolve, reject) => {
      try {
        if (data.paymentDetails === "COD") {
          orderStatus = true;
        }
        console.log(data);
        Helper.showCartProducts(userId).then((cartProducts) => {
          Helper.total(cartProducts.cart).then((response) => {
            if (data.discount) {
              response.grandTotal = response.grandTotal - data.discount;
              console.log(response.grandTotal, data.discount);
            }
            let order = new orderModel({
              user: userId,
              orderItems: cartProducts.cart.cartItems,
              totalPrice: response.grandTotal,
              deliveryCharge: response.shipping,
              deliveryDetails: data.deliveryDetails,
              paymentDetails: data.paymentDetails,
              orderStatus,
            });
            order.save().then((data) => {
              let cartItems = cartProducts.cart.cartItems;
              for (let i = 0; i < cartItems.length; i++) {
                productModel
                  .findByIdAndUpdate(cartItems[i].product, {
                    $inc: { quantity: -cartItems[i].quantity },
                  })
                  .then((data) => {
                    console.log(data);
                  });
              }
              resolve(data);
            });
          });
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  generateRazorpay: (Order) => {
    return new Promise(async (resolve, reject) => {
      try {
        let fund = Order.totalPrice * 100;
        var options = {
          amount: fund, // amount in the smallest currency unit
          currency: "INR",
          receipt: "" + Order._id,
        };
        instance.orders.create(options, function (err, order) {
          console.log("new order", order);
          resolve(order);
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  verifyPayment: (data) => {
    return new Promise(async (resolve, reject) => {
      try {
        const crypto = require("crypto");
        let hmac = crypto.createHmac("sha256", process.env.razor_key_secret);
        let body =
          data.payment.razorpay_order_id +
          "|" +
          data.payment.razorpay_payment_id;
        hmac.update(body.toString());
        hmac = hmac.digest("hex");
        if (hmac == data.payment.razorpay_signature) {
          resolve();
        } else {
          reject();
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  changeOrderStatus: (id, userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        orderModel
          .findOneAndUpdate(
            { _id: id },
            { orderStatus: true, deliveryStatus: "processing" }
          )
          .then((data) => {
            cartModel.findOneAndRemove({ user: userId }).then(() => {
              resolve();
            });
          });
      } catch (err) {
        reject(err);
      }
    });
  },
  getOrder: (id) => {
    return new Promise((resolve, reject) => {
      try {
        orderModel
          .findById(id)
          .populate("orderItems.product")
          .populate("orderItems.product.categoryName")
          .populate("deliveryDetails")
          .lean()
          .then((order) => {
            resolve(order);
          })
          .catch((err) => {
            reject(err);
          });
      } catch (err) {
        reject(err);
      }
    });
  },
  addToWishList: (userId, proId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let response = {};
        let userWishList = await wishListModel.findOne({ user: userId });
        let cartItem = await cartModel.findOne({
          user: userId,
          "cartItems.product": proId,
        });
        if (cartItem) {
          response.cart = true;
          resolve(response);
        } else {
          if (userWishList) {
            let exist = await wishListModel.findOne({
              user: userId,
              "wishListItems.product": proId,
            });
            if (!exist) {
              let conditions = {
                user: userId,
                "wishListItems.product": { $ne: proId },
              };
              var update = {
                $addToSet: { wishListItems: { product: proId } },
              };
              wishListModel
                .findOneAndUpdate(conditions, update)
                .then((data) => {
                  response.added = true;
                  response.data = true;
                  response.cart = false;
                  resolve(response);
                });
            } else {
              wishListModel
                .updateOne(
                  { user: userId },
                  {
                    $pull: {
                      wishListItems: { product: proId },
                    },
                  }
                )
                .then((data) => {
                  response.added = false;
                  response.data = data;
                  response.cart = false;
                  resolve(response);
                });
            }
          } else {
            let user = userId;
            let product = proId;
            let wishListItems = [];
            wishListItems[0] = { product };
            newWishList = new wishListModel({
              user,
              wishListItems,
            });
            newWishList.save().then((data) => {
              response.added = true;
              response.data = data;
              response.cart = false;
              resolve(response);
            });
          }
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  checkWishlist: (userId, proId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let wishList = null;
        wishListModel
          .find({
            user: userId,
            wishListItems: {
              $elemMatch: { product: proId },
            },
          })
          .then((data) => {
            if (data.length > 0) {
              wishList = true;
              console.log(wishList, "exist");
            } else {
              wishList = false;
              console.log(wishList, "not");
            }
            resolve(wishList);
          });
      } catch (err) {
        reject(err);
      }
    });
  },
  wishListProducts: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let response = {};
        let products = await wishListModel
          .findOne(userId)
          .populate("wishListItems.product")
          .lean();
        if (products.wishListItems.length > 0) {
          response.notEmpty = true;
          response.products = products;
          resolve(response);
        } else {
          response.notEmpty = false;
          resolve(response);
        }
      } catch (err) {
        reject(err);
      }
    });
  },
  removeWishListItem: (userId, proId) => {
    return new Promise((resolve, reject) => {
      try {
        let response = {};
        wishListModel
          .updateOne(
            { user: userId },
            {
              $pull: {
                wishListItems: { product: proId },
              },
            }
          )
          .then((data) => {
            response.removed = true;
            response.data = data;
            resolve(response);
          });
      } catch (err) {
        reject(err);
      }
    });
  },
  wishlistCount: (userId) => {
    return new Promise(async (resolve, reject) => {
      try {
        let count = 0;
        let wishlistProduct = await wishListModel.findOne({ user: userId });
        if (wishlistProduct) {
          count = wishlistProduct.wishListItems.length;
        }
        resolve(count);
      } catch (err) {
        reject(err);
      }
    });
  },
  orderManagement: (id) => {
    return new Promise(async (resolve, reject) => {
      try {
        let response = {};
        orderModel
          .find({ id })
          .populate("orderItems.product")
          .populate("orderItems.product.categoryName")
          .populate("deliveryDetails")
          .lean()
          .then((order) => {
            resolve(order);
          });
      } catch (err) {
        reject(err);
      }
    });
  },
};

module.exports = Helper;
