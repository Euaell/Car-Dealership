const { Op, Sequelize } = require('sequelize');
const { 
  Service, ServiceType, Car, User, sequelize 
} = require('../models');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

/**
 * Get all services with filtering, pagination, and sorting
 * @route GET /api/services
 */
const getServices = async (req, res) => {
  try {
    const {
      // Filtering
      userId,
      carId,
      status,
      serviceTypeId,
      startDate,
      endDate,
      
      // Pagination
      page = 1,
      limit = 10,
      
      // Sorting
      sortBy = 'scheduledDate',
      sortOrder = 'DESC'
    } = req.query;
    
    // Build filter conditions
    const whereConditions = {};
    
    if (userId) whereConditions.userId = userId;
    if (carId) whereConditions.carId = carId;
    if (status) whereConditions.status = status;
    if (serviceTypeId) whereConditions.serviceTypeId = serviceTypeId;
    
    // Date range filter
    if (startDate || endDate) {
      whereConditions.scheduledDate = {};
      if (startDate) whereConditions.scheduledDate[Op.gte] = new Date(startDate);
      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        whereConditions.scheduledDate[Op.lte] = endOfDay;
      }
    }
    
    // Calculate pagination values
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;
    
    // Validate sort parameters
    const validSortFields = [
      'id', 'scheduledDate', 'completedDate', 'status', 'cost', 
      'createdAt', 'updatedAt'
    ];
    
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'scheduledDate';
    const order = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    
    // Execute query
    const { count, rows: services } = await Service.findAndCountAll({
      where: whereConditions,
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
        },
        {
          model: ServiceType,
          as: 'serviceType',
          attributes: ['id', 'name', 'description', 'estimatedDuration', 'basePrice']
        }
      ],
      limit: limitNumber,
      offset,
      order: [[sortField, order]],
      distinct: true,
      paranoid: true
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limitNumber);
    
    res.status(200).json({
      status: 'success',
      data: {
        services,
        pagination: {
          total: count,
          page: pageNumber,
          limit: limitNumber,
          totalPages
        }
      }
    });
  } catch (error) {
    logger.error('Error getting services:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve services' 
    });
  }
};

/**
 * Get service by ID
 * @route GET /api/services/:id
 */
const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const service = await Service.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'address']
        },
        {
          model: Car,
          as: 'car',
          attributes: ['id', 'make', 'model', 'year', 'vin', 'licensePlate', 'color', 'type']
        },
        {
          model: ServiceType,
          as: 'serviceType',
          attributes: ['id', 'name', 'description', 'estimatedDuration', 'basePrice']
        }
      ]
    });
    
    if (!service) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Service not found' 
      });
    }
    
    res.status(200).json({
      status: 'success',
      data: { service }
    });
  } catch (error) {
    logger.error(`Error getting service with id ${req.params.id}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve service' 
    });
  }
};

/**
 * Create a new service appointment
 * @route POST /api/services
 */
const createService = async (req, res) => {
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
      serviceTypeId,
      scheduledDate,
      notes,
      status = 'SCHEDULED',
      estimatedCost
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
    
    // Verify the car exists
    const car = await Car.findByPk(carId, { transaction });
    if (!car) {
      await transaction.rollback();
      return res.status(404).json({ 
        status: 'error', 
        message: 'Car not found' 
      });
    }
    
    // Verify the service type exists
    const serviceType = await ServiceType.findByPk(serviceTypeId, { transaction });
    if (!serviceType) {
      await transaction.rollback();
      return res.status(404).json({ 
        status: 'error', 
        message: 'Service type not found' 
      });
    }
    
    // Check if the scheduled date is in the future
    const scheduledDateTime = new Date(scheduledDate);
    if (scheduledDateTime < new Date()) {
      await transaction.rollback();
      return res.status(400).json({ 
        status: 'error', 
        message: 'Scheduled date must be in the future' 
      });
    }
    
    // Check for scheduling conflicts
    const conflictingService = await Service.findOne({
      where: {
        scheduledDate: {
          [Op.between]: [
            new Date(scheduledDateTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
            new Date(scheduledDateTime.getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
          ]
        },
        status: {
          [Op.in]: ['SCHEDULED', 'IN_PROGRESS']
        }
      },
      transaction
    });
    
    if (conflictingService) {
      await transaction.rollback();
      return res.status(400).json({ 
        status: 'error', 
        message: 'There is already a service scheduled around this time. Please choose a different time.' 
      });
    }
    
    // Create the service appointment
    const service = await Service.create({
      userId,
      carId,
      serviceTypeId,
      scheduledDate: scheduledDateTime,
      notes,
      status,
      estimatedCost: estimatedCost || serviceType.basePrice
    }, { transaction });
    
    // Commit the transaction
    await transaction.commit();
    
    // Fetch the complete service with all relations for response
    const completeService = await Service.findByPk(service.id, {
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
        },
        {
          model: ServiceType,
          as: 'serviceType',
          attributes: ['id', 'name', 'description', 'estimatedDuration', 'basePrice']
        }
      ]
    });
    
    logger.info(`New service appointment created: ${service.id} for car ${car.make} ${car.model} (${car.vin})`);
    
    res.status(201).json({
      status: 'success',
      data: { service: completeService }
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    
    logger.error('Error creating service appointment:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to create service appointment' 
    });
  }
};

/**
 * Update a service appointment
 * @route PUT /api/services/:id
 */
const updateService = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        status: 'error', 
        errors: errors.array() 
      });
    }
    
    // Find the service to update
    const service = await Service.findByPk(id, { transaction });
    
    if (!service) {
      await transaction.rollback();
      return res.status(404).json({ 
        status: 'error', 
        message: 'Service not found' 
      });
    }
    
    const {
      scheduledDate,
      status,
      notes,
      completedDate,
      actualCost,
      technicianNotes,
      serviceTypeId
    } = req.body;
    
    // Prepare update data
    const updateData = {};
    
    // Update scheduled date if provided
    if (scheduledDate) {
      const scheduledDateTime = new Date(scheduledDate);
      
      // Check if the scheduled date is in the future
      if (scheduledDateTime < new Date() && service.status === 'SCHEDULED') {
        await transaction.rollback();
        return res.status(400).json({ 
          status: 'error', 
          message: 'Scheduled date must be in the future for new appointments' 
        });
      }
      
      // Check for scheduling conflicts
      if (service.status === 'SCHEDULED') {
        const conflictingService = await Service.findOne({
          where: {
            id: { [Op.ne]: id }, // Exclude current service
            scheduledDate: {
              [Op.between]: [
                new Date(scheduledDateTime.getTime() - 2 * 60 * 60 * 1000), // 2 hours before
                new Date(scheduledDateTime.getTime() + 2 * 60 * 60 * 1000)  // 2 hours after
              ]
            },
            status: {
              [Op.in]: ['SCHEDULED', 'IN_PROGRESS']
            }
          },
          transaction
        });
        
        if (conflictingService) {
          await transaction.rollback();
          return res.status(400).json({ 
            status: 'error', 
            message: 'There is already a service scheduled around this time. Please choose a different time.' 
          });
        }
      }
      
      updateData.scheduledDate = scheduledDateTime;
    }
    
    // Update service type if provided
    if (serviceTypeId) {
      const serviceType = await ServiceType.findByPk(serviceTypeId, { transaction });
      if (!serviceType) {
        await transaction.rollback();
        return res.status(404).json({ 
          status: 'error', 
          message: 'Service type not found' 
        });
      }
      
      updateData.serviceTypeId = serviceTypeId;
      
      // Update estimated cost based on new service type if not already set
      if (!service.estimatedCost) {
        updateData.estimatedCost = serviceType.basePrice;
      }
    }
    
    // Update status if provided
    if (status) {
      // Validate status transitions
      const validTransitions = {
        'SCHEDULED': ['IN_PROGRESS', 'CANCELLED'],
        'IN_PROGRESS': ['COMPLETED', 'CANCELLED'],
        'COMPLETED': [],
        'CANCELLED': []
      };
      
      if (!validTransitions[service.status].includes(status)) {
        await transaction.rollback();
        return res.status(400).json({ 
          status: 'error', 
          message: `Cannot transition from ${service.status} to ${status}` 
        });
      }
      
      updateData.status = status;
      
      // If status is changing to COMPLETED, set completedDate if not provided
      if (status === 'COMPLETED' && !completedDate) {
        updateData.completedDate = new Date();
      }
    }
    
    // Update completed date if provided
    if (completedDate) {
      updateData.completedDate = new Date(completedDate);
    }
    
    // Update actual cost if provided
    if (actualCost !== undefined) {
      updateData.actualCost = actualCost;
    }
    
    // Update notes if provided
    if (notes) {
      updateData.notes = service.notes 
        ? `${service.notes}\n\n${new Date().toISOString()}: ${notes}`
        : `${new Date().toISOString()}: ${notes}`;
    }
    
    // Update technician notes if provided
    if (technicianNotes) {
      updateData.technicianNotes = service.technicianNotes 
        ? `${service.technicianNotes}\n\n${new Date().toISOString()}: ${technicianNotes}`
        : `${new Date().toISOString()}: ${technicianNotes}`;
    }
    
    // Update the service if there are changes
    if (Object.keys(updateData).length > 0) {
      await service.update(updateData, { transaction });
    }
    
    // Commit the transaction
    await transaction.commit();
    
    // Fetch the updated service with all relations for response
    const updatedService = await Service.findByPk(id, {
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
        },
        {
          model: ServiceType,
          as: 'serviceType',
          attributes: ['id', 'name', 'description', 'estimatedDuration', 'basePrice']
        }
      ]
    });
    
    logger.info(`Service updated: ${service.id} - Status: ${status || 'unchanged'}`);
    
    res.status(200).json({
      status: 'success',
      data: { service: updatedService }
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    
    logger.error(`Error updating service with id ${req.params.id}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update service' 
    });
  }
};

/**
 * Cancel a service appointment
 * @route POST /api/services/:id/cancel
 */
const cancelService = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    // Find the service to cancel
    const service = await Service.findByPk(id, { transaction });
    
    if (!service) {
      await transaction.rollback();
      return res.status(404).json({ 
        status: 'error', 
        message: 'Service not found' 
      });
    }
    
    // Check if the service can be cancelled
    if (service.status === 'COMPLETED' || service.status === 'CANCELLED') {
      await transaction.rollback();
      return res.status(400).json({ 
        status: 'error', 
        message: `Cannot cancel a service that is already ${service.status.toLowerCase()}` 
      });
    }
    
    // Update service status
    await service.update({
      status: 'CANCELLED',
      notes: service.notes 
        ? `${service.notes}\n\nCANCELLED on ${new Date().toISOString()}: ${reason || 'No reason provided'}`
        : `CANCELLED on ${new Date().toISOString()}: ${reason || 'No reason provided'}`
    }, { transaction });
    
    // Commit the transaction
    await transaction.commit();
    
    logger.info(`Service cancelled: ${service.id} - Reason: ${reason || 'No reason provided'}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Service cancelled successfully',
      data: { service }
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    
    logger.error(`Error cancelling service with id ${req.params.id}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to cancel service' 
    });
  }
};

/**
 * Get service types
 * @route GET /api/services/types
 */
const getServiceTypes = async (req, res) => {
  try {
    const serviceTypes = await ServiceType.findAll({
      order: [['name', 'ASC']]
    });
    
    res.status(200).json({
      status: 'success',
      data: { serviceTypes }
    });
  } catch (error) {
    logger.error('Error getting service types:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve service types' 
    });
  }
};

/**
 * Create a new service type
 * @route POST /api/services/types
 */
const createServiceType = async (req, res) => {
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
      description,
      estimatedDuration,
      basePrice
    } = req.body;
    
    // Check if service type with the same name already exists
    const existingServiceType = await ServiceType.findOne({
      where: { name }
    });
    
    if (existingServiceType) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Service type with this name already exists' 
      });
    }
    
    // Create the service type
    const serviceType = await ServiceType.create({
      name,
      description,
      estimatedDuration,
      basePrice
    });
    
    logger.info(`New service type created: ${serviceType.id} - ${serviceType.name}`);
    
    res.status(201).json({
      status: 'success',
      data: { serviceType }
    });
  } catch (error) {
    logger.error('Error creating service type:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to create service type' 
    });
  }
};

/**
 * Update a service type
 * @route PUT /api/services/types/:id
 */
const updateServiceType = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        status: 'error', 
        errors: errors.array() 
      });
    }
    
    // Find the service type to update
    const serviceType = await ServiceType.findByPk(id);
    
    if (!serviceType) {
      return res.status(404).json({ 
        status: 'error', 
        message: 'Service type not found' 
      });
    }
    
    const {
      name,
      description,
      estimatedDuration,
      basePrice
    } = req.body;
    
    // Check if another service type with the same name already exists
    if (name && name !== serviceType.name) {
      const existingServiceType = await ServiceType.findOne({
        where: { 
          name,
          id: { [Op.ne]: id }
        }
      });
      
      if (existingServiceType) {
        return res.status(400).json({ 
          status: 'error', 
          message: 'Another service type with this name already exists' 
        });
      }
    }
    
    // Update the service type
    await serviceType.update({
      name: name || serviceType.name,
      description: description || serviceType.description,
      estimatedDuration: estimatedDuration || serviceType.estimatedDuration,
      basePrice: basePrice || serviceType.basePrice
    });
    
    logger.info(`Service type updated: ${serviceType.id} - ${serviceType.name}`);
    
    res.status(200).json({
      status: 'success',
      data: { serviceType }
    });
  } catch (error) {
    logger.error(`Error updating service type with id ${req.params.id}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to update service type' 
    });
  }
};

/**
 * Delete a service type
 * @route DELETE /api/services/types/:id
 */
const deleteServiceType = async (req, res) => {
  const transaction = await sequelize.transaction();
  
  try {
    const { id } = req.params;
    
    // Find the service type to delete
    const serviceType = await ServiceType.findByPk(id, { transaction });
    
    if (!serviceType) {
      await transaction.rollback();
      return res.status(404).json({ 
        status: 'error', 
        message: 'Service type not found' 
      });
    }
    
    // Check if there are any services using this service type
    const servicesCount = await Service.count({
      where: { serviceTypeId: id },
      transaction
    });
    
    if (servicesCount > 0) {
      await transaction.rollback();
      return res.status(400).json({ 
        status: 'error', 
        message: `Cannot delete service type that is used by ${servicesCount} services` 
      });
    }
    
    // Delete the service type
    await serviceType.destroy({ transaction });
    
    // Commit the transaction
    await transaction.commit();
    
    logger.info(`Service type deleted: ${id} - ${serviceType.name}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Service type deleted successfully'
    });
  } catch (error) {
    // Rollback the transaction in case of error
    await transaction.rollback();
    
    logger.error(`Error deleting service type with id ${req.params.id}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to delete service type' 
    });
  }
};

/**
 * Get user services
 * @route GET /api/users/:userId/services
 */
const getUserServices = async (req, res) => {
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
    
    // Get user services
    const { count, rows: services } = await Service.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Car,
          as: 'car',
          attributes: ['id', 'make', 'model', 'year', 'vin', 'licensePlate']
        },
        {
          model: ServiceType,
          as: 'serviceType',
          attributes: ['id', 'name', 'description', 'estimatedDuration', 'basePrice']
        }
      ],
      limit: limitNumber,
      offset,
      order: [['scheduledDate', 'DESC']],
      distinct: true,
      paranoid: true
    });
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limitNumber);
    
    res.status(200).json({
      status: 'success',
      data: {
        services,
        pagination: {
          total: count,
          page: pageNumber,
          limit: limitNumber,
          totalPages
        }
      }
    });
  } catch (error) {
    logger.error(`Error getting services for user ${req.params.userId}:`, error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to retrieve user services' 
    });
  }
};

module.exports = {
  getServices,
  getServiceById,
  createService,
  updateService,
  cancelService,
  getServiceTypes,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  getUserServices
}; 