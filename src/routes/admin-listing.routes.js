import express from 'express';
import adminListingController from '../controllers/admin-listing.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, authorize('ADMIN'), adminListingController.getAllListings.bind(adminListingController));
router.get('/:id', authenticate, authorize('ADMIN'), adminListingController.getListingById.bind(adminListingController));
router.patch('/:id/status', authenticate, authorize('ADMIN'), adminListingController.updateListingStatus.bind(adminListingController));
router.delete('/:id', authenticate, authorize('ADMIN'), adminListingController.deleteListing.bind(adminListingController));

export default router;
