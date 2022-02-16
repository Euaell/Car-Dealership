const connection = require("../connection");
const { isEmail } = require("validator");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


let maxAge = 3 * 24 * 60 * 60; // set the time to live for the token to 3 days in seconds
const createToken = (id) => {
    return jwt.sign({id}, "...Our loss is nothing but time.", {
        expiresIn: maxAge
    });
}

const signup_get = (req, res) => {
    res.render("signup");
}

const login_get = (req, res) => {
    res.render("login");
}

const signup_post = (req, res) => {
    let {name, sex, email, password} = req.body;
    let msg = {
        "email": "OK",
        "password": "OK",
        "status": 200,
        "db": "",
        "id": 0
    }
    // check for password length
    if (password.length < 6){ 
        msg.password = "password must be greater than 6 characters";
        msg.status = 400;
    }
    // check for valid email address
    // isEmail returns true if the email is invalid
    if (!isEmail(email)) {
        msg.email = "invalid email address";
        msg.status = 400;
    } 
    // exits if the password or email is invalid
    if (msg.status !== 200) return res.status(msg.status).send(msg);
    
    // hashes the password to be saved to the database
    const salt = bcrypt.genSaltSync();
    password = bcrypt.hashSync(password, salt);
    
    // query the database to save the new user
    let sql = `INSERT INTO customer (name, sex, email, password) VALUES ("${name}", "${sex}", "${email}", "${password}")`;
    connection.query(sql, (err, result) => {
        if (err) {
            // for duplicate email entry error
            if (err.code === "ER_DUP_ENTRY") {
                msg.email = "Email already exist in database!";
                msg.status = 400;
                return res.status(msg.status).send(msg);
            } else {
                 // for unknown database error
                msg.db = err.message;
                msg.status = 400;
                console.log(err);
                return res.status(msg.status).send(msg);
            }
           
        }
        const token = createToken(result.insertId);
        res.cookie("jwt", token, {httpOnly: true, maxAge: maxAge * 1000}); // multiply by 1000 to change to millisecond
        msg.id = result.insertId;
        res.status(msg.status).send(msg);
    });
    
}

const login_post = (req, res) => {
    let {email, password} = req.body;
    
    let msg = {
        "message": "",
        "status": 200
    }

    if (!isEmail(email)) { // isEmail returns true if the email is INVALID so has to be negated
        msg.message = "invalid email address";
        msg.status = 400;
        return res.status(msg.status).send(msg);
    }

    let sql = `SELECT * FROM customer WHERE email = "${email}"`;
    connection.query(sql, async (err, result) => { // have to be an asyncronus function cause there is an async component in it "await"
        if (err) {
            msg.message = err.message;
            msg.status = 400;
            return res.status(msg.status).send(msg);
        } else if (result.length == 0){
            msg.message = "email doesn't exist";
            msg.status = 400;
            return res.status(msg.status).send(msg);
        }
        const auth = await bcrypt.compare(password, result[0].password);
        if (!auth) {
            msg.message = "incorrect password";
            msg.status = 400;
            return res.status(msg.status).send(msg);
        }
        
        const token = createToken(result[0].customerId);
        res.cookie("jwt", token, {httpOnly: true, maxAge: maxAge * 1000});
        res.send(msg);
    });
    
    // res.end();
}

const logout_get = (req, res) => {
    // set the jwt cookie to an empty string and set its maxAge to 1 second so its as good as deleting the cookie
    res.cookie("jwt", "", {maxAge: 1, httpOnly: true});
    res.redirect("/");
}

module.exports = {
    signup_get,
    signup_post,
    login_get,
    login_post,
    logout_get
}