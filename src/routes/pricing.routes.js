import express from 'express';
import pricingController from '../controllers/pricing.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', pricingController.getActivePricingPlans.bind(pricingController));
router.get('/stripe-config', pricingController.getStripeConfig.bind(pricingController));
router.get('/eligibility', authenticate, pricingController.getPricingEligibility.bind(pricingController));
router.post('/', authenticate, authorize('ADMIN'), pricingController.createPricingPlan.bind(pricingController));
router.put('/:id', authenticate, authorize('ADMIN'), pricingController.updatePricingPlan.bind(pricingController));
router.delete('/:id', authenticate, authorize('ADMIN'), pricingController.deletePricingPlan.bind(pricingController));

export default router;