const mongoose = require('mongoose');
const config = require('../config/config');

class DatabaseConnection {
  constructor() {
    this.connection = null;
    this.isConnecting = false;
  }

  async connect() {
    if (this.connection) {
      return this.connection;
    }

    if (this.isConnecting) {
      throw new Error('Connection already in progress');
    }

    this.isConnecting = true;

    try {
      // Configure mongoose
      mongoose.set('strictQuery', true);
      
      // Set up connection options
      const options = {
        ...config.mongodb.options,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 2000
      };

      // Connect to MongoDB
      this.connection = await mongoose.connect(config.mongodb.uri, options);

      // Set up connection event handlers
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Attempting to reconnect...');
        this.reconnect();
      });

      mongoose.connection.on('reconnected', () => {
        console.info('MongoDB reconnected successfully');
      });

      console.info('MongoDB connected successfully');
      return this.connection;
    } catch (error) {
      console.error('Failed to connect to MongoDB:', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      this.connection = null;
      console.info('MongoDB disconnected');
    }
  }

  async reconnect() {
    try {
      await this.disconnect();
      await this.connect();
    } catch (error) {
      console.error('Failed to reconnect to MongoDB:', error);
      // Implement exponential backoff for reconnection attempts
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  // Health check method
  async healthCheck() {
    try {
      if (!this.connection) {
        return { status: 'disconnected' };
      }
      
      await mongoose.connection.db.admin().ping();
      return { status: 'connected' };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }
}

// Create a singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection; 