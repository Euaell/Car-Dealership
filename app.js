const express = require('express');
const morgan = require("morgan");
const connection = require("./connection");
const authRoute = require("./routes/authRoutes");
const smoothies = require("./routes/smoothies");
const cars = require("./routes/cars");
const cookieParser = require("cookie-parser");
const { requireAuth, checkUser} = require("./middleware/authUsers");

const app = express();

const port = process.env.PORT || 3000;

// middleware
app.use(express.static('public'));
app.use(express.json()); // parses the request into a json object 
app.use(morgan("dev")); // logs every request made to the server in the console
app.use(cookieParser()); // to send cookies with express

// view engine
app.set('view engine', 'ejs');

// database connection

connection.connect((err) => {
    if (err) return console.log(err.message);
    console.log("database connected!");
	app.listen(port, "localhost", () => {
		console.log("listening on ", port);
	});
});


// routes
app.get("*", checkUser); // on every get request

app.get('/', (req, res) => res.render('home')); // home router

app.use(authRoute); // the other routers stored in separate module

app.use(cars, smoothies, requireAuth);