import express from 'express';
import categoryController from '../controllers/category.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import { categoryImageUpload } from '../middlewares/upload.middleware.js';

const router = express.Router();

/**
 * Category Routes
 * Base path: /api/categories
 */

// Global category search across all categories
router.get('/search', categoryController.searchCategories.bind(categoryController));

// Dedicated service category endpoints
router.get('/service', categoryController.getServiceCategoriesWithSubcategories.bind(categoryController));
router.get('/service/:id', categoryController.getServiceCategoryById.bind(categoryController));
router.post('/service/:id/subcategories', authenticate, authorize('ADMIN'), categoryController.createSubCategory.bind(categoryController));
router.post('/service', authenticate, authorize('ADMIN'), categoryImageUpload, categoryController.createServiceCategory.bind(categoryController));

// Dedicated event category endpoints
router.get('/event', categoryController.getEventCategoriesSummary.bind(categoryController));
router.get('/event/:id', categoryController.getEventCategoryById.bind(categoryController));
router.post('/event', authenticate, authorize('ADMIN'), categoryImageUpload, categoryController.createEventCategory.bind(categoryController));

export default router;
