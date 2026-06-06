import express from 'express';
import adminCategoryController from '../controllers/admin-category.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { categoryImageUpload } from '../middlewares/upload.middleware.js';

const router = express.Router();

// Bulk update service category and subcategory
router.patch(
  '/service',
  authenticate,
  authorize('ADMIN'),
  adminCategoryController.updateServiceCategoryAndSubcategory.bind(adminCategoryController)
);

// Update / delete single service category
router.put(
  '/service/:categoryId',
  authenticate,
  authorize('ADMIN'),
  categoryImageUpload,
  adminCategoryController.updateServiceCategoryOnly.bind(adminCategoryController)
);

router.delete(
  '/service/:categoryId',
  authenticate,
  authorize('ADMIN'),
  adminCategoryController.deleteServiceCategoryOnly.bind(adminCategoryController)
);

// Update / delete service subcategory
router.put(
  '/service/:categoryId/subcategories/:subcategoryId',
  authenticate,
  authorize('ADMIN'),
  adminCategoryController.updateServiceSubcategoryOnly.bind(adminCategoryController)
);

router.delete(
  '/service/:categoryId/subcategories/:subcategoryId',
  authenticate,
  authorize('ADMIN'),
  adminCategoryController.deleteServiceSubcategoryOnly.bind(adminCategoryController)
);

// Bulk update event category
router.patch(
  '/event',
  authenticate,
  authorize('ADMIN'),
  adminCategoryController.updateEventCategory.bind(adminCategoryController)
);

// Update / delete single event category
router.put(
  '/event/:categoryId',
  authenticate,
  authorize('ADMIN'),
  categoryImageUpload,
  adminCategoryController.updateEventCategoryOnly.bind(adminCategoryController)
);

router.delete(
  '/event/:categoryId',
  authenticate,
  authorize('ADMIN'),
  adminCategoryController.deleteEventCategoryOnly.bind(adminCategoryController)
);

export default router;
