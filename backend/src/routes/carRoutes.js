const express = require('express');
const { body, param, query } = require('express-validator');
const carController = require('../controllers/carController');
const { authenticate, authorize, checkPermission } = require('../middleware/authMiddleware');
const { Role } = require('../models');

const router = express.Router();

/**
 * @route GET /api/cars
 * @desc Get all cars with filtering, pagination, and sorting
 * @access Public
 */
router.get('/cars', carController.getCars);

/**
 * @route GET /api/cars/:id
 * @desc Get car by ID
 * @access Public
 */
router.get('/cars/:id', carController.getCarById);

/**
 * @route POST /api/cars
 * @desc Create a new car
 * @access Private (Admin, Staff)
 */
router.post(
  '/cars',
  authenticate,
  checkPermission('cars', 'create'),
  [
    body('vin').isLength({ min: 17, max: 17 }).withMessage('VIN must be exactly 17 characters'),
    body('make').notEmpty().withMessage('Make is required'),
    body('model').notEmpty().withMessage('Model is required'),
    body('year')
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage('Year must be valid'),
    body('type').isIn(['NEW', 'USED']).withMessage('Type must be NEW or USED'),
    body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
    body('mileage').optional().isInt({ min: 0 }).withMessage('Mileage must be a positive number'),
    body('color').optional(),
    body('transmission')
      .optional()
      .isIn(['AUTOMATIC', 'MANUAL', 'CVT', 'SEMI-AUTOMATIC', 'DUAL-CLUTCH'])
      .withMessage('Invalid transmission type'),
    body('fuelType')
      .optional()
      .isIn(['GASOLINE', 'DIESEL', 'ELECTRIC', 'HYBRID', 'PLUG-IN HYBRID'])
      .withMessage('Invalid fuel type'),
    body('engineSize').optional(),
    body('description').optional(),
    body('features').optional().isArray().withMessage('Features must be an array'),
    body('images').optional().isArray().withMessage('Images must be an array'),
    body('status')
      .optional()
      .isIn(['AVAILABLE', 'SOLD', 'RESERVED', 'MAINTENANCE'])
      .withMessage('Invalid status'),
    body('isFeatured').optional().isBoolean().withMessage('isFeatured must be a boolean'),
    body('exteriorCondition')
      .optional()
      .isIn(['EXCELLENT', 'GOOD', 'FAIR', 'POOR'])
      .withMessage('Invalid exterior condition'),
    body('interiorCondition')
      .optional()
      .isIn(['EXCELLENT', 'GOOD', 'FAIR', 'POOR'])
      .withMessage('Invalid interior condition'),
    body('previousOwners')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Previous owners must be a non-negative integer'),
    body('serviceHistory')
      .optional()
      .isBoolean()
      .withMessage('Service history must be a boolean')
  ],
  carController.createCar
);

/**
 * @route PUT /api/cars/:id
 * @desc Update an existing car
 * @access Private (Admin, Staff)
 */
router.put(
  '/cars/:id',
  authenticate,
  checkPermission('cars', 'update'),
  [
    param('id').isInt().withMessage('Invalid ID format'),
    body('vin')
      .optional()
      .isLength({ min: 17, max: 17 })
      .withMessage('VIN must be exactly 17 characters'),
    body('make').optional().notEmpty().withMessage('Make cannot be empty'),
    body('model').optional().notEmpty().withMessage('Model cannot be empty'),
    body('year')
      .optional()
      .isInt({ min: 1900, max: new Date().getFullYear() + 1 })
      .withMessage('Year must be valid'),
    body('type')
      .optional()
      .isIn(['NEW', 'USED'])
      .withMessage('Type must be NEW or USED'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('status')
      .optional()
      .isIn(['AVAILABLE', 'SOLD', 'RESERVED', 'MAINTENANCE'])
      .withMessage('Invalid status')
  ],
  carController.updateCar
);

/**
 * @route DELETE /api/cars/:id
 * @desc Delete a car (soft delete)
 * @access Private (Admin)
 */
router.delete(
  '/cars/:id',
  authenticate,
  checkPermission('cars', 'delete'),
  [param('id').isInt().withMessage('Invalid ID format')],
  carController.deleteCar
);

/**
 * @route GET /api/cars/featured
 * @desc Get featured cars
 * @access Public
 */
router.get('/cars/featured', carController.getFeaturedCars);

/**
 * @route POST /api/cars/search
 * @desc Advanced search for cars
 * @access Public
 */
router.post('/cars/search', carController.searchCars);

/**
 * @route GET /api/cars/stats
 * @desc Get car statistics for dashboard
 * @access Private (Admin, Staff, Salesperson)
 */
router.get(
  '/cars/stats',
  authenticate,
  authorize([Role.ADMIN, Role.STAFF, Role.SALESPERSON]),
  carController.getCarStats
);

module.exports = router; 