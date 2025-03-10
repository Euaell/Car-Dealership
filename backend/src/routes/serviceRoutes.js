const express = require('express');
const { check } = require('express-validator');
const serviceController = require('../controllers/serviceController');
const auth = require('../middleware/auth');
const { roles } = require('../config/roles');

const router = express.Router();

/**
 * @route GET /api/services
 * @desc Get all services with filtering, pagination, and sorting
 * @access Private (Admin, Staff)
 */
router.get(
  '/',
  auth.authenticate,
  auth.authorize([roles.ADMIN, roles.STAFF]),
  serviceController.getServices
);

/**
 * @route GET /api/services/types
 * @desc Get all service types
 * @access Public
 */
router.get(
  '/types',
  serviceController.getServiceTypes
);

/**
 * @route POST /api/services/types
 * @desc Create a new service type
 * @access Private (Admin)
 */
router.post(
  '/types',
  auth.authenticate,
  auth.authorize([roles.ADMIN]),
  [
    check('name')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Service type name is required'),
    check('description')
      .optional()
      .isString()
      .trim(),
    check('estimatedDuration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Estimated duration must be a positive integer (in minutes)'),
    check('basePrice')
      .isFloat({ min: 0 })
      .withMessage('Base price must be a positive number')
  ],
  serviceController.createServiceType
);

/**
 * @route PUT /api/services/types/:id
 * @desc Update a service type
 * @access Private (Admin)
 */
router.put(
  '/types/:id',
  auth.authenticate,
  auth.authorize([roles.ADMIN]),
  [
    check('id').isInt().withMessage('Service type ID must be an integer'),
    check('name')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Service type name cannot be empty if provided'),
    check('description')
      .optional()
      .isString()
      .trim(),
    check('estimatedDuration')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Estimated duration must be a positive integer (in minutes)'),
    check('basePrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Base price must be a positive number')
  ],
  serviceController.updateServiceType
);

/**
 * @route DELETE /api/services/types/:id
 * @desc Delete a service type
 * @access Private (Admin)
 */
router.delete(
  '/types/:id',
  auth.authenticate,
  auth.authorize([roles.ADMIN]),
  [check('id').isInt().withMessage('Service type ID must be an integer')],
  serviceController.deleteServiceType
);

/**
 * @route GET /api/services/:id
 * @desc Get a specific service by ID
 * @access Private (Admin, Staff, Owner)
 */
router.get(
  '/:id',
  auth.authenticate,
  [check('id').isInt().withMessage('Service ID must be an integer')],
  async (req, res, next) => {
    // If user is admin or staff, allow access
    if (req.user.role === roles.ADMIN || req.user.role === roles.STAFF) {
      return next();
    }
    
    // Otherwise, check if user is the owner of the service
    const serviceId = parseInt(req.params.id);
    const service = await require('../models').Service.findByPk(serviceId);
    
    if (!service) {
      return res.status(404).json({
        status: 'error',
        message: 'Service not found'
      });
    }
    
    if (service.userId === req.user.id) {
      return next();
    }
    
    // If not the owner, forbid access
    return res.status(403).json({
      status: 'error',
      message: 'You do not have permission to view this service'
    });
  },
  serviceController.getServiceById
);

/**
 * @route POST /api/services
 * @desc Create a new service appointment
 * @access Private (All authenticated users)
 */
router.post(
  '/',
  auth.authenticate,
  [
    check('userId').isInt().withMessage('User ID is required and must be an integer'),
    check('carId').isInt().withMessage('Car ID is required and must be an integer'),
    check('serviceTypeId').isInt().withMessage('Service type ID is required and must be an integer'),
    check('scheduledDate')
      .isISO8601()
      .withMessage('Scheduled date must be a valid date in ISO 8601 format'),
    check('notes')
      .optional()
      .isString()
      .trim(),
    check('status')
      .optional()
      .isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
      .withMessage('Invalid service status'),
    check('estimatedCost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Estimated cost must be a positive number')
  ],
  serviceController.createService
);

/**
 * @route PUT /api/services/:id
 * @desc Update a service appointment
 * @access Private (Admin, Staff)
 */
router.put(
  '/:id',
  auth.authenticate,
  auth.authorize([roles.ADMIN, roles.STAFF]),
  [
    check('id').isInt().withMessage('Service ID must be an integer'),
    check('scheduledDate')
      .optional()
      .isISO8601()
      .withMessage('Scheduled date must be a valid date in ISO 8601 format'),
    check('status')
      .optional()
      .isIn(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
      .withMessage('Invalid service status'),
    check('notes')
      .optional()
      .isString()
      .trim(),
    check('completedDate')
      .optional()
      .isISO8601()
      .withMessage('Completed date must be a valid date in ISO 8601 format'),
    check('actualCost')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Actual cost must be a positive number'),
    check('technicianNotes')
      .optional()
      .isString()
      .trim(),
    check('serviceTypeId')
      .optional()
      .isInt()
      .withMessage('Service type ID must be an integer')
  ],
  serviceController.updateService
);

/**
 * @route POST /api/services/:id/cancel
 * @desc Cancel a service appointment
 * @access Private (Admin, Staff, Owner)
 */
router.post(
  '/:id/cancel',
  auth.authenticate,
  [
    check('id').isInt().withMessage('Service ID must be an integer'),
    check('reason')
      .optional()
      .isString()
      .trim()
  ],
  async (req, res, next) => {
    // If user is admin or staff, allow access
    if (req.user.role === roles.ADMIN || req.user.role === roles.STAFF) {
      return next();
    }
    
    // Otherwise, check if user is the owner of the service
    const serviceId = parseInt(req.params.id);
    const service = await require('../models').Service.findByPk(serviceId);
    
    if (!service) {
      return res.status(404).json({
        status: 'error',
        message: 'Service not found'
      });
    }
    
    if (service.userId === req.user.id) {
      return next();
    }
    
    // If not the owner, forbid access
    return res.status(403).json({
      status: 'error',
      message: 'You do not have permission to cancel this service'
    });
  },
  serviceController.cancelService
);

/**
 * @route GET /api/users/:userId/services
 * @desc Get all services for a specific user
 * @access Private (Admin, Staff, Owner)
 */
router.get(
  '/user/:userId',
  auth.authenticate,
  [check('userId').isInt().withMessage('User ID must be an integer')],
  async (req, res, next) => {
    // If user is admin or staff, allow access
    if (req.user.role === roles.ADMIN || req.user.role === roles.STAFF) {
      return next();
    }
    
    // If user is requesting their own services, allow access
    if (parseInt(req.params.userId) === req.user.id) {
      return next();
    }
    
    // Otherwise, forbid access
    return res.status(403).json({
      status: 'error',
      message: 'You do not have permission to view these services'
    });
  },
  serviceController.getUserServices
);

module.exports = router; 