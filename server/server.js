const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/config');
const dbConnection = require('./db/connection');
const { loginLimiter, apiLimiter } = require('./middleware/rateLimiter');
const { sanitizers, validate } = require('./middleware/sanitizer');
const { authenticate } = require('./middleware/auth');

// Import routes
const authRoutes = require('./routes/auth');
const timetableRoutes = require('./routes/timetable');
const attendanceRoutes = require('./routes/attendance');
const messageRoutes = require('./routes/messages');

// Initialize express app
const app = express();

// Apply security middleware
app.use(helmet());
app.use(cors(config.cors));
app.use(express.json());
app.use(morgan(config.logging.format));

// Apply rate limiters
app.use('/api/auth/login', loginLimiter);
app.use('/api', apiLimiter);

// Apply input sanitization to routes
app.use('/api/auth/login', sanitizers.login, validate);
app.use('/api/timetable', sanitizers.timetable, validate);
app.use('/api/attendance', sanitizers.attendance, validate);
app.use('/api/messages', sanitizers.messages, validate);

// Apply authentication middleware to protected routes
app.use('/api/timetable', authenticate);
app.use('/api/attendance', authenticate);
app.use('/api/messages', authenticate);

// Register routes
app.use('/api/auth', authRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/messages', messageRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  const dbStatus = await dbConnection.healthCheck();
  
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      database: dbStatus
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal server error',
      ...(config.nodeEnv === 'development' && { stack: err.stack })
    }
  });
});

// Start server
async function startServer() {
  try {
    // Connect to database
    await dbConnection.connect();
    
    // Start server
    app.listen(config.port, () => {
      console.info(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.info('SIGTERM received. Shutting down gracefully...');
  await dbConnection.disconnect();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.info('SIGINT received. Shutting down gracefully...');
  await dbConnection.disconnect();
  process.exit(0);
});

startServer(); 