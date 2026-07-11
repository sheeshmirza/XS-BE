const mongoose = require('mongoose');
const env = require('./env');
const logger = require('../utils/logger');

const connectDatabase = async () => {
  if (!env.mongodbUri) {
    throw new Error('MONGODB_URI is missing in environment variables');
  }

  mongoose.set('strictQuery', true);

  await mongoose.connect(env.mongodbUri);
  logger.info('MongoDB connected');
};

module.exports = { connectDatabase };
