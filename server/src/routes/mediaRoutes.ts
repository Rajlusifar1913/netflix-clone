import { Router } from 'express';
import {
  getBrowseData,
  searchMedia,
  getMediaDetails,
  streamMedia,
} from '../controllers/mediaController.js';

const router = Router();

router.get('/browse', getBrowseData);
router.get('/search', searchMedia);
router.get('/details/:type/:id', getMediaDetails);
router.get('/stream/:id', streamMedia);

export default router;
