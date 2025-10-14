import mongoose from 'mongoose';
import { config } from '../config';

export async function connectDatabase(): Promise<void> {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(config.mongoUri);
}

export function onDatabaseClose(handler: () => void) {
  mongoose.connection.on('disconnected', handler);
}


