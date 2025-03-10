const { Op } = require('sequelize');
const { Car } = require('../models');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Get all cars with filtering, pagination, and sorting
 * @route GET /api/cars
 */
const getCars = async (req, res) => {
  try {
    const {
      // Filtering
      make,
      model,
      type, // 'NEW' or 'USED'
      minPrice,
      maxPrice,
      minYear,
      maxYear,
      color,
      transmission,
      fuelType,
      status,
      features,
      
      // Pagination
      page = 1,
      limit = 10,
      
      // Sorting
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      
      // Feature flag
      isFeatured
    } = req.query;
    
    // Build filter conditions
    const whereConditions = {};
    
    if (make) whereConditions.make = { [Op.like]: `%${make}%` };
    if (model) whereConditions.model = { [Op.like]: `%${model}%` };
    if (type) whereConditions.type = type;
    if (minPrice) whereConditions.price = { ...whereConditions.price, [Op.gte]: minPrice };
    if (maxPrice) whereConditions.price = { ...whereConditions.price, [Op.lte]: maxPrice };
    if (minYear) whereConditions.year = { ...whereConditions.year, [Op.gte]: minYear };
    if (maxYear) whereConditions.year = { ...whereConditions.year, [Op.lte]: maxYear };
    if (color) whereConditions.color = { [Op.like]: `%${color}%` };
    if (transmission) whereConditions.transmission = transmission;
    if (fuelType) whereConditions.fuelType = fuelType;
    if (status) whereConditions.status = status;
    if (isFeatured !== undefined) whereConditions.isFeatured = isFeatured === 'true';
    
    // Handle JSON array field (features)
    if (features) {
      const featureArray = features.split(',');
      whereConditions.features = { 
        [Op.overlap]: featureArray 
      };
    }
    
    // Calculate pagination values
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;
    
    // Validate sort parameters
    const validSortFields = [
      'id', 'make', 'model', 'year', 'price', 'mileage', 
      'createdAt', 'updatedAt'
    ];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Execute query
    const { count, rows: cars } = await Car.findAndCountAll({
      where: whereConditions,
      limit: limitNumber,
      offset,
      order: [[sortField, order]],
      paranoid: true // Exclude soft-deleted cars
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limitNumber);
    
    res.status(200).json({
      status: 'success',
      data: {
        cars,
        pagination: {
          total: count,
          page: pageNumber,
          limit: limitNumber,
          totalPages
        }
      }
    });
  } catch (error) {
    logger.error('Error getting cars:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve cars' 
    });
  }
};

/**
 * Get car by ID
 * @route GET /api/cars/:id
 */
const getCarById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const car = await Car.findByPk(id);
    
    if (!car) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Car not found' 
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { car }
    });
  } catch (error) {
    logger.error(`Error getting car with id ${req.params.id}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve car' 
    });
  }
};

/**
 * Create a new car
 * @route POST /api/cars
 */
const createCar = async (req, res) => {
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
      vin,
      make,
      model,
      year,
      type,
      price,
      mileage,
      color,
      transmission,
      fuelType,
      engineSize,
      description,
      features,
      images,
      status,
      isFeatured,
      exteriorCondition,
      interiorCondition,
      previousOwners,
      serviceHistory
    } = req.body;
    
    // Check if VIN already exists
    const existingCar = await Car.findOne({ where: { vin } });
    if (existingCar) {
      return res.status(409).json({ 
        status: 'error', 
        message: 'A car with this VIN already exists' 
      });
    }
    
    // Create the car
    const car = await Car.create({
      vin,
      make,
      model,
      year,
      type,
      price,
      mileage,
      color,
      transmission,
      fuelType,
      engineSize,
      description,
      features,
      images,
      status: status || 'AVAILABLE',
      isFeatured: isFeatured || false,
      exteriorCondition,
      interiorCondition,
      previousOwners: previousOwners || 0,
      serviceHistory: serviceHistory || false
    });
    
    logger.info(`New car created: ${car.id} - ${car.make} ${car.model}`);
    
    res.status(201).json({
      status: 'success',
      data: { car }
    });
  } catch (error) {
    logger.error('Error creating car:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to create car' 
    });
  }
};

/**
 * Update an existing car
 * @route PUT /api/cars/:id
 */
const updateCar = async (req, res) => {
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
    
    // Find the car to update
    const car = await Car.findByPk(id);
    
    if (!car) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Car not found' 
      });
    }
    
    // Handle VIN uniqueness if updating VIN
    if (req.body.vin && req.body.vin !== car.vin) {
      const vinExists = await Car.findOne({ 
        where: { 
          vin: req.body.vin,
          id: { [Op.ne]: id } // Not the current car
        } 
      });
      
      if (vinExists) {
        return res.status(409).json({ 
          status: 'error', 
          message: 'A car with this VIN already exists' 
        });
      }
    }
    
    // Update the car
    await car.update(req.body);
    
    logger.info(`Car updated: ${car.id} - ${car.make} ${car.model}`);
    
    res.status(200).json({
      status: 'success',
      data: { car }
    });
  } catch (error) {
    logger.error(`Error updating car with id ${req.params.id}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update car' 
    });
  }
};

/**
 * Delete a car (soft delete)
 * @route DELETE /api/cars/:id
 */
const deleteCar = async (req, res) => {
  try {
    const { id } = req.params;
    
    const car = await Car.findByPk(id);
    
    if (!car) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Car not found' 
      });
    }
    
    // Soft delete the car
    await car.destroy();
    
    logger.info(`Car deleted: ${car.id} - ${car.make} ${car.model}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Car deleted successfully'
    });
  } catch (error) {
    logger.error(`Error deleting car with id ${req.params.id}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to delete car' 
    });
  }
};

/**
 * Get featured cars
 * @route GET /api/cars/featured
 */
const getFeaturedCars = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    
    const featuredCars = await Car.findAll({
      where: { 
        isFeatured: true,
        status: 'AVAILABLE'
      },
      limit,
      order: [['createdAt', 'DESC']],
      paranoid: true
    });
    
    res.status(200).json({
      status: 'success',
      data: { cars: featuredCars }
    });
  } catch (error) {
    logger.error('Error getting featured cars:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve featured cars' 
    });
  }
};

/**
 * Advanced search for cars
 * @route POST /api/cars/search
 */
const searchCars = async (req, res) => {
  try {
    const {
      query,
      filters,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'DESC'
    } = req.body;
    
    // Build search conditions
    const whereConditions = {};
    
    // Text search across multiple fields
    if (query) {
      whereConditions[Op.or] = [
        { make: { [Op.like]: `%${query}%` } },
        { model: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } },
        { color: { [Op.like]: `%${query}%` } }
      ];
    }
    
    // Apply additional filters
    if (filters) {
      // Process each filter
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          if (key === 'priceRange' && Array.isArray(value) && value.length === 2) {
            whereConditions.price = { 
              [Op.between]: [value[0], value[1]]
            };
          } else if (key === 'yearRange' && Array.isArray(value) && value.length === 2) {
            whereConditions.year = { 
              [Op.between]: [value[0], value[1]]
            };
          } else if (key === 'features' && Array.isArray(value) && value.length > 0) {
            whereConditions.features = { 
              [Op.overlap]: value
            };
          } else if (Array.isArray(value) && value.length > 0) {
            whereConditions[key] = { 
              [Op.in]: value
            };
          } else {
            whereConditions[key] = value;
          }
        }
      });
    }
    
    // Calculate pagination values
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;
    
    // Validate sort parameters
    const validSortFields = [
      'id', 'make', 'model', 'year', 'price', 'mileage', 
      'createdAt', 'updatedAt'
    ];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Execute query
    const { count, rows: cars } = await Car.findAndCountAll({
      where: whereConditions,
      limit: limitNumber,
      offset,
      order: [[sortField, order]],
      paranoid: true
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limitNumber);
    
    res.status(200).json({
      status: 'success',
      data: {
        cars,
        pagination: {
          total: count,
          page: pageNumber,
          limit: limitNumber,
          totalPages
        }
      }
    });
  } catch (error) {
    logger.error('Error searching cars:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to search cars' 
    });
  }
};

/**
 * Get car statistics for dashboard
 * @route GET /api/cars/stats
 */
const getCarStats = async (req, res) => {
  try {
    // Total cars by type
    const typeStats = await Car.findAll({
      attributes: [
        'type',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['type'],
      raw: true
    });
    
    // Total cars by status
    const statusStats = await Car.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });
    
    // Total cars by make (top 5)
    const makeStats = await Car.findAll({
      attributes: [
        'make',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['make'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 5,
      raw: true
    });
    
    // Price range distribution
    // Create price ranges: 0-10000, 10001-20000, etc.
    const priceRanges = [
      [0, 10000],
      [10001, 20000],
      [20001, 30000],
      [30001, 40000],
      [40001, 50000],
      [50001, Infinity]
    ];
    
    const priceStats = await Promise.all(
      priceRanges.map(async ([min, max]) => {
        const count = await Car.count({
          where: {
            price: {
              [Op.gte]: min,
              ...(max !== Infinity ? { [Op.lte]: max } : {})
            }
          }
        });
        
        return {
          range: max === Infinity ? `$${min}+` : `$${min}-$${max}`,
          count
        };
      })
    );
    
    // Year model distribution (last 10 years)
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 10 }, (_, i) => currentYear - i);
    
    const yearStats = await Promise.all(
      years.map(async (year) => {
        const count = await Car.count({
          where: { year }
        });
        
        return { year, count };
      })
    );
    
    res.status(200).json({
      status: 'success',
      data: {
        typeStats,
        statusStats,
        makeStats,
        priceStats,
        yearStats
      }
    });
  } catch (error) {
    logger.error('Error getting car statistics:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve car statistics' 
    });
  }
};

module.exports = {
  getCars,
  getCarById,
  createCar,
  updateCar,
  deleteCar,
  getFeaturedCars,
  searchCars,
  getCarStats
}; 