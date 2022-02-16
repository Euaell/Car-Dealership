const jwt = require("jsonwebtoken");
const connection = require("../connection");

const requireAuth = (req, res, next) => {
    const token = req.cookies.jwt;

    if (token) { // check if the token exists
        jwt.verify(token, "...Our loss is nothing but time.", (error, decodedToken) => {
            if (error) { // if the token is not valid
                console.log(error.message)
                res.redirect("/login");
            } else{
                // console.log(decodedToken);
                next();
            }
        });
    } else{
        res.redirect("/login");
    }
}

// checkt if the user is logged in or not and return the database entry conditionally
const checkUser = async (req, res, next) => { 
    const token = req.cookies.jwt;
    if (token) {
        jwt.verify(token, "...Our loss is nothing but time.", (error, decodedToken) => {
            if (error) { // if the token is not valid
                console.log(error.message);
                res.locals.user = null;
                next();
            } else{
                // console.log(decodedToken);
                let sql = `SELECT * FROM customer WHERE customerId = "${decodedToken.id}"`;
                connection.query(sql, async (err, result) => {
                    if (err) {
                        res.locals.user = null;
                        return console.log(err.message);
                    }
                    // console.log(result[0]);
                    res.locals.user = await result[0];
                    next();
                });
            }
        });
    } else{ // if the token doesn't exist
        res.locals.user = null;
        next();
    }
}

module.exports = { requireAuth, checkUser };