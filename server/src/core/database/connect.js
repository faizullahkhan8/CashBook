import mongoose from 'mongoose';
import { env } from '../../config/env.js';

let connectionPromise = null;

export async function connectDatabase() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;
  mongoose.set('strictQuery', true);
  connectionPromise = mongoose.connect(env.mongoUri)
    .then(() => {
      console.log('[server] MongoDB connected');
      return mongoose.connection;
    })
    .catch((error) => {
      connectionPromise = null;
      throw error;
    });
  return connectionPromise;
}
