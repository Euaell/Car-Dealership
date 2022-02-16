const { Router } = require("express");
const {signup_post, signup_get,login_post, login_get, logout_get} = require("../controllers/authControllers");


const router = Router();

router.get("/signup", signup_get);
router.post("/signup", signup_post);
router.get("/login", login_get);
router.post("/login", login_post);
router.get("/logout", logout_get);
// router.post("/logout", logout_post);


module.exports = router;