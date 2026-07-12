import mongoose from 'mongoose';
import env from './env';
import logger from '../utils/logger';
const connectDatabase = async () => { if (!env.mongodbUri) { throw new Error('MONGODB_URI is missing in environment variables'); }
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongodbUri);
  logger.info('MongoDB connected'); };
export { connectDatabase };
