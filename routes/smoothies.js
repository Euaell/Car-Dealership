const { Router } = require("express");
const connection = require("../connection");
const { requireAuth} = require("../middleware/authUsers");
const formidable = require('formidable');
const fs = require("fs");

const router = Router();

router.get('/smoothies', requireAuth, (req, res) => {
	let sql = `SELECT * FROM hellojwt.smoothies`;
	connection.query(sql, (err, result) => {
		if (err) return console.log(err.message);
		// console.log(result);
		res.render('smoothies', {recipies: result});
	})
	// res.redirect("/");
}); // smoothie router with requireAuth middleware


router.get("/smoothies/add", requireAuth, (req, res) => {
    res.render("addSmoothy");
});
router.post("/smoothies/add", requireAuth, (req, res) => {
    let form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
		if(err) return console.log(err.message);

        let oldpath = files.img.filepath; // temporary file

		let tempNewPath = `icons/${files.img.originalFilename}`; // for the database since it starts looking from the public folder
        let newpath = `./public/${tempNewPath}`; // for the fs module, since it starts looking from node-express-jwt-auth
        		
		fs.copyFile(oldpath, newpath, function (err) {
			if (err) return console.log(err.message);
			// console.log('File uploaded and moved!');
			
			let sql=`INSERT INTO hellojwt.smoothies (image, title, description) values ("${tempNewPath}", "${fields.title}", "${fields.dis}")`;
			connection.query(sql, (error , result) =>{
				if(error) return console.log(error);
				res.redirect("/smoothies");
			});
        });        
	});
        

	// res.end();
});

module.exports = router;