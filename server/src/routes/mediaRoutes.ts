import { Router } from 'express';
import {
  getBrowseData,
  searchMedia,
  getMediaDetails,
  streamMedia,
  getStreamToken,
} from '../controllers/mediaController.js';
import { protect } from '../middlewares/auth.js';

const router = Router();

// Public catalog browsing — accessible without auth for home/landing pages
router.get('/browse', getBrowseData);
router.get('/search', searchMedia);
router.get('/details/:type/:id', getMediaDetails);

// DRM Signed Playback Token & Secure Streaming
router.get('/stream-token/:id', protect, getStreamToken);
router.get('/stream/:id', protect, streamMedia);

export default router;
