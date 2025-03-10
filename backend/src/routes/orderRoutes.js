const express = require('express');
const { check, body } = require('express-validator');
const orderController = require('../controllers/orderController');
const auth = require('../middleware/auth');
const { roles } = require('../config/roles');

const router = express.Router();

/**
 * @route GET /api/orders
 * @desc Get all orders with filtering, pagination, and sorting
 * @access Private (Admin, Staff)
 */
router.get(
  '/',
  auth.authenticate,
  auth.authorize([roles.ADMIN, roles.STAFF]),
  orderController.getOrders
);

/**
 * @route GET /api/orders/stats
 * @desc Get order statistics
 * @access Private (Admin, Staff)
 */
router.get(
  '/stats',
  auth.authenticate,
  auth.authorize([roles.ADMIN, roles.STAFF]),
  orderController.getOrderStats
);

/**
 * @route GET /api/orders/:id
 * @desc Get a specific order by ID
 * @access Private (Admin, Staff, Owner)
 */
router.get(
  '/:id',
  auth.authenticate,
  [check('id').isInt().withMessage('Order ID must be an integer')],
  orderController.getOrderById
);

/**
 * @route POST /api/orders
 * @desc Create a new order
 * @access Private (All authenticated users)
 */
router.post(
  '/',
  auth.authenticate,
  [
    // Basic order validation
    check('userId').isInt().withMessage('User ID is required and must be an integer'),
    check('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
    check('paymentMethod')
      .optional()
      .isIn(['CREDIT_CARD', 'DEBIT_CARD', 'PAYPAL', 'BANK_TRANSFER', 'CASH'])
      .withMessage('Invalid payment method'),
    
    // Car validation (optional)
    check('carId').optional().isInt().withMessage('Car ID must be an integer'),
    
    // Addresses validation
    check('shippingAddress')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Shipping address cannot be empty if provided'),
    check('billingAddress')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Billing address cannot be empty if provided'),
    
    // Items validation (spare parts)
    check('items')
      .optional()
      .isArray()
      .withMessage('Items must be an array'),
    check('items.*.sparePartId')
      .optional()
      .isInt()
      .withMessage('Each spare part item must have a valid sparePartId'),
    check('items.*.quantity')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Quantity must be at least 1'),
    check('items.*.unitPrice')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Unit price must be a positive number'),
  ],
  orderController.createOrder
);

/**
 * @route PUT /api/orders/:id/status
 * @desc Update order status
 * @access Private (Admin, Staff)
 */
router.put(
  '/:id/status',
  auth.authenticate,
  auth.authorize([roles.ADMIN, roles.STAFF]),
  [
    check('id').isInt().withMessage('Order ID must be an integer'),
    check('status')
      .optional()
      .isIn(['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'])
      .withMessage('Invalid order status'),
    check('paymentStatus')
      .optional()
      .isIn(['PAID', 'UNPAID', 'REFUNDED', 'PARTIALLY_PAID'])
      .withMessage('Invalid payment status'),
    check('trackingNumber')
      .optional()
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Tracking number cannot be empty if provided'),
    check('notes')
      .optional()
      .isString()
      .trim()
  ],
  orderController.updateOrderStatus
);

/**
 * @route POST /api/orders/:id/cancel
 * @desc Cancel an order
 * @access Private (Admin, Staff, Owner)
 */
router.post(
  '/:id/cancel',
  auth.authenticate,
  [
    check('id').isInt().withMessage('Order ID must be an integer'),
    check('reason')
      .optional()
      .isString()
      .trim()
  ],
  orderController.cancelOrder
);

/**
 * @route GET /api/users/:userId/orders
 * @desc Get all orders for a specific user
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
    
    // If user is requesting their own orders, allow access
    if (parseInt(req.params.userId) === req.user.id) {
      return next();
    }
    
    // Otherwise, forbid access
    return res.status(403).json({
      status: 'error',
      message: 'You do not have permission to view these orders'
    });
  },
  orderController.getUserOrders
);

module.exports = router; 