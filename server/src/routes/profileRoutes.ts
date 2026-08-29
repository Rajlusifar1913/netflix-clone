import { Router } from 'express';
import {
  getProfiles,
  createProfile,
  updateProfile,
  deleteProfile,
  toggleMyList,
  getMyList,
  updateWatchProgress,
  getWatchHistory,
  verifyProfilePin,
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

// WF-4: GET watch history for a profile
router
  .route('/:profileId/history')
  .get(getWatchHistory)
  .post(validate(watchHistorySchema), updateWatchProgress);

// MF-7: PIN verification endpoint for locked profiles
router.post('/:profileId/verify-pin', verifyProfilePin);

export default router;
