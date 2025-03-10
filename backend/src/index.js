require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');
const logger = require('./utils/logger');

// Import routes
const authRoutes = require('./routes/authRoutes');
const carRoutes = require('./routes/carRoutes');
const sparePartRoutes = require('./routes/sparePartRoutes');
const userRoutes = require('./routes/userRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const serviceRoutes = require('./routes/serviceRoutes');
const orderRoutes = require('./routes/orderRoutes');

// Create Express app
const app = express();

// Set up rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply middleware
app.use(helmet()); // Security headers
app.use(cors()); // CORS support
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('dev')); // Request logging
app.use(limiter); // Rate limiting

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cars', carRoutes);
app.use('/api/spare-parts', sparePartRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/services', serviceRoutes);
app.use('/api/orders', orderRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(err.stack);
  
  res.status(err.statusCode || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Resource not found',
  });
});

// Start server
const PORT = process.env.PORT || 3001;

const start = async () => {
  try {
    // Sync database models (in development)
    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      logger.info('Database synced successfully');
    }

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
    });
  } catch (error) {
    logger.error('Unable to start server:', error);
    process.exit(1);
  }
};

start();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION:', err);
  // Gracefully shutdown the server
  process.exit(1);
});

module.exports = app; // Export for testing 