import { Router } from 'express';
import {
  getSubscription,
  changePlan,
  updatePaymentMethod,
  updateCredentials,
  createCheckoutSession,
  changePlanSchema,
  updateCredentialsSchema,
  updatePaymentMethodSchema,
} from '../controllers/paymentController.js';
import { protect } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';

const router = Router();

router.use(protect);

router.get('/subscription', getSubscription);
router.post('/change-plan', validate(changePlanSchema), changePlan);
router.post('/update-payment', validate(updatePaymentMethodSchema), updatePaymentMethod);
router.post('/update-credentials', validate(updateCredentialsSchema), updateCredentials);
router.post('/checkout-session', validate(changePlanSchema), createCheckoutSession);

export default router;
