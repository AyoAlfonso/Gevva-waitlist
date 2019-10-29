let express = require("express");
let router = express.Router();
let authController = require("../controller/auth");
let Keys = require("../keys");
let connection = require("../controller/db");

router.get("/", authController.isLoggedIn);

router.get("/login", authController.isNotLoggedIn, (req, res) => {
  return res.render("login", {
    title: `NannyFix LogIn`,
    message: `Welcome`
  });
});

router.post("/login", authController.login);

router.get("/logout", authController.logout);

module.exports = router;
