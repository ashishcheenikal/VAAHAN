var express = require("express");
const { response } = require("../app");
var router = express.Router();
const otpverify = require("../authentication/otpVerify");
const authentication = require("../authentication/userAuth");
const adminHelper = require("../helpers/adminHelper");
const userHelper = require("../helpers/userHelper");

const verified = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
};
const isBlock = (req, res, next) => {
  userHelper.profile(req.session.user._id).then((user)=>{
    if (user.status) {
      next();
    } else {
      res.redirect("/login");
    }
  })
};

/* GET home page. */

router.get("/", function (req, res, next) {
  let session = req.session;
  adminHelper.showCategory().then((category) => {
    adminHelper.showProduct().then((product) => {
      res.render("user/homePage", {
        session,
        userDisplay: true,
        category,
        product,
      });
    });
  });
});

router.get("/shopAllProducts",verified,function (req, res, next) {
  let session = req.session;
  adminHelper.showCategory().then((category) => {
    adminHelper.showProduct().then((product) => {
      res.render("user/allProduct", {
        session,
        userDisplay: true,
        category,
        product,
      });
    });
  });
});

router.get("/register", function (req, res, next) {
  req.session.register = true;
  res.redirect("/login");
});

router.get("/login", function (req, res, next) {
  let userlog = req.session;
  console.log(userlog.wrongpassword);
  res.render("user/login", { userlog, userDisplay: true,session:req.session });
});

router.post("/usersignup", function (req, res, next) {
  let user = req.body;
  req.session.user = req.body;
  authentication.userexist(req.body).then((response) => {
    if (response.alreadyregistered) {
      req.session.alreadyregistered = true;
      res.redirect("/register", { userDisplay: true });
    } else {
      otpverify.getOtp(req.body.number).then((response) => {
        console.log("then working");
        res.render("user/otp", { user, userDisplay: true,session:req.session });
      });
    }
  });
});

router.post("/check-otp", function (req, res, next) {
  console.log("check-otp");
  otpverify.checkOtp(req.body.otp, req.body.number).then((data) => {
    console.log("then working otp");
    if (data === "approved") {
      if (req.session.otpsend) {
        req.session.userlogedin = true;
        res.redirect("/");
      } else {
        authentication.dosignup(req.session.user).then((data) => {
          req.session.userlogedin = true;
          res.redirect("/");
        });
      }
    } else {
      res.send("not approved");
    }
  });
});

router.post("/userlogin", function (req, res) {
  authentication.dologin(req.body).then((data) => {
    if (data.valid) {
      if (data.user.status) {
        req.session.userlogedin = true;
        req.session.user = data.user;
        res.redirect("/");
        console.log("login success");
      } else {
        req.session.blocked = true;
        res.redirect("/login");
      }
    } else if (data.usernotfound) {
      console.log("user not found");
      req.session.usernotfound = true;
      req.session.wrongpassword = false;
      res.redirect("/login");
    } else {
      console.log("wronge password");
      req.session.wrongpassword = true;
      req.session.usernotfound = false;
      res.redirect("/login");
    }
  });
});

router.post("/loginWithOTP", function (req, res) {
  let user = req.body;
  authentication.mobileExist(user.number).then((response) => {
    req.session.user = response.user;
    if (response.userfound) {
      console.log(response);
      otpverify.getOtp(user.number).then((data) => {
        req.session.otpsend = true;
        res.render("user/otp", { user, userDisplay: true ,session:req.session});
      });
    }
  });
});

router.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/");
});

router.get("/profile", verified, function (req, res) {
  res.send("profile");
});

router.get("/shopDetails/:id", verified, (req, res,next) => {
    adminHelper.getProduct(req.params.id).then((product) => {
      adminHelper.showProduct().then((products) => {
        res.render("user/shopDetails", { product, products, userDisplay: true, session: req.session});
      });
    }).catch(err=>{
      next(err);
    })
 
});

router.post("/addToCart/:id", verified, (req, res,next) => {
  let userId = req.session.user._id;
  let proId = req.params.id;
  userHelper.addToCart(userId, proId).then((response) => {
    res.json({ response });
  }).catch((err)=>{
    next(err);
  });
});

router.get("/cartPage", verified, (req, res) => {
  req.session.coupon = null;
  req.session.discount = null;
  const userId = req.session.user._id;
  userHelper.showCartProducts(userId).then((response) => {
    res.render("user/cartPage", {
      cartProducts: response.cart,
      notEmpty: response.notEmpty,
      userDisplay: true,session:req.session
    });
  });
});

router.get("/cartCount", verified, (req, res) => {
  userHelper.cartCount(req.session.user._id).then((response) => {
    res.json({ response });
  });
});

router.post("/quantityPlus/:id", verified, (req, res,next) => {
  userHelper
    .quantityPlus(req.params.id, req.session.user._id)
    .then((response) => {
      res.json({ response });
    }).catch((err)=>{
      next(err);
    });
});

router.post("/quantityMinus/:id", verified, (req, res,next) => {
  userHelper
    .quantityMinus(req.params.id, req.session.user._id)
    .then((response) => {
      res.json({ response });
    }).catch((err)=>{
      next(err);
    });
});

router.post("/deleteFromCart/:id", verified, (req, res,next) => {
  userHelper
    .deleteFromCart(req.session.user._id, req.params.id)
    .then((response) => {
      res.json({ response });
    }).catch((err)=>{
      next(err);
    });
});

router.post("/applyCoupon", verified, (req, res) => {
  console.log(req.body);
  userHelper.applyCoupon(req.body, req.session.user._id).then((response) => {
    if (response.status) {
      req.session.coupon = response.coupon;
      req.session.discount = response.discount;
    }
    res.json({ response });
  });
});

router.get("/checkout", verified , isBlock , (req, res) => {
  const userId = req.session.user._id;
  userHelper.showCartProducts(userId).then((response1) => {
    userHelper.getAddress(userId).then((address) => {
      if (req.session.discount) {
        response1.cart.discount = req.session.discount;
      }
      userHelper.total(response1.cart).then((response) => {
        res.render("user/checkout", {
          userDisplay: true,
          cartProducts: response1.cart,
          address,
          response,session:req.session
        });
      });
    });
  });
});

router.post("/placeOrder", verified, (req, res) => {
  userId = req.session.user._id;
  orderDetails = req.body;
  if (req.session.coupon) {
    orderDetails.discount = req.session.discount;
  }
  userHelper.PlaceOrder(orderDetails, userId).then(async(order) => {
    if (order.paymentDetails === "COD") {
      if(req.session.coupon) {
        await userHelper.couponUser(req.session.user._id,req.session.coupon)
      }
      console.log(order);
      userHelper.changeOrderStatus(order._id, req.session.user._id).then(() => {
        res.json({ order });
      });
    } else {
      userHelper.generateRazorpay(order).then((data) => {
        res.json({ data });
      });
    }
  });
});

router.post("/verifyPayment", verified, (req, res) => {
  console.log(req.body);
  userHelper.verifyPayment(req.body).then(async() => {
    if(req.session.coupon) {
      await userHelper.couponUser(req.session.user._id,req.session.coupon)
    }
    userHelper.changeOrderStatus(req.body.order.receipt, req.session.user._id).then(() => {
      res.json({ status: true });
    });
  });
});

router.get("/orderSuccess/:id", (req, res,next) => {
  let session = req.session;
  userHelper.getOrder(req.params.id).then((order) => {
    res.render("user/orderSuccess", { order, userDisplay: true, session });
  }).catch((err)=>{
    next(err);
  });
});

router.get("/userProfile", verified, (req, res) => {
  userHelper.profile(req.session.user._id).then((user) => {
    let emailStatus = req.session.emailStatus;
    req.session.emailStatus = null;
    res.render("user/userProfile", { userDisplay: true, user, emailStatus ,session:req.session});
  });
});

router.post("/editProfile", (req, res) => {
  userHelper.editProfile(req.body, req.body.id).then((user) => {
    req.session.emailStatus = true;
    res.redirect("/userProfile");
    req.files.image1.mv(
      "public/images/user-image/" + user._id + "1.jpg",
      (err, done) => {
        if (err) {
          console.log(err);
        }
      }
    );
  });
});

router.get("/test", verified, (req, res) => {
  const userId = req.session.user._id;
  userHelper.showCartProducts(userId).then((response) => {
    res.render("user/test", { userDisplay: true, cartProducts: response.cart,session:req.session });
  });
});

router.get("/addressManagement", verified, (req, res) => {
  userId = req.session.user._id;
  userHelper.getAddress(userId).then((address) => {
    res.render("user/addressPage", { userDisplay: true, address ,session:req.session});
  });
});

router.post("/address", verified, (req, res) => {
  userId = req.session.user._id;
  userHelper.addAddress(req.body, userId).then((address) => {
    res.redirect("/addressManagement");
  });
});
router.post("/addressCheckout", verified, (req, res) => {
  userId = req.session.user._id;
  console.log(req.body);
  userHelper.addAddress(req.body, userId).then((address) => {
    res.redirect("/checkout");
  });
});

router.post("/addToWishList/:id", verified, (req, res,next) => {
  userHelper
    .addToWishList(req.session.user._id, req.params.id)
    .then((response) => {
      console.log(response);
      res.json({ response });
    }).catch((err)=>{
      next(err);
    });
});

router.get("/checkWishlist/:id", verified, (req, res,next) => {
  userHelper
    .checkWishlist(req.session.user._id, req.params.id)
    .then((wishList) => {
      res.json({ wishList });
    }).catch((err)=>{
      next(err);
    });
});

router.get("/wishlistCount", verified, (req, res) => {
  userHelper.wishlistCount(req.session.user._id).then((response) => {
    res.json({ response });
  });
});

router.get("/wishlist", verified, (req, res) => {
  let session = req.session;
  userHelper.wishListProducts(req.session.user._id).then((response) => {
    if (response.notEmpty) {
      let wishListItems = response.products.wishListItems;
      res.render("user/wishList", {
        userDisplay: true,
        session,
        response,
        wishListItems,
      });
    } else {
      res.render("user/wishList", { userDisplay: true, session, response });
    }
  });
});

router.post("/removeWishListItem/:id", verified, (req, res ,next) => {
  userHelper
    .removeWishListItem(req.session.user._id, req.params.id)
    .then((response) => {
      res.json({ response });
    }).catch((err)=>{
      next(err);
    });
});

router.get('/orderManagement',verified,(req,res)=>{
  userHelper.orderManagement(req.session.user._id).then((order) => {
    res.render('user/orderManagement',{userDisplay:true,order,session:req.session})
  })
})

router.get('/orderDetails/:id',verified,(req,res,next)=>{
  userHelper.getOrder(req.params.id).then((order) => {
    res.render("user/orderDetails", { order, userDisplay: true ,session:req.session});
  }).catch((err)=>{
    next(err);
  });
})






module.exports = router;
