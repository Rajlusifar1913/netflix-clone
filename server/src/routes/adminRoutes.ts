import { Router } from 'express';
import {
  adminLogin,
  getAdminAnalytics,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  updateUserSubscription,
  getCatalog,
  createCatalogMedia,
  updateCatalogMedia,
  deleteCatalogMedia,
  getAllPlans,
  createPlan,
  updatePlan,
  deletePlan,
} from '../controllers/adminController.js';
import { protect } from '../middlewares/auth.js';
import { adminOnly } from '../middlewares/adminAuth.js';

const router = Router();

// Public Admin Login
router.post('/login', adminLogin);

// Protected Admin-Only Endpoints
router.use(protect);
router.use(adminOnly);

// Analytics
router.get('/analytics', getAdminAnalytics);

// User Management
router.route('/users').get(getAllUsers).post(createUser);
router.route('/users/:id').put(updateUser).delete(deleteUser);
router.patch('/users/:id/subscription', updateUserSubscription);

// Video Catalog Management
router.route('/catalog').get(getCatalog).post(createCatalogMedia);
router.route('/catalog/:id').put(updateCatalogMedia).delete(deleteCatalogMedia);

// Subscription Plans Management
router.route('/plans').get(getAllPlans).post(createPlan);
router.route('/plans/:id').put(updatePlan).delete(deletePlan);

export default router;
