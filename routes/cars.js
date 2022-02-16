const { Router } = require("express");
const connection = require("../connection");
const { requireAuth} = require("../middleware/authUsers");
// const formidable = require('formidable');
// const fs = require("fs");

const router = Router();

router.get('/cars', requireAuth, (req, res) => {
	let sql = `SELECT * FROM model`;
	connection.query(sql, (err, result) => {
		if (err) return console.log(err.message);
        
		res.render('cars', {cars: result});
	});
}); // router with requireAuth middleware

router.get('/usedCars', requireAuth, (req, res) => {
	let sql = `SELECT * FROM used_car 
	           JOIN model on used_car.model=model.modelNumber `;
	connection.query(sql, (err, result) => {
		if (err) return console.log(err.message);
        
		res.render('cars', {cars: result});
	});
});
router.get('/newCars', requireAuth, (req, res) => {
	let sql = `SELECT * FROM new_car 
				JOIN model on new_car.model=model.modelNumber`;
	connection.query(sql, (err, result) => {
		if (err) return console.log(err.message);
		
		res.render('cars', {cars: result});
	});
});

router.get('/newcarsname', requireAuth, (req, res) => { // ordered by name, alphabetically
	let sql = `SELECT * FROM new_car JOIN model on model.modelNumber = new_car.model `//ORDERD BY name ASC`;
	connection.query(sql, (err, result) => {
		if (err) return console.log(err.message);

		res.render('cars', {cars: result});
	});
});
router.get('/newccarsyear', requireAuth, (req, res) => { // cars ordered by manufactured year, recent on top
	let sql = `SELECT * FROM new_car JOIN model on model.modelNumber = new_car.model  ORDER BY manufactureYear DESC`;
	connection.query(sql, (err, result) => {
		if (err) return console.log(err.message);

		res.render('cars', {cars: result});
	});
});


router.get('/sparePart', requireAuth, (req, res) => {
	let sql = `SELECT spare_part.id, spare_part.price, spare_part.name, 
				model.modelNumber, model.picture, model.manufactureCompany, model.manufactureYear
				FROM spare_part JOIN model on spare_part.model = model.modelNumber`;
	connection.query(sql, (err, result) => {
		if (err) return console.log(err.message);
		
		res.render('sparepart', {spares: result});
	});
}); // router with requireAuth middleware
router.get('/sparePartordp', requireAuth, (req, res) => {
	let sql = `SELECT * FROM spare_part ORDER BY price DESC`;
	connection.query(sql, (err, result) => {
		if (err) return console.log(err.message);
        
		res.render('sparepart', {spares: result});
	});
});
router.get('/sparePartordn', requireAuth, (req, res) => {
	let sql = `SELECT * FROM spare_part ORDER BY name ASC`;
	connection.query(sql, (err, result) => {
		if (err) return console.log(err.message);
        
		res.render('sparepart', {spares: result});
	});
});

router.get("/usedcars/:id", requireAuth, (req, res) => {
	let sql = `SELECT * FROM new_car 
				JOIN model on new_car.model=model.modelNumber
				WHERE usedCarId = ${req.params.id}`
	connection.query(sql, (err, result) => {
		if (err) return console.log(err.message);

		res.render('orders', {cars: result, id: req.params.id});
	})
})
router.get("/sparePart/:id", requireAuth, (req, res) => {
	let sql = `SELECT spare_part.id, spare_part.price, spare_part.name, model.modelNumber, model.picture, model.manufactureCompany, model.manufactureYear
				FROM spare_part JOIN model on spare_part.model = model.modelNumber
				WHERE id = ${req.params.id}`
	connection.query(sql, (err, result) => {
		if (err) return console.log(err.message);
		
		res.render('orders', {cars: result, id: req.params.id});
	})
})
router.post("/sparePart/:id", requireAuth, (req, res) => {
	let {qun} = req.body;
	let ord = "Ok";
	console.log(req);
	// let sql = `INSERT INTO (idCustomer, quantity, orderDate, modelId) VALUES ("${}")`
	connection.query(sql, (err, result) => {

	})
})

module.exports = router;