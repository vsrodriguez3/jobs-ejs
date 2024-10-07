const express = require("express");
require("express-async-errors");

const sessionRoutes = require("./routes/sessionRoutes");
const jobsRouter = require("./routes/jobs");  


const app = express();

app.set("view engine", "ejs");
app.use(require("body-parser").urlencoded({ extended: true }));

require("dotenv").config(); // to load the .env file into the process.env object
const session = require("express-session");

const MongoDBStore = require("connect-mongodb-session")(session);
const url = process.env.MONGO_URI;

const store = new MongoDBStore({
  uri: url,
  collection: "mySessions",
});

store.on("error", function (error) {
  console.log(error);
});

const sessionParms = {
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: { secure: false, sameSite: "strict" },
};

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // trust first proxy
  sessionParms.cookie.secure = true; // serve secure cookies
}

app.use(session(sessionParms));
// app.use(require("connect-flash")());
const flash = require("connect-flash");

// Initialize flash messages
app.use(flash());

const passport = require("passport");
const passportInit = require("./passport/passportInit");

passportInit();
app.use(passport.initialize());
app.use(passport.session());

app.use(require("./middleware/storeLocals"));

const cookieParser = require("cookie-parser");
const csrf = require("host-csrf");

app.use(cookieParser(process.env.SESSION_SECRET)); // Ensure cookie parser uses secret

// CSRF configuration based on environment
let csrfDevelopmentMode = true;
if (app.get("env") === "production") {
  csrfDevelopmentMode = false;
  app.set("trust proxy", 1);
}

const csrfOptions = {
  protected_operations: ["POST", "PUT", "DELETE", "PATCH"],  
  protected_content_types: ["application/x-www-form-urlencoded", "multipart/form-data"], 
  development_mode: csrfDevelopmentMode, 
  cookieParams: {
    sameSite: "Strict"
  },
};

const csrfMiddleware = csrf(csrfOptions);

// Add CSRF protection middleware
app.use(csrfMiddleware);

// Make CSRF token available in all views
app.use((req, res, next) => {
  const token = csrf.token(req, res); 
  res.locals._csrf = token; // pass token to views
  console.log("The CSRF Token is:", token); // Log token to check 
  res.locals.info = req.flash("info");
  console.log("Session data before flash:", req.session); // added this to test
  // res.locals.errors = req.flash("error");
  const flash_errors = req.flash("error");
  res.locals.flash_errors = flash_errors;
  next();
});

// security middleware begins

const helmet = require('helmet');
const xss = require('xss-clean');
const rateLimit = require('express-rate-limit');

app.use(helmet());  
app.use(xss());    
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
});
app.use(limiter); 

// security middleware ends

app.get("/", (req, res) => {
  res.render("index");
});

app.use("/sessions", sessionRoutes);
const auth = require("./middleware/auth");

app.use("/jobs", auth, jobsRouter); 

const secretWordRouter = require("./routes/secretWord");
app.use("/secretWord", auth, secretWordRouter);

app.use((req, res) => {
  res.status(404).send(`That page (${req.url}) was not found.`);
});

app.use((err, req, res, next) => {
  res.status(500).send(err.message);
  console.log(err);
});

const port = process.env.PORT || 3000;

const start = async () => {
  try {
    await require("./db/connect")(process.env.MONGO_URI);
    app.listen(port, () =>
      console.log(`Server is listening on port ${port}...`)
    );
  } catch (error) {
    console.log(error);
  }
};

start();
