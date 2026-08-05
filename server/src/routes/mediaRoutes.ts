import { Router } from 'express';
import {
  getBrowseData,
  searchMedia,
  getMediaDetails,
} from '../controllers/mediaController.js';

const router = Router();

router.get('/browse', getBrowseData);
router.get('/search', searchMedia);
router.get('/details/:type/:id', getMediaDetails);

export default router;
