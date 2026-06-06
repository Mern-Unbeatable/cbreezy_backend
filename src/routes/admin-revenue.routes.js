import express from 'express';
import adminRevenueController from '../controllers/admin-revenue.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All revenue routes require ADMIN role
router.use(authenticate, authorize('ADMIN'));

/**
 * @route GET /api/admin/revenue/today
 * @desc Get revenue for today with comparison to yesterday
 * @access Admin
 */
router.get('/today', adminRevenueController.getRevenueToday);

/**
 * @route GET /api/admin/revenue/this-month
 * @desc Get revenue for current month with comparison to last month
 * @access Admin
 */
router.get('/this-month', adminRevenueController.getRevenueThisMonth);

/**
 * @route GET /api/admin/revenue/total
 * @desc Get total revenue since launch
 * @access Admin
 */
router.get('/total', adminRevenueController.getTotalRevenue);

/**
 * @route GET /api/admin/revenue/sales-performance?year=2026
 * @desc Get monthly sales performance breakdown
 * @desc Query params: year (optional, defaults to current year)
 * @access Admin
 */
router.get('/sales-performance', adminRevenueController.getSalesPerformance);

/**
 * @route GET /api/admin/revenue/stats
 * @desc Get revenue statistics (total, transactions, average, failed, pending)
 * @access Admin
 */
router.get('/stats', adminRevenueController.getRevenueStats);

export default router;
