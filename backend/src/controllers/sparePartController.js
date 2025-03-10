const { Op } = require('sequelize');
const { SparePart } = require('../models');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Get all spare parts with filtering, pagination, and sorting
 * @route GET /api/spare-parts
 */
const getSpareParts = async (req, res) => {
  try {
    const {
      // Filtering
      name,
      partNumber,
      category,
      manufacturer,
      minPrice,
      maxPrice,
      inStock,
      isOriginal,
      
      // Pagination
      page = 1,
      limit = 10,
      
      // Sorting
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.query;
    
    // Build filter conditions
    const whereConditions = {};
    
    if (name) whereConditions.name = { [Op.like]: `%${name}%` };
    if (partNumber) whereConditions.partNumber = { [Op.like]: `%${partNumber}%` };
    if (category) whereConditions.category = { [Op.like]: `%${category}%` };
    if (manufacturer) whereConditions.manufacturer = { [Op.like]: `%${manufacturer}%` };
    if (minPrice) whereConditions.price = { ...whereConditions.price, [Op.gte]: minPrice };
    if (maxPrice) whereConditions.price = { ...whereConditions.price, [Op.lte]: maxPrice };
    if (inStock === 'true') whereConditions.stock = { [Op.gt]: 0 };
    if (inStock === 'false') whereConditions.stock = 0;
    if (isOriginal !== undefined) whereConditions.isOriginal = isOriginal === 'true';
    
    // Calculate pagination values
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;
    
    // Validate sort parameters
    const validSortFields = [
      'id', 'name', 'partNumber', 'price', 'stock', 'category', 
      'manufacturer', 'createdAt', 'updatedAt'
    ];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Execute query
    const { count, rows: spareParts } = await SparePart.findAndCountAll({
      where: whereConditions,
      limit: limitNumber,
      offset,
      order: [[sortField, order]],
      paranoid: true // Exclude soft-deleted spare parts
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limitNumber);
    
    res.status(200).json({
      status: 'success',
      data: {
        spareParts,
        pagination: {
          total: count,
          page: pageNumber,
          limit: limitNumber,
          totalPages
        }
      }
    });
  } catch (error) {
    logger.error('Error getting spare parts:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve spare parts' 
    });
  }
};

/**
 * Get spare part by ID
 * @route GET /api/spare-parts/:id
 */
const getSparePartById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sparePart = await SparePart.findByPk(id);
    
    if (!sparePart) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Spare part not found' 
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { sparePart }
    });
  } catch (error) {
    logger.error(`Error getting spare part with id ${req.params.id}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve spare part' 
    });
  }
};

/**
 * Create a new spare part
 * @route POST /api/spare-parts
 */
const createSparePart = async (req, res) => {
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
      name,
      partNumber,
      description,
      price,
      stock,
      category,
      compatibility,
      manufacturer,
      weight,
      dimensions,
      images,
      isOriginal,
      minStockLevel,
      location,
      warrantyPeriod
    } = req.body;
    
    // Check if part number already exists
    const existingSparePart = await SparePart.findOne({ where: { partNumber } });
    if (existingSparePart) {
      return res.status(409).json({ 
        status: 'error', 
        message: 'A spare part with this part number already exists' 
      });
    }
    
    // Create the spare part
    const sparePart = await SparePart.create({
      name,
      partNumber,
      description,
      price,
      stock: stock || 0,
      category,
      compatibility,
      manufacturer,
      weight,
      dimensions,
      images,
      isOriginal: isOriginal !== undefined ? isOriginal : true,
      minStockLevel: minStockLevel || 5,
      location,
      warrantyPeriod
    });
    
    logger.info(`New spare part created: ${sparePart.id} - ${sparePart.name}`);
    
    res.status(201).json({
      status: 'success',
      data: { sparePart }
    });
  } catch (error) {
    logger.error('Error creating spare part:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to create spare part' 
    });
  }
};

/**
 * Update an existing spare part
 * @route PUT /api/spare-parts/:id
 */
const updateSparePart = async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        status: 'error', 
        errors: errors.array() 
      });
    }
    
    const { id } = req.params;
    
    // Find the spare part to update
    const sparePart = await SparePart.findByPk(id);
    
    if (!sparePart) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Spare part not found' 
      });
    }
    
    // Handle part number uniqueness if updating part number
    if (req.body.partNumber && req.body.partNumber !== sparePart.partNumber) {
      const partNumberExists = await SparePart.findOne({ 
        where: { 
          partNumber: req.body.partNumber,
          id: { [Op.ne]: id } // Not the current spare part
        } 
      });
      
      if (partNumberExists) {
        return res.status(409).json({ 
          status: 'error', 
          message: 'A spare part with this part number already exists' 
        });
      }
    }
    
    // Update the spare part
    await sparePart.update(req.body);
    
    // Check if stock is below minimum level
    if (sparePart.stock <= sparePart.minStockLevel) {
      logger.warn(`Low stock alert: ${sparePart.name} (ID: ${sparePart.id}) - Stock: ${sparePart.stock}, Min: ${sparePart.minStockLevel}`);
      // Here you would trigger notification or other low stock handling
    }
    
    logger.info(`Spare part updated: ${sparePart.id} - ${sparePart.name}`);
    
    res.status(200).json({
      status: 'success',
      data: { sparePart }
    });
  } catch (error) {
    logger.error(`Error updating spare part with id ${req.params.id}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update spare part' 
    });
  }
};

/**
 * Delete a spare part (soft delete)
 * @route DELETE /api/spare-parts/:id
 */
const deleteSparePart = async (req, res) => {
  try {
    const { id } = req.params;
    
    const sparePart = await SparePart.findByPk(id);
    
    if (!sparePart) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Spare part not found' 
      });
    }
    
    // Soft delete the spare part
    await sparePart.destroy();
    
    logger.info(`Spare part deleted: ${sparePart.id} - ${sparePart.name}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Spare part deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting spare part with id ${req.params.id}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to delete spare part' 
    });
  }
};

/**
 * Adjust inventory stock
 * @route POST /api/spare-parts/:id/adjust-stock
 */
const adjustStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, operation, reason } = req.body;
    
    // Validate input
    if (!['add', 'subtract'].includes(operation)) {
      return res.status(400).json({
        status: 'error',
        message: 'Operation must be either "add" or "subtract"'
      });
    }
    
    if (!quantity || typeof quantity !== 'number' || quantity <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Quantity must be a positive number'
      });
    }
    
    // Find the spare part
    const sparePart = await SparePart.findByPk(id);
    
    if (!sparePart) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Spare part not found' 
      });
    }
    
    // Calculate new stock level
    let newStock;
    if (operation === 'add') {
      newStock = sparePart.stock + quantity;
    } else {
      // Check if there's enough stock to subtract
      if (sparePart.stock < quantity) {
        return res.status(400).json({
          status: 'error',
          message: `Not enough stock. Current stock: ${sparePart.stock}`
        });
      }
      newStock = sparePart.stock - quantity;
    }
    
    // Update stock
    await sparePart.update({ 
      stock: newStock
    });
    
    // Log stock adjustment
    logger.info(`Stock adjusted for ${sparePart.name} (ID: ${sparePart.id}): ${operation} ${quantity}. New stock: ${newStock}. Reason: ${reason || 'Not specified'}`);
    
    // Check if stock is below minimum level
    if (newStock <= sparePart.minStockLevel) {
      logger.warn(`Low stock alert: ${sparePart.name} (ID: ${sparePart.id}) - Stock: ${newStock}, Min: ${sparePart.minStockLevel}`);
      // Here you would trigger notification or other low stock handling
    }
    
    res.status(200).json({
      status: 'success',
      data: {
        sparePart,
        adjustmentDetails: {
          previousStock: operation === 'add' ? newStock - quantity : newStock + quantity,
          adjustment: operation === 'add' ? `+${quantity}` : `-${quantity}`,
          currentStock: newStock,
          reason: reason || 'Not specified'
        }
      }
    });
  } catch (error) {
    logger.error(`Error adjusting stock for spare part with id ${req.params.id}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to adjust stock' 
    });
  }
};

/**
 * Get low stock spare parts
 * @route GET /api/spare-parts/low-stock
 */
const getLowStockParts = async (req, res) => {
  try {
    const lowStockParts = await SparePart.findAll({
      where: {
        stock: {
          [Op.lte]: Sequelize.col('minStockLevel')
        }
      },
      order: [
        [Sequelize.literal('stock - minStockLevel'), 'ASC']
      ]
    });
    
    res.status(200).json({
      status: 'success',
      data: { 
        spareParts: lowStockParts,
        count: lowStockParts.length
      }
    });
  } catch (error) {
    logger.error('Error getting low stock spare parts:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve low stock spare parts' 
    });
  }
};

module.exports = {
  getSpareParts,
  getSparePartById,
  createSparePart,
  updateSparePart,
  deleteSparePart,
  adjustStock,
  getLowStockParts
}; 