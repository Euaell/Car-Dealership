const express = require('express');
const { body, param, query } = require('express-validator');
const sparePartController = require('../controllers/sparePartController');
const { authenticate, authorize, checkPermission } = require('../middleware/authMiddleware');
const { Role } = require('../models');

const router = express.Router();

/**
 * @route GET /api/spare-parts
 * @desc Get all spare parts with filtering, pagination, and sorting
 * @access Public
 */
router.get('/spare-parts', sparePartController.getSpareParts);

/**
 * @route GET /api/spare-parts/low-stock
 * @desc Get low stock spare parts
 * @access Private (Admin, Staff)
 */
router.get(
  '/spare-parts/low-stock',
  authenticate,
  authorize([Role.ADMIN, Role.STAFF]),
  sparePartController.getLowStockParts
);

/**
 * @route GET /api/spare-parts/:id
 * @desc Get spare part by ID
 * @access Public
 */
router.get(
  '/spare-parts/:id',
  [param('id').isInt().withMessage('Invalid ID format')],
  sparePartController.getSparePartById
);

/**
 * @route POST /api/spare-parts
 * @desc Create a new spare part
 * @access Private (Admin, Staff)
 */
router.post(
  '/spare-parts',
  authenticate,
  checkPermission('spareParts', 'create'),
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('partNumber').notEmpty().withMessage('Part number is required'),
    body('price')
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('category').notEmpty().withMessage('Category is required'),
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer'),
    body('compatibility')
      .optional()
      .isArray()
      .withMessage('Compatibility must be an array'),
    body('manufacturer').optional(),
    body('weight')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Weight must be a positive number'),
    body('dimensions').optional(),
    body('images')
      .optional()
      .isArray()
      .withMessage('Images must be an array'),
    body('isOriginal')
      .optional()
      .isBoolean()
      .withMessage('isOriginal must be a boolean'),
    body('minStockLevel')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Minimum stock level must be a non-negative integer'),
    body('location').optional(),
    body('warrantyPeriod')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Warranty period must be a non-negative integer')
  ],
  sparePartController.createSparePart
);

/**
 * @route PUT /api/spare-parts/:id
 * @desc Update an existing spare part
 * @access Private (Admin, Staff)
 */
router.put(
  '/spare-parts/:id',
  authenticate,
  checkPermission('spareParts', 'update'),
  [
    param('id').isInt().withMessage('Invalid ID format'),
    body('name').optional().notEmpty().withMessage('Name cannot be empty'),
    body('partNumber').optional().notEmpty().withMessage('Part number cannot be empty'),
    body('price')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Price must be a positive number'),
    body('stock')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Stock must be a non-negative integer'),
    body('minStockLevel')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Minimum stock level must be a non-negative integer')
  ],
  sparePartController.updateSparePart
);

/**
 * @route DELETE /api/spare-parts/:id
 * @desc Delete a spare part (soft delete)
 * @access Private (Admin)
 */
router.delete(
  '/spare-parts/:id',
  authenticate,
  checkPermission('spareParts', 'delete'),
  [param('id').isInt().withMessage('Invalid ID format')],
  sparePartController.deleteSparePart
);

/**
 * @route POST /api/spare-parts/:id/adjust-stock
 * @desc Adjust inventory stock
 * @access Private (Admin, Staff)
 */
router.post(
  '/spare-parts/:id/adjust-stock',
  authenticate,
  authorize([Role.ADMIN, Role.STAFF]),
  [
    param('id').isInt().withMessage('Invalid ID format'),
    body('quantity')
      .isInt({ min: 1 })
      .withMessage('Quantity must be a positive integer'),
    body('operation')
      .isIn(['add', 'subtract'])
      .withMessage('Operation must be either "add" or "subtract"'),
    body('reason').optional()
  ],
  sparePartController.adjustStock
);

module.exports = router; 