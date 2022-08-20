const { Router } = require("express");
var express = require("express");
const adminauthentication = require("../authentication/adminAuth");
const otpverify = require("../authentication/otpVerify");
const adminHelper = require("../helpers/adminHelper");
const userHelper = require("../helpers/userHelper");
const category = require("../model/category");
const product = require("../model/product");
const subCategory = require("../model/subCategory");
var router = express.Router();

const verify = (req, res, next) => {
  if (req.session.adminlogedin) {
    next();
  } else {
    res.redirect("/admin/login");
  }
};

router.get("/", verify, function (req, res, next) {
  let session = req.session;
  res.render("admin/homeAdmin", { session });
});

router.get("/login", function (req, res, next) {
  let session = req.session;
  res.render("admin/loginAdmin", { session });
});

router.post("/login", function (req, res) {
  // const data={
  //   adminname:'George',
  //   adminemail:'georgecheenikal@gmail.com',
  //   adminnumber:'7306891390',
  //   adminpassword:'96321478'
  // }
  // adminauthentication.adminSignUp(data).then((d)=>{
  //   res.send(d);
  // })
  adminauthentication.adminlogin(req.body).then((data) => {
    if (data.adminvalid) {
      req.session.admin = data.admin;
      req.session.adminlogedin = true;
      res.redirect("/admin");
    } else if (data.adminnotfound) {
      req.session.adminnotfound = true;
      req.session.wrongpassword = false;
      res.redirect("/admin/login");
    } else {
      req.session.adminnotfound = false;
      req.session.wrongpassword = true;
      res.redirect("/admin/login");
    }
  });
});
router.get("/logout", function (req, res) {
  req.session.destroy();
  res.redirect("/admin/login");
});

router.post("/loginwithotp", function (req, res) {
  adminnumber = req.body.adminnumber;
  adminauthentication.mobileexist(adminnumber).then((response) => {
    if (response.adminfound) {
      req.session.admin = response.admin;
      otpverify.getOtp(adminnumber).then((data) => {
        res.render("admin/otpAdmin", { adminnumber, session: req.session });
      });
    } else {
      req.session.wrongMobileNumber = true;
      res.redirect("/admin/login");
    }
  });
});
router.post("/check-otp", function (req, res) {
  let { otp, adminnumber } = req.body;
  otpverify.checkOtp(otp, adminnumber).then((data) => {
    if (data === "approved") {
      req.session.adminlogedin = true;
      res.redirect("/admin");
    }
  });
});

router.get("/userList", verify, function (req, res, next) {
  adminHelper
    .getAllUser()
    .then((users) => {
      res.render("admin/userList", { users, session: req.session });
    })
    .catch((err) => {
      err.admin = true;
      next(err);
    });
});

router.get("/change-status/:id", (req, res, next) => {
  adminHelper
    .changeStatus(req.params.id)
    .then((response) => {
      res.redirect("/admin/userList");
    })
    .catch((err) => {
      err.admin = true;
      next(err);
    });
});

router.get("/category", verify, function (req, res) {
  adminHelper.showCategory().then((Category) => {
    let session = req.session;
    res.render("admin/categoryPage", { Category, session });
  });
  req.session.CategoryExist = null;
});

router.post("/addCategory", verify, function (req, res) {
  adminHelper.addCategory(req.body).then((data) => {
    req.session.CategoryExist = data.exist;
    if (!data.exist) {
      req.files.image1.mv(
        "public/images/category-image/" + data.data._id + ".jpg",
        (err, done) => {
          if (err) {
            console.log(err);
          }
        }
      );
    }
    res.redirect("/admin/category");
  });
});

router.post("/addSubCategory", verify, function (req, res) {
  adminHelper.addSubCategory(req.body).then((subCategory) => {
    res.redirect("/admin/category");
  });
});

router.get("/editCategory/:id", verify, function (req, res, next) {
  adminHelper
    .getCategory(req.params.id)
    .then((response) => {
      res.render("admin/editCategory", { response, session: req.session });
    })
    .catch((err) => {
      err.admin = true;
      next(err);
    });
});
router.post("/editCategory", verify, (req, res) => {
  adminHelper.editCategory(req.body).then((response) => {
    res.redirect("/admin/category");
  });
});

router.get("/deleteCategory/:id", (req, res, next) => {
  adminHelper
    .deleteCategory(req.params.id)
    .then((response) => {
      res.redirect("/admin/category");
    })
    .catch((err) => {
      err.admin = true;
      next(err);
    });
});

router.get("/product", (req, res) => {
  adminHelper.showCategory().then((category) => {
    adminHelper.showProduct().then((product) => {
      res.render("admin/productList", {
        category,
        product,
        session: req.session,
      });
    });
  });
});

router.get("/showSubCategory/:id", verify, (req, res, next) => {
  adminHelper
    .getSubCategory(req.params.id)
    .then((data) => {
      res.json({ data });
    })
    .catch((err) => {
      err.admin = true;
      next(err);
    });
});

router.post("/addProduct", verify, (req, res) => {
  console.log(req.body);
  adminHelper.addProducts(req.body).then((id) => {
    console.log(id);
    req.files.image1.mv(
      "public/images/product-image/" + id + "1.jpg",
      (err, done) => {
        if (err) {
          console.log(err);
        }
      }
    );
    req.files.image2.mv(
      "public/images/product-image/" + id + "2.jpg",
      (err, done) => {
        if (err) {
          console.log(err);
        }
      }
    );
    req.files.image3.mv(
      "public/images/product-image/" + id + "3.jpg",
      (err, done) => {
        if (err) {
          console.log(err);
        }
      }
    );
    res.redirect("/admin/product");
  });
});

router.get("/editProduct/:id", verify, (req, res, next) => {
  adminHelper
    .getProduct(req.params.id)
    .then((product) => {
      adminHelper.showCategory().then((category) => {
        res.render("admin/addNewProduct", {
          product,
          category,
          session: req.session,
        });
      });
    })
    .catch((err) => {
      err.admin = true;
      next(err);
    });
});
router.post("/editProduct", verify, (req, res) => {
  adminHelper.editProduct(req.body).then((response) => {
    console.log(response);
    if (req.files.image1) {
      req.files.image1.mv(
        "public/images/product-image/" + response._id + "1.jpg",
        (err, done) => {
          if (err) {
            console.log(err);
          }
        }
      );
    }
    if (req.files.image1) {
      req.files.image2.mv(
        "public/images/product-image/" + response._id + "2.jpg",
        (err, done) => {
          if (err) {
            console.log(err);
          }
        }
      );
    }
    if (req.files.image1) {
      req.files.image3.mv(
        "public/images/product-image/" + response._id + "3.jpg",
        (err, done) => {
          if (err) {
            console.log(err);
          }
        }
      );
    }
    res.redirect("/admin/product");
  });
});

router.get("/deleteProduct/:id", (req, res, next) => {
  adminHelper
    .deleteProduct(req.params.id)
    .then((response) => {
      res.redirect("/admin/product");
    })
    .catch((err) => {
      err.admin = true;
      next(err);
    });
});

router.get("/coupon", verify, (req, res) => {
  adminHelper.getAllCoupons().then((coupon) => {
    res.render("admin/coupon", { coupon, session: req.session });
  });
});

router.post("/newCoupon", verify, (req, res) => {
  console.log(req.body);
  adminHelper.addNewCoupon(req.body).then((data) => {
    res.redirect("/admin/coupon");
  });
});

router.post("/editCoupon/:id", verify, (req, res, next) => {
  console.log(req.body);
  console.log(req.params.id, "kkukhkjhkjhjhj");
  adminHelper
    .editCoupon(req.body, req.params.id)
    .then((data) => {
      res.redirect("/admin/coupon");
    })
    .catch((err) => {
      err.admin = true;
      next(err);
    });
});

router.get("/deleteCoupon/:id", verify, (req, res, next) => {
  adminHelper
    .deleteCoupon(req.params.id)
    .then((data) => {
      res.redirect("/admin/coupon");
    })
    .catch((err) => {
      err.admin = true;
      next(err);
    });
});

router.get("/orderManagement", verify, (req, res) => {
  adminHelper.getAllOrders().then((orders) => {
    res.render("admin/orderManagement", { orders });
  });
});

router.post("/changeShipping/:id", verify, (req, res, next) => {
  adminHelper
    .changeShipping(req.params.id, req.body)
    .then((data) => {
      res.redirect("/admin/orderManagement");
    })
    .catch((err) => {
      err.admin = true;
      next(err);
    });
});

router.get("/salesReportPage", verify, (req, res) => {
  res.render('admin/salesReport')
});

router.get("/salesReportChart", verify, (req, res) => {
  adminHelper.getAllOrders().then((orders) => {
    res.json({ orders });
  });
});

module.exports = router;
