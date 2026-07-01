import express from 'express';
import adminListingController from '../controllers/admin-listing.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { LISTING_MODERATOR_ROLES, ROLES } from '../constants/roles.js';

const router = express.Router();

router.get('/', authenticate, authorize(...LISTING_MODERATOR_ROLES), adminListingController.getAllListings.bind(adminListingController));
router.get('/:id', authenticate, authorize(...LISTING_MODERATOR_ROLES), adminListingController.getListingById.bind(adminListingController));
router.patch('/:id/status', authenticate, authorize(...LISTING_MODERATOR_ROLES), adminListingController.updateListingStatus.bind(adminListingController));
router.delete('/:id', authenticate, authorize(ROLES.ADMIN), adminListingController.deleteListing.bind(adminListingController));

export default router;
