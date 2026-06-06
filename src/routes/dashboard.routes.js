import express from 'express';
import dashboardController from '../controllers/dashboard.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/overview', authenticate, authorize('ADMIN'), dashboardController.getAdminOverview.bind(dashboardController));

export default router;