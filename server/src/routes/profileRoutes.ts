import { Router } from 'express';
import {
  getProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  toggleMyList,
  getMyList,
  updateWatchProgress,
  createProfileSchema,
  updateProfileSchema,
  myListSchema,
  watchHistorySchema,
} from '../controllers/profileController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

// Protect all profile endpoints
router.use(protect);

router.route('/').get(getProfiles).post(validate(createProfileSchema), createProfile);

router
  .route('/:profileId')
  .put(validate(updateProfileSchema), updateProfile)
  .delete(deleteProfile);

router
  .route('/:profileId/mylist')
  .get(getMyList)
  .post(validate(myListSchema), toggleMyList);

router
  .route('/:profileId/history')
  .post(validate(watchHistorySchema), updateWatchProgress);

export default router;
