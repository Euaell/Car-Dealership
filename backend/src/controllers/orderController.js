const { Op, Sequelize } = require('sequelize');
const { 
  Order, OrderItem, Car, SparePart, User, sequelize 
} = require('../models');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Get all orders with filtering, pagination, and sorting
 * @route GET /api/orders
 */
const getOrders = async (req, res) => {
  try {
    const {
      // Filtering
      userId,
      status,
      paymentStatus,
      startDate,
      endDate,
      minAmount,
      maxAmount,
      
      // Pagination
      page = 1,
      limit = 10,
      
      // Sorting
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;
    
    // Build filter conditions
    const whereConditions = {};
    
    if (userId) whereConditions.userId = userId;
    if (status) whereConditions.status = status;
    if (paymentStatus) whereConditions.paymentStatus = paymentStatus;
    
    // Date range filter
    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) whereConditions.createdAt[Op.gte] = new Date(startDate);
      if (endDate) {
        // Make endDate inclusive by setting it to the end of the day
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        whereConditions.createdAt[Op.lte] = endOfDay;
      }
    }
    
    // Amount range filter
    if (minAmount || maxAmount) {
      whereConditions.totalAmount = {};
      if (minAmount) whereConditions.totalAmount[Op.gte] = minAmount;
      if (maxAmount) whereConditions.totalAmount[Op.lte] = maxAmount;
    }
    
    // Calculate pagination values
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;
    
    // Validate sort parameters
    const validSortFields = [
      'id', 'orderNumber', 'totalAmount', 'status', 'paymentStatus', 
      'createdAt', 'updatedAt'
    ];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Execute query
    const { count, rows: orders } = await Order.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Car,
          as: 'car',
          required: false,
          attributes: ['id', 'make', 'model', 'year', 'vin']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: SparePart,
              as: 'sparePart',
              attributes: ['id', 'name', 'partNumber']
            }
          ]
        }
      ],
      limit: limitNumber,
      offset,
      order: [[sortField, order]],
      distinct: true, // This is needed when using include with pagination
      paranoid: true // Exclude soft-deleted orders
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limitNumber);
    
    res.status(200).json({
      status: 'success',
      data: {
        orders,
        pagination: {
          total: count,
          page: pageNumber,
          limit: limitNumber,
          totalPages
        }
      }
    });
  } catch (error) {
    logger.error('Error getting orders:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve orders' 
    });
  }
};

/**
 * Get order by ID
 * @route GET /api/orders/:id
 */
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'address']
        },
        {
          model: Car,
          as: 'car',
          required: false,
          attributes: ['id', 'make', 'model', 'year', 'vin', 'price', 'type', 'color']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: SparePart,
              as: 'sparePart',
              attributes: ['id', 'name', 'partNumber', 'price', 'category', 'manufacturer']
            }
          ]
        }
      ]
    });
    
    if (!order) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Order not found' 
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { order }
    });
  } catch (error) {
    logger.error(`Error getting order with id ${req.params.id}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve order' 
    });
  }
};

/**
 * Create a new order
 * @route POST /api/orders
 */
const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        status: 'error', 
        errors: errors.array() 
      });
    }
    
    const {
      userId,
      carId,
      items,
      totalAmount,
      paymentMethod,
      status = 'PENDING',
      paymentStatus = 'UNPAID',
      shippingAddress,
      billingAddress,
      shippingMethod,
      notes,
      discountAmount = 0,
      taxAmount = 0,
      shippingCost = 0
    } = req.body;
    
    // Verify the user exists
    const user = await User.findByPk(userId, { transaction });
    if (!user) {
      await transaction.rollback();
      return res.status(404).json({ 
        status: 'error', 
        message: 'User not found' 
      });
    }
    
    // If carId is provided, verify the car exists and is available
    if (carId) {
      const car = await Car.findByPk(carId, { transaction });
      if (!car) {
        await transaction.rollback();
        return res.status(404).json({ 
          status: 'error', 
          message: 'Car not found' 
        });
      }
      
      if (car.status !== 'AVAILABLE') {
        await transaction.rollback();
        return res.status(400).json({ 
          status: 'error', 
          message: `Car is not available for purchase. Current status: ${car.status}` 
        });
      }
    }
    
    // Generate order number
    const prefix = 'ORD';
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const orderNumber = `${prefix}-${timestamp}-${random}`;
    
    // Create the order
    const order = await Order.create({
      userId,
      carId,
      orderNumber,
      totalAmount,
      status,
      paymentStatus,
      paymentMethod,
      shippingAddress,
      billingAddress,
      shippingMethod,
      notes,
      discountAmount,
      taxAmount,
      shippingCost
    }, { transaction });
    
    // If there are spare parts items, process them
    if (items && items.length > 0) {
      // Validate and create order items
      for (const item of items) {
        const { sparePartId, quantity, unitPrice, discount = 0 } = item;
        
        // Verify the spare part exists and has enough stock
        const sparePart = await SparePart.findByPk(sparePartId, { transaction });
        if (!sparePart) {
          await transaction.rollback();
          return res.status(404).json({ 
            status: 'error', 
            message: `Spare part with ID ${sparePartId} not found` 
          });
        }
        
        if (sparePart.stock < quantity) {
          await transaction.rollback();
          return res.status(400).json({ 
            status: 'error', 
            message: `Not enough stock for spare part ${sparePart.name}. Available: ${sparePart.stock}, Requested: ${quantity}` 
          });
        }
        
        // Calculate total price for this item
        const totalPrice = (unitPrice * quantity) - discount;
        
        // Create order item
        await OrderItem.create({
          orderId: order.id,
          sparePartId,
          quantity,
          unitPrice,
          totalPrice,
          discount
        }, { transaction });
        
        // Update stock
        await sparePart.update({
          stock: sparePart.stock - quantity
        }, { transaction });
      }
    }
    
    // If car is being purchased, update its status
    if (carId) {
      await Car.update({
        status: 'RESERVED'
      }, { 
        where: { id: carId },
        transaction
      });
    }
    
    // Commit the transaction
    await transaction.commit();
    
    // Fetch the complete order with all relations for response
    const completeOrder = await Order.findByPk(order.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Car,
          as: 'car',
          required: false,
          attributes: ['id', 'make', 'model', 'year', 'vin']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: SparePart,
              as: 'sparePart',
              attributes: ['id', 'name', 'partNumber']
            }
          ]
        }
      ]
    });
    
    logger.info(`New order created: ${order.id} - ${order.orderNumber}`);
    
    res.status(201).json({
      status: 'success',
      data: { order: completeOrder }
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    
    logger.error('Error creating order:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to create order' 
    });
  }
};

/**
 * Update an existing order's status
 * @route PUT /api/orders/:id/status
 */
const updateOrderStatus = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { status, paymentStatus, trackingNumber, notes } = req.body;
    
    // Find the order to update
    const order = await Order.findByPk(id, {
      include: [
        {
          model: Car,
          as: 'car',
          required: false,
        }
      ],
      transaction
    });
    
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ 
        status: 'error', 
        message: 'Order not found' 
      });
    }
    
    const previousStatus = order.status;
    const previousPaymentStatus = order.paymentStatus;
    
    const updateData = {};
    
    // Update order status if provided
    if (status && status !== previousStatus) {
      updateData.status = status;
      
      // If status is changed to DELIVERED or CANCELLED, update the car status
      if (order.carId) {
        let carStatus;
        if (status === 'DELIVERED') {
          carStatus = 'SOLD';
        } else if (status === 'CANCELLED' && previousStatus === 'RESERVED') {
          carStatus = 'AVAILABLE';
        }
        
        if (carStatus) {
          await Car.update({
            status: carStatus
          }, { 
            where: { id: order.carId },
            transaction
          });
        }
      }
      
      // If status is changed to CANCELLED, restore spare parts stock
      if (status === 'CANCELLED' && (previousStatus === 'PENDING' || previousStatus === 'PROCESSING')) {
        const orderItems = await OrderItem.findAll({
          where: { orderId: id },
          include: [
            {
              model: SparePart,
              as: 'sparePart'
            }
          ],
          transaction
        });
        
        // For each item, restore the stock
        for (const item of orderItems) {
          if (item.sparePartId) {
            await SparePart.increment(
              { stock: item.quantity },
              { 
                where: { id: item.sparePartId },
                transaction
              }
            );
          }
        }
      }
    }
    
    // Update payment status if provided
    if (paymentStatus && paymentStatus !== previousPaymentStatus) {
      updateData.paymentStatus = paymentStatus;
    }
    
    // Update tracking number if provided
    if (trackingNumber) {
      updateData.trackingNumber = trackingNumber;
    }
    
    // Update notes if provided
    if (notes) {
      updateData.notes = order.notes 
        ? `${order.notes}\n\n${new Date().toISOString()}: ${notes}`
        : `${new Date().toISOString()}: ${notes}`;
    }
    
    // Update the order if there are changes
    if (Object.keys(updateData).length > 0) {
      await order.update(updateData, { transaction });
    }
    
    // Commit the transaction
    await transaction.commit();
    
    // Fetch the updated order with all relations for response
    const updatedOrder = await Order.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email']
        },
        {
          model: Car,
          as: 'car',
          required: false,
          attributes: ['id', 'make', 'model', 'year', 'vin', 'status']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: SparePart,
              as: 'sparePart',
              attributes: ['id', 'name', 'partNumber']
            }
          ]
        }
      ]
    });
    
    logger.info(`Order status updated: ${order.id} - ${order.orderNumber} - Status: ${status || 'unchanged'}, Payment Status: ${paymentStatus || 'unchanged'}`);
    
    res.status(200).json({
      status: 'success',
      data: { 
        order: updatedOrder,
        changes: {
          status: status !== previousStatus ? {
            from: previousStatus,
            to: status
          } : undefined,
          paymentStatus: paymentStatus !== previousPaymentStatus ? {
            from: previousPaymentStatus,
            to: paymentStatus
          } : undefined
        }
      }
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    
    logger.error(`Error updating order status with id ${req.params.id}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update order status' 
    });
  }
};

/**
 * Cancel an order
 * @route POST /api/orders/:id/cancel
 */
const cancelOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Find the order to cancel
    const order = await Order.findByPk(id, {
      include: [
        {
          model: Car,
          as: 'car',
          required: false,
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: SparePart,
              as: 'sparePart'
            }
          ]
        }
      ],
      transaction
    });
    
    if (!order) {
      await transaction.rollback();
      return res.status(404).json({ 
        status: 'error', 
        message: 'Order not found' 
      });
    }
    
    // Check if the order can be cancelled
    if (order.status === 'DELIVERED' || order.status === 'CANCELLED') {
      await transaction.rollback();
      return res.status(400).json({ 
        status: 'error', 
        message: `Cannot cancel an order that is already ${order.status.toLowerCase()}` 
      });
    }
    
    // Update order status
    await order.update({
      status: 'CANCELLED',
      notes: order.notes 
        ? `${order.notes}\n\nCANCELLED on ${new Date().toISOString()}: ${reason || 'No reason provided'}`
        : `CANCELLED on ${new Date().toISOString()}: ${reason || 'No reason provided'}`
    }, { transaction });
    
    // If the order included a car, make it available again
    if (order.carId && order.car) {
      await Car.update({
        status: 'AVAILABLE'
      }, { 
        where: { id: order.carId },
        transaction
      });
    }
    
    // If the order included spare parts, restore their stock
    if (order.items && order.items.length > 0) {
      for (const item of order.items) {
        if (item.sparePartId && item.sparePart) {
          await SparePart.increment(
            { stock: item.quantity },
            { 
              where: { id: item.sparePartId },
              transaction
            }
          );
        }
      }
    }
    
    // Commit the transaction
    await transaction.commit();
    
    logger.info(`Order cancelled: ${order.id} - ${order.orderNumber} - Reason: ${reason || 'No reason provided'}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Order cancelled successfully',
      data: { order }
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    
    logger.error(`Error cancelling order with id ${req.params.id}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to cancel order' 
    });
  }
};

/**
 * Get order statistics
 * @route GET /api/orders/stats
 */
const getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Set date range
    const whereConditions = {};
    if (startDate || endDate) {
      whereConditions.createdAt = {};
      if (startDate) whereConditions.createdAt[Op.gte] = new Date(startDate);
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        whereConditions.createdAt[Op.lte] = endOfDay;
      }
    }
    
    // Total orders
    const totalOrders = await Order.count({
      where: whereConditions
    });
    
    // Orders by status
    const ordersByStatus = await Order.findAll({
      attributes: [
        'status',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: whereConditions,
      group: ['status'],
      raw: true
    });
    
    // Orders by payment status
    const ordersByPaymentStatus = await Order.findAll({
      attributes: [
        'paymentStatus',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      where: whereConditions,
      group: ['paymentStatus'],
      raw: true
    });
    
    // Total revenue
    const totalRevenue = await Order.sum('totalAmount', {
      where: {
        ...whereConditions,
        paymentStatus: 'PAID'
      }
    }) || 0;
    
    // Total cars sold
    const carsSold = await Order.count({
      where: {
        ...whereConditions,
        carId: { [Op.ne]: null },
        status: { [Op.in]: ['DELIVERED', 'SHIPPED'] }
      }
    });
    
    // Total spare parts sold
    const sparePartsSold = await OrderItem.sum('quantity', {
      include: [
        {
          model: Order,
          as: 'order',
          where: {
            ...whereConditions,
            status: { [Op.in]: ['DELIVERED', 'SHIPPED'] }
          }
        }
      ]
    }) || 0;
    
    // Average order value
    const avgOrderValue = totalOrders > 0 ? (totalRevenue / totalOrders) : 0;
    
    res.status(200).json({
      status: 'success',
      data: {
        totalOrders,
        ordersByStatus,
        ordersByPaymentStatus,
        totalRevenue,
        carsSold,
        sparePartsSold,
        avgOrderValue
      }
    });
  } catch (error) {
    logger.error('Error getting order statistics:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve order statistics' 
    });
  }
};

/**
 * Get user orders
 * @route GET /api/users/:userId/orders
 */
const getUserOrders = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    // Verify user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'User not found' 
      });
    }
    
    // Calculate pagination values
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;
    
    // Get user orders
    const { count, rows: orders } = await Order.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Car,
          as: 'car',
          required: false,
          attributes: ['id', 'make', 'model', 'year', 'vin']
        },
        {
          model: OrderItem,
          as: 'items',
          include: [
            {
              model: SparePart,
              as: 'sparePart',
              attributes: ['id', 'name', 'partNumber']
            }
          ]
        }
      ],
      limit: limitNumber,
      offset,
      order: [['createdAt', 'DESC']],
      distinct: true,
      paranoid: true
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limitNumber);
    
    res.status(200).json({
      status: 'success',
      data: {
        orders,
        pagination: {
          total: count,
          page: pageNumber,
          limit: limitNumber,
          totalPages
        }
      }
    });
  } catch (error) {
    logger.error(`Error getting orders for user ${req.params.userId}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve user orders' 
    });
  }
};

module.exports = {
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  cancelOrder,
  getOrderStats,
  getUserOrders
}; 