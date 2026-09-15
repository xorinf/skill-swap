import 'dotenv/config';

const required = (key, fallback) => {
  const v = process.env[key] ?? fallback;
  if (v === undefined) throw new Error(`Missing env: ${key}`);
  return v;
};

export const config = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  allowedOrigins: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',').map(s => s.trim()).filter(Boolean),
  mongoUri: required('MONGO_URI', 'mongodb://127.0.0.1:27017/skillswap'),
  jwtSecret: required('JWT_SECRET', 'dev-secret-change-me'),
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  allowedEmailDomain: (process.env.ALLOWED_EMAIL_DOMAIN || 'anurag.edu.in').toLowerCase(),
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    folder: process.env.CLOUDINARY_FOLDER || 'skillswap'
  },
  ai: {
    provider: (process.env.AI_PROVIDER || 'none').toLowerCase(),
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || ''
  }
};

export const cloudinaryConfigured = Boolean(
  config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret
);

export const aiConfigured = config.ai.provider !== 'none' && Boolean(config.ai.apiKey);
