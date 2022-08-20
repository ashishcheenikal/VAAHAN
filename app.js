var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");
let sessions = require("express-session");
let mongoose = require("mongoose");
let hbs = require("express-handlebars");
let MongodbSession = require("connect-mongodb-session")(sessions);
let fileupload = require("express-fileupload");
let connection = require("./config/connection");
var userRouter = require("./routes/user");
var adminRouter = require("./routes/admin");

// var env = require('dotenv').config({path: __dirname + '/.env'})
// //console.log(typeof(process.env.serviceID));


connection.connect()
var app = express();

const store = new MongodbSession({
  uri: connection.mongoUri,
  collection: "mySessions",
});

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "hbs");
// Setting up partials
app.engine(
  "hbs",
  hbs.engine({
    extname: "hbs",
    defaultLayout: "layout",
    layoutsDir: __dirname + "/views/layout/",
    partialsDir: __dirname + "/views/partials",
    helpers: {
      total: function (qty, price) {
        return qty * price;
      },
      subTotal: function (arr) {
        let subtotal = 0;
        for (let i = 0; i < arr.length; i++) {
          subtotal = subtotal + arr[i].product.discountPrice * arr[i].quantity;
        }
        return subtotal;
      },
      json: function (context) {
        return JSON.stringify(context);
      },
      date: function(date){
        let data = date+""
        return data.slice(0, 16);
      }
    },
  })
);

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(fileupload());

//Setting Up Session

app.use(
  sessions({
    secret: "thisismysecrctekey",
    saveUninitialized: false,
    cookie: { maxAge: 3600000 },
    resave: true,
    store: store,
  })
);

app.use(function (req, res, next) {
  if (!req.session.userlogedin) {
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
  }
  next();
});

app.use(function (req, res, next) {
  if (!req.session.adminlogedin) {
    res.header("Cache-Control", "private, no-cache, no-store, must-revalidate");
    res.header("Expires", "-1");
    res.header("Pragma", "no-cache");
  }
  next();
});

app.use("/", userRouter);
app.use("/admin", adminRouter);

// catch 404 and forward to error handler
app.use(function ( req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error",{err,errorDisplay:true});
});

module.exports = app;

