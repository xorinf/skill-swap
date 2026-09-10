import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authRequired } from '../../middleware/auth.js';
import { ok, created, badRequest, notFound, forbidden } from '../../utils/response.js';
import { validate } from '../../middleware/validate.js';
import { cloudinary, cloudinaryConfigured } from '../../config/cloudinary.js';
import { config } from '../../config/index.js';

const router = Router();
router.use(authRequired);

// 10MB ceiling on raw uploads. Cloudinary enforces its own limits.
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const ALLOWED = {
  image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  raw: ['application/pdf', 'application/json', 'text/plain']
};

function detectResourceKind(mime) {
  if (!mime) return 'auto';
  if (ALLOWED.image.includes(mime)) return 'image';
  if (mime === 'application/pdf') return 'raw';
  if (mime.startsWith('text/') || mime === 'application/json') return 'raw';
  return null;
}

router.post('/signature', (req, res) => {
  if (!cloudinaryConfigured) badRequest('Cloudinary not configured');
  const { folder = config.cloudinary.folder, resourceType = 'auto' } = req.body || {};
  const timestamp = Math.round(Date.now() / 1000);
  const paramsToSign = { folder, timestamp };
  const sig = cloudinary.utils.api_sign_request(paramsToSign, config.cloudinary.apiSecret);
  return ok(res, {
    cloudName: config.cloudinary.cloudName,
    apiKey: config.cloudinary.apiKey,
    timestamp,
    folder,
    resourceType,
    signature: sig
  });
});

// Direct backend upload (memory) — used when frontend cannot do signed uploads (e.g. demo).
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!cloudinaryConfigured) badRequest('Cloudinary not configured');
  if (!req.file) badRequest('file is required (multipart field "file")');
  const kind = detectResourceKind(req.file.mimetype);
  if (!kind) badRequest('Unsupported file type');

  const b64 = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(b64, {
    folder: config.cloudinary.folder,
    resource_type: kind
  });
  return created(res, {
    url: result.secure_url,
    publicId: result.public_id,
    type: kind,
    name: req.file.originalname,
    size: req.file.size,
    mime: req.file.mimetype
  });
});

export default router;
