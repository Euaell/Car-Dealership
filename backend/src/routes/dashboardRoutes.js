const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const { roles } = require('../config/roles');

const router = express.Router();

/**
 * @route GET /api/dashboard/summary
 * @desc Get summary statistics for the dashboard
 * @access Private (Admin, Staff)
 */
router.get(
  '/summary',
  auth.authenticate,
  auth.authorize([roles.ADMIN, roles.STAFF]),
  dashboardController.getDashboardSummary
);

/**
 * @route GET /api/dashboard/sales
 * @desc Get sales data for charts
 * @access Private (Admin, Staff)
 */
router.get(
  '/sales',
  auth.authenticate,
  auth.authorize([roles.ADMIN, roles.STAFF]),
  dashboardController.getSalesData
);

/**
 * @route GET /api/dashboard/inventory
 * @desc Get inventory status data
 * @access Private (Admin, Staff)
 */
router.get(
  '/inventory',
  auth.authenticate,
  auth.authorize([roles.ADMIN, roles.STAFF]),
  dashboardController.getInventoryStatus
);

/**
 * @route GET /api/dashboard/upcoming
 * @desc Get upcoming services and pending orders
 * @access Private (Admin, Staff)
 */
router.get(
  '/upcoming',
  auth.authenticate,
  auth.authorize([roles.ADMIN, roles.STAFF]),
  dashboardController.getUpcomingActivities
);

/**
 * @route GET /api/dashboard/inventory-stats
 * @desc Get inventory statistics
 * @access Private (Admin, Staff)
 */
router.get(
  '/inventory-stats',
  auth.authenticate,
  auth.authorize([roles.ADMIN, roles.STAFF]),
  dashboardController.getInventoryStats
);

/**
 * @route GET /api/dashboard/customer-stats
 * @desc Get customer statistics
 * @access Private (Admin, Staff)
 */
router.get(
  '/customer-stats',
  auth.authenticate,
  auth.authorize([roles.ADMIN, roles.STAFF]),
  dashboardController.getCustomerStats
);

/**
 * @route GET /api/dashboard/recent-activity
 * @desc Get recent activity
 * @access Private (Admin, Staff)
 */
router.get(
  '/recent-activity',
  auth.authenticate,
  auth.authorize([roles.ADMIN, roles.STAFF]),
  dashboardController.getRecentActivity
);

module.exports = router; 