const { Op, Sequelize } = require('sequelize');
const { Car, SparePart, Order, User, Service, TestDrive } = require('../models');
const logger = require('../utils/logger');

/**
 * Get overview stats for dashboard
 * @route GET /api/dashboard/overview
 */
const getOverviewStats = async (req, res) => {
  try {
    // Get current month and year
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Calculate date range for current month
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    
    // Calculate date range for previous month
    const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfPrevMonth = new Date(currentYear, currentMonth, 0);
    
    // Total revenue for current month
    const currentMonthRevenue = await Order.sum('totalAmount', {
      where: {
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        },
        paymentStatus: 'PAID'
      }
    }) || 0;
    
    // Total revenue for previous month
    const prevMonthRevenue = await Order.sum('totalAmount', {
      where: {
        createdAt: {
          [Op.between]: [startOfPrevMonth, endOfPrevMonth]
        },
        paymentStatus: 'PAID'
      }
    }) || 0;
    
    // Calculate revenue change percentage
    const revenueChange = prevMonthRevenue === 0
      ? 100
      : ((currentMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100;
    
    // Total number of cars
    const totalCars = await Car.count();
    
    // Total cars sold this month
    const carsSoldThisMonth = await Car.count({
      where: {
        status: 'SOLD',
        updatedAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });
    
    // Total cars sold last month
    const carsSoldLastMonth = await Car.count({
      where: {
        status: 'SOLD',
        updatedAt: {
          [Op.between]: [startOfPrevMonth, endOfPrevMonth]
        }
      }
    });
    
    // Calculate sales change percentage
    const salesChange = carsSoldLastMonth === 0
      ? 100
      : ((carsSoldThisMonth - carsSoldLastMonth) / carsSoldLastMonth) * 100;
    
    // Total number of customers
    const totalCustomers = await User.count({
      where: {
        roleId: 3 // Assuming roleId 3 is for customers
      }
    });
    
    // New customers this month
    const newCustomersThisMonth = await User.count({
      where: {
        roleId: 3,
        createdAt: {
          [Op.between]: [startOfMonth, endOfMonth]
        }
      }
    });
    
    // Pending orders
    const pendingOrders = await Order.count({
      where: {
        status: {
          [Op.in]: ['PENDING', 'PROCESSING']
        }
      }
    });
    
    // Low stock spare parts
    const lowStockParts = await SparePart.count({
      where: {
        stock: {
          [Op.lte]: Sequelize.col('minStockLevel')
        }
      }
    });
    
    // Test drives scheduled today
    const testDrivesToday = await TestDrive.count({
      where: {
        scheduledDate: {
          [Op.between]: [
            new Date(today.setHours(0, 0, 0, 0)),
            new Date(today.setHours(23, 59, 59, 999))
          ]
        },
        status: 'SCHEDULED'
      }
    });
    
    // Services scheduled today
    const servicesToday = await Service.count({
      where: {
        scheduledDate: {
          [Op.between]: [
            new Date(today.setHours(0, 0, 0, 0)),
            new Date(today.setHours(23, 59, 59, 999))
          ]
        },
        status: 'SCHEDULED'
      }
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        revenue: {
          current: currentMonthRevenue,
          previous: prevMonthRevenue,
          change: revenueChange.toFixed(2)
        },
        cars: {
          total: totalCars,
          soldThisMonth: carsSoldThisMonth,
          soldLastMonth: carsSoldLastMonth,
          change: salesChange.toFixed(2)
        },
        customers: {
          total: totalCustomers,
          newThisMonth: newCustomersThisMonth
        },
        alerts: {
          pendingOrders,
          lowStockParts,
          testDrivesToday,
          servicesToday
        }
      }
    });
  } catch (error) {
    logger.error('Error getting dashboard overview stats:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve dashboard stats' 
    });
  }
};

/**
 * Get sales data for chart visualization
 * @route GET /api/dashboard/sales-chart
 */
const getSalesChartData = async (req, res) => {
  try {
    const { period = 'monthly', year = new Date().getFullYear() } = req.query;
    
    let salesData = [];
    
    if (period === 'monthly') {
      // Get monthly sales data for the specified year
      for (let month = 0; month < 12; month++) {
        const startDate = new Date(year, month, 1);
        const endDate = new Date(year, month + 1, 0);
        
        const revenue = await Order.sum('totalAmount', {
          where: {
            createdAt: {
              [Op.between]: [startDate, endDate]
            },
            paymentStatus: 'PAID'
          }
        }) || 0;
        
        const carsSold = await Car.count({
          where: {
            status: 'SOLD',
            updatedAt: {
              [Op.between]: [startDate, endDate]
            }
          }
        });
        
        salesData.push({
          month: startDate.toLocaleString('default', { month: 'short' }),
          revenue,
          carsSold
        });
      }
    } else if (period === 'weekly') {
      // Get weekly sales data for the last 12 weeks
      const today = new Date();
      for (let i = 11; i >= 0; i--) {
        const endDate = new Date(today);
        endDate.setDate(today.getDate() - (i * 7));
        
        const startDate = new Date(endDate);
        startDate.setDate(endDate.getDate() - 7);
        
        const revenue = await Order.sum('totalAmount', {
          where: {
            createdAt: {
              [Op.between]: [startDate, endDate]
            },
            paymentStatus: 'PAID'
          }
        }) || 0;
        
        const carsSold = await Car.count({
          where: {
            status: 'SOLD',
            updatedAt: {
              [Op.between]: [startDate, endDate]
            }
          }
        });
        
        salesData.push({
          week: `Week ${12 - i}`,
          revenue,
          carsSold
        });
      }
    } else if (period === 'daily') {
      // Get daily sales data for the last 14 days
      const today = new Date();
      for (let i = 13; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        
        const startDate = new Date(date.setHours(0, 0, 0, 0));
        const endDate = new Date(date.setHours(23, 59, 59, 999));
        
        const revenue = await Order.sum('totalAmount', {
          where: {
            createdAt: {
              [Op.between]: [startDate, endDate]
            },
            paymentStatus: 'PAID'
          }
        }) || 0;
        
        const carsSold = await Car.count({
          where: {
            status: 'SOLD',
            updatedAt: {
              [Op.between]: [startDate, endDate]
            }
          }
        });
        
        salesData.push({
          day: startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue,
          carsSold
        });
      }
    }
    
    res.status(200).json({
      status: 'success',
      data: { salesData }
    });
  } catch (error) {
    logger.error('Error getting sales chart data:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve sales chart data' 
    });
  }
};

/**
 * Get inventory statistics
 * @route GET /api/dashboard/inventory
 */
const getInventoryStats = async (req, res) => {
  try {
    // Cars by type
    const carsByType = await Car.findAll({
      attributes: [
        'type',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });
    
    // Cars by status
    const carsByStatus = await Car.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    // Cars by make (top 5)
    const carsByMake = await Car.findAll({
      attributes: [
        'make',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['make'],
      order: [[Sequelize.literal('count'), 'DESC']],
      limit: 5,
      raw: true
    });
    
    // Spare parts by category
    const sparePartsByCategory = await SparePart.findAll({
      attributes: [
        'category',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['category'],
      order: [[Sequelize.literal('count'), 'DESC']],
      raw: true
    });
    
    // Low stock spare parts
    const lowStockParts = await SparePart.findAll({
      attributes: ['id', 'name', 'partNumber', 'stock', 'minStockLevel', 'category'],
      where: {
        stock: {
          [Op.lte]: Sequelize.col('minStockLevel')
        }
      },
      limit: 10,
      order: [
        [Sequelize.literal('stock - minStockLevel'), 'ASC']
      ],
      raw: true
    });
    
    // Inventory value
    const carInventoryValue = await Car.sum('price', {
      where: {
        status: 'AVAILABLE'
      }
    }) || 0;
    
    const sparePartsInventoryValue = await SparePart.sum(
      Sequelize.literal('price * stock'),
      { raw: true }
    ) || 0;
    
    res.status(200).json({
      status: 'success',
      data: {
        carsByType,
        carsByStatus,
        carsByMake,
        sparePartsByCategory,
        lowStockParts,
        inventoryValue: {
          cars: carInventoryValue,
          spareParts: sparePartsInventoryValue,
          total: carInventoryValue + sparePartsInventoryValue
        }
      }
    });
  } catch (error) {
    logger.error('Error getting inventory stats:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve inventory statistics' 
    });
  }
};

/**
 * Get customer statistics
 * @route GET /api/dashboard/customers
 */
const getCustomerStats = async (req, res) => {
  try {
    // Total number of customers
    const totalCustomers = await User.count({
      where: {
        roleId: 3 // Assuming roleId 3 is for customers
      }
    });
    
    // New customers per month (last 6 months)
    const currentDate = new Date();
    const months = [];
    const newCustomersData = [];
    
    for (let i = 5; i >= 0; i--) {
      const month = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      const count = await User.count({
        where: {
          roleId: 3,
          createdAt: {
            [Op.between]: [month, monthEnd]
          }
        }
      });
      
      months.push(month.toLocaleString('default', { month: 'short' }));
      newCustomersData.push(count);
    }
    
    // Top customers by total purchases
    const topCustomers = await Order.findAll({
      attributes: [
        'userId',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'orderCount'],
        [Sequelize.fn('SUM', Sequelize.col('totalAmount')), 'totalSpent']
      ],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      group: ['userId', 'user.id', 'user.name', 'user.email'],
      order: [[Sequelize.literal('totalSpent'), 'DESC']],
      limit: 5,
      raw: true
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        totalCustomers,
        newCustomers: {
          months,
          data: newCustomersData
        },
        topCustomers
      }
    });
  } catch (error) {
    logger.error('Error getting customer stats:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve customer statistics' 
    });
  }
};

/**
 * Get recent activity for dashboard
 * @route GET /api/dashboard/activity
 */
const getRecentActivity = async (req, res) => {
  try {
    // Recent orders
    const recentOrders = await Order.findAll({
      attributes: ['id', 'orderNumber', 'totalAmount', 'status', 'createdAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        },
        {
          model: Car,
          as: 'car',
          attributes: ['id', 'make', 'model', 'year']
        }
      ],
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    
    // Recent test drives
    const recentTestDrives = await TestDrive.findAll({
      attributes: ['id', 'scheduledDate', 'status', 'createdAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        },
        {
          model: Car,
          as: 'car',
          attributes: ['id', 'make', 'model', 'year']
        }
      ],
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    
    // Recent services
    const recentServices = await Service.findAll({
      attributes: ['id', 'serviceType', 'scheduledDate', 'status', 'createdAt'],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name']
        },
        {
          model: Car,
          as: 'car',
          attributes: ['id', 'make', 'model', 'year']
        }
      ],
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    
    // Recent customers
    const recentCustomers = await User.findAll({
      attributes: ['id', 'name', 'email', 'createdAt'],
      where: {
        roleId: 3 // Assuming roleId 3 is for customers
      },
      limit: 5,
      order: [['createdAt', 'DESC']]
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        recentOrders,
        recentTestDrives,
        recentServices,
        recentCustomers
      }
    });
  } catch (error) {
    logger.error('Error getting recent activity:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve recent activity' 
    });
  }
};

/**
 * Get summary statistics for the dashboard
 * @route GET /api/dashboard/summary
 */
const getDashboardSummary = async (req, res) => {
  try {
    // Get date range for filtering (default to last 30 days)
    const { startDate, endDate } = req.query;
    const endDateTime = endDate ? new Date(endDate) : new Date();
    const startDateTime = startDate 
      ? new Date(startDate) 
      : new Date(endDateTime.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    // Set end date to end of day
    endDateTime.setHours(23, 59, 59, 999);
    
    // Date range condition for queries
    const dateRangeCondition = {
      createdAt: {
        [Op.between]: [startDateTime, endDateTime]
      }
    };
    
    // Get car statistics
    const totalCars = await Car.count();
    const availableCars = await Car.count({ where: { status: 'AVAILABLE' } });
    const soldCars = await Car.count({ 
      where: { 
        status: 'SOLD',
        ...dateRangeCondition
      } 
    });
    
    // Get spare part statistics
    const totalSpareParts = await SparePart.count();
    const lowStockSpareParts = await SparePart.count({
      where: {
        stock: { [Op.lte]: Sequelize.col('minStockLevel') }
      }
    });
    const sparePartsSold = await sequelize.query(`
      SELECT SUM(oi.quantity) as total
      FROM OrderItems oi
      JOIN Orders o ON oi.orderId = o.id
      WHERE o.createdAt BETWEEN :startDate AND :endDate
      AND o.status IN ('DELIVERED', 'SHIPPED')
    `, {
      replacements: { startDate: startDateTime, endDate: endDateTime },
      type: Sequelize.QueryTypes.SELECT
    });
    
    // Get order statistics
    const totalOrders = await Order.count({ where: dateRangeCondition });
    const pendingOrders = await Order.count({ 
      where: { 
        status: 'PENDING',
        ...dateRangeCondition
      } 
    });
    const totalRevenue = await Order.sum('totalAmount', { 
      where: { 
        paymentStatus: 'PAID',
        ...dateRangeCondition
      } 
    }) || 0;
    
    // Get service statistics
    const totalServices = await Service.count({ where: dateRangeCondition });
    const scheduledServices = await Service.count({ 
      where: { 
        status: 'SCHEDULED',
        scheduledDate: { [Op.gte]: new Date() }
      } 
    });
    const completedServices = await Service.count({ 
      where: { 
        status: 'COMPLETED',
        ...dateRangeCondition
      } 
    });
    
    // Get user statistics
    const totalUsers = await User.count();
    const newUsers = await User.count({ where: dateRangeCondition });
    
    // Calculate average order value
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
    
    res.status(200).json({
      status: 'success',
      data: {
        dateRange: {
          startDate: startDateTime,
          endDate: endDateTime
        },
        cars: {
          total: totalCars,
          available: availableCars,
          sold: soldCars,
          soldPercentage: totalCars > 0 ? (soldCars / totalCars) * 100 : 0
        },
        spareParts: {
          total: totalSpareParts,
          lowStock: lowStockSpareParts,
          sold: sparePartsSold[0]?.total || 0
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          revenue: totalRevenue,
          avgOrderValue
        },
        services: {
          total: totalServices,
          scheduled: scheduledServices,
          completed: completedServices
        },
        users: {
          total: totalUsers,
          new: newUsers
        }
      }
    });
  } catch (error) {
    logger.error('Error getting dashboard summary:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve dashboard summary' 
    });
  }
};

/**
 * Get sales data for charts
 * @route GET /api/dashboard/sales
 */
const getSalesData = async (req, res) => {
  try {
    // Get parameters for filtering
    const { period = 'monthly', startDate, endDate, limit = 12 } = req.query;
    
    // Set date range
    const endDateTime = endDate ? new Date(endDate) : new Date();
    let startDateTime;
    
    if (startDate) {
      startDateTime = new Date(startDate);
    } else {
      // Default date range based on period
      switch (period) {
        case 'daily':
          startDateTime = new Date(endDateTime.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
          break;
        case 'weekly':
          startDateTime = new Date(endDateTime.getTime() - 12 * 7 * 24 * 60 * 60 * 1000); // 12 weeks ago
          break;
        case 'monthly':
        default:
          startDateTime = new Date(endDateTime.getTime() - 12 * 30 * 24 * 60 * 60 * 1000); // 12 months ago
          break;
      }
    }
    
    // Set end date to end of day
    endDateTime.setHours(23, 59, 59, 999);
    
    // Determine SQL date format and group by clause based on period
    let dateFormat, groupBy;
    
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        groupBy = 'DATE(createdAt)';
        break;
      case 'weekly':
        dateFormat = '%Y-%u'; // Year and week number
        groupBy = 'YEARWEEK(createdAt)';
        break;
      case 'monthly':
      default:
        dateFormat = '%Y-%m';
        groupBy = 'DATE_FORMAT(createdAt, "%Y-%m")';
        break;
    }
    
    // Get car sales data
    const carSales = await sequelize.query(`
      SELECT 
        DATE_FORMAT(createdAt, :dateFormat) as period,
        COUNT(*) as count,
        SUM(price) as revenue
      FROM Cars
      WHERE status = 'SOLD'
        AND createdAt BETWEEN :startDate AND :endDate
      GROUP BY ${groupBy}
      ORDER BY period DESC
      LIMIT :limit
    `, {
      replacements: { 
        dateFormat, 
        startDate: startDateTime, 
        endDate: endDateTime,
        limit: parseInt(limit)
      },
      type: Sequelize.QueryTypes.SELECT
    });
    
    // Get spare part sales data
    const sparePartSales = await sequelize.query(`
      SELECT 
        DATE_FORMAT(o.createdAt, :dateFormat) as period,
        SUM(oi.quantity) as count,
        SUM(oi.totalPrice) as revenue
      FROM OrderItems oi
      JOIN Orders o ON oi.orderId = o.id
      WHERE o.status IN ('DELIVERED', 'SHIPPED')
        AND o.createdAt BETWEEN :startDate AND :endDate
        AND oi.sparePartId IS NOT NULL
      GROUP BY ${groupBy}
      ORDER BY period DESC
      LIMIT :limit
    `, {
      replacements: { 
        dateFormat, 
        startDate: startDateTime, 
        endDate: endDateTime,
        limit: parseInt(limit)
      },
      type: Sequelize.QueryTypes.SELECT
    });
    
    // Get service revenue data
    const serviceRevenue = await sequelize.query(`
      SELECT 
        DATE_FORMAT(completedDate, :dateFormat) as period,
        COUNT(*) as count,
        SUM(actualCost) as revenue
      FROM Services
      WHERE status = 'COMPLETED'
        AND completedDate BETWEEN :startDate AND :endDate
      GROUP BY ${groupBy}
      ORDER BY period DESC
      LIMIT :limit
    `, {
      replacements: { 
        dateFormat, 
        startDate: startDateTime, 
        endDate: endDateTime,
        limit: parseInt(limit)
      },
      type: Sequelize.QueryTypes.SELECT
    });
    
    // Format the data for charts
    const formatChartData = (data) => {
      // Ensure data is in ascending order by period
      const sortedData = [...data].sort((a, b) => a.period.localeCompare(b.period));
      
      return {
        labels: sortedData.map(item => item.period),
        counts: sortedData.map(item => parseInt(item.count)),
        revenue: sortedData.map(item => parseFloat(item.revenue || 0))
      };
    };
    
    res.status(200).json({
      status: 'success',
      data: {
        period,
        dateRange: {
          startDate: startDateTime,
          endDate: endDateTime
        },
        carSales: formatChartData(carSales),
        sparePartSales: formatChartData(sparePartSales),
        serviceRevenue: formatChartData(serviceRevenue),
        totalRevenue: {
          cars: carSales.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0),
          spareParts: sparePartSales.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0),
          services: serviceRevenue.reduce((sum, item) => sum + parseFloat(item.revenue || 0), 0)
        }
      }
    });
  } catch (error) {
    logger.error('Error getting sales data:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve sales data' 
    });
  }
};

/**
 * Get inventory status data
 * @route GET /api/dashboard/inventory
 */
const getInventoryStatus = async (req, res) => {
  try {
    // Get car inventory by status
    const carsByStatus = await Car.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    // Get car inventory by type
    const carsByType = await Car.findAll({
      attributes: [
        'type',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });
    
    // Get car inventory by make
    const carsByMake = await Car.findAll({
      attributes: [
        'make',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['make'],
      order: [[Sequelize.literal('count'), 'DESC']],
      limit: 10,
      raw: true
    });
    
    // Get spare parts by category
    const sparePartsByCategory = await SparePart.findAll({
      attributes: [
        'category',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count'],
        [Sequelize.fn('SUM', Sequelize.col('stock')), 'totalStock'],
        [Sequelize.fn('AVG', Sequelize.col('price')), 'avgPrice']
      ],
      group: ['category'],
      raw: true
    });
    
    // Get low stock spare parts
    const lowStockSpareParts = await SparePart.findAll({
      where: {
        stock: { [Op.lte]: Sequelize.col('minStockLevel') }
      },
      attributes: ['id', 'name', 'partNumber', 'stock', 'minStockLevel', 'category'],
      order: [
        [Sequelize.literal('stock - minStockLevel'), 'ASC']
      ],
      limit: 10,
      raw: true
    });
    
    // Get top selling spare parts
    const topSellingParts = await sequelize.query(`
      SELECT 
        sp.id, sp.name, sp.partNumber, sp.category,
        SUM(oi.quantity) as totalSold,
        SUM(oi.totalPrice) as totalRevenue
      FROM SpareParts sp
      JOIN OrderItems oi ON sp.id = oi.sparePartId
      JOIN Orders o ON oi.orderId = o.id
      WHERE o.status IN ('DELIVERED', 'SHIPPED')
      GROUP BY sp.id
      ORDER BY totalSold DESC
      LIMIT 10
    `, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        cars: {
          byStatus: carsByStatus,
          byType: carsByType,
          byMake: carsByMake
        },
        spareParts: {
          byCategory: sparePartsByCategory,
          lowStock: lowStockSpareParts,
          topSelling: topSellingParts
        }
      }
    });
  } catch (error) {
    logger.error('Error getting inventory status:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve inventory status' 
    });
  }
};

/**
 * Get upcoming services and pending orders
 * @route GET /api/dashboard/upcoming
 */
const getUpcomingActivities = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const daysNum = parseInt(days);
    
    // Calculate date range
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + daysNum * 24 * 60 * 60 * 1000);
    
    // Get upcoming services
    const upcomingServices = await Service.findAll({
      where: {
        scheduledDate: {
          [Op.between]: [startDate, endDate]
        },
        status: 'SCHEDULED'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Car,
          as: 'car',
          attributes: ['id', 'make', 'model', 'year', 'vin', 'licensePlate']
        }
      ],
      order: [['scheduledDate', 'ASC']],
      limit: 10
    });
    
    // Get pending orders
    const pendingOrders = await Order.findAll({
      where: {
        status: 'PENDING'
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['createdAt', 'ASC']],
      limit: 10
    });
    
    // Get recent activities (combined orders and services)
    const recentActivities = await sequelize.query(`
      (SELECT 
        'order' as type,
        o.id,
        o.orderNumber as reference,
        o.status,
        o.createdAt as date,
        u.name as userName,
        CONCAT('Order ', o.status) as description
      FROM Orders o
      JOIN Users u ON o.userId = u.id
      ORDER BY o.createdAt DESC
      LIMIT 5)
      
      UNION ALL
      
      (SELECT 
        'service' as type,
        s.id,
        CONCAT('SRV-', s.id) as reference,
        s.status,
        s.createdAt as date,
        u.name as userName,
        CONCAT('Service ', s.status) as description
      FROM Services s
      JOIN Users u ON s.userId = u.id
      ORDER BY s.createdAt DESC
      LIMIT 5)
      
      ORDER BY date DESC
      LIMIT 10
    `, {
      type: Sequelize.QueryTypes.SELECT
    });
    
    res.status(200).json({
      status: 'success',
      data: {
        upcomingServices,
        pendingOrders,
        recentActivities
      }
    });
  } catch (error) {
    logger.error('Error getting upcoming activities:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve upcoming activities' 
    });
  }
};

module.exports = {
  getOverviewStats,
  getSalesChartData,
  getInventoryStats,
  getCustomerStats,
  getRecentActivity,
  getDashboardSummary,
  getSalesData,
  getInventoryStatus,
  getUpcomingActivities
}; 