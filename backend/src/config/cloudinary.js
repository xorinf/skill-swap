import { v2 as cloudinary } from 'cloudinary';
import { config, cloudinaryConfigured } from '../config/index.js';

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true
  });
  // eslint-disable-next-line no-console
  console.log('[cloudinary] configured');
} else {
  // eslint-disable-next-line no-console
  console.log('[cloudinary] not configured - uploads will be disabled');
}

export { cloudinary, cloudinaryConfigured };
