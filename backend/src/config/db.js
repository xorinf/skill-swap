import mongoose from 'mongoose';
import { config } from './index.js';

let connected = false;

export async function connectDB() {
  if (connected) return mongoose.connection;
  mongoose.set('strictQuery', true);
  // Disable command buffering so requests fail fast (with a real error) when Atlas
  // is electing a new primary, instead of hanging for 10s on the Mongoose buffer.
  mongoose.set('bufferCommands', false);
  // Atlas DNS can be slow; give the cluster 30s to elect a primary before failing.
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 30000 });
  connected = true;
  // eslint-disable-next-line no-console
  console.log(`[mongo] connected → ${config.mongoUri.replace(/:[^:@/]+@/, ':***@')}`);
  return mongoose.connection;
}
