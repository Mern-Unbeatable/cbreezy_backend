import adminRevenueService from '../services/admin-revenue.service.js';

const sendResponse = (res, result) => res.status(result.statusCode).json({
  success: true,
  message: result.message,
  ...(result.data !== undefined ? { data: result.data } : {}),
  ...(result.meta !== undefined ? { meta: result.meta } : {})
});

class AdminRevenueController {
  async getRevenueToday(req, res, next) {
    try {
      const result = await adminRevenueService.getRevenueToday();
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getRevenueThisMonth(req, res, next) {
    try {
      const result = await adminRevenueService.getRevenueThisMonth();
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getTotalRevenue(req, res, next) {
    try {
      const result = await adminRevenueService.getTotalRevenue();
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getSalesPerformance(req, res, next) {
    try {
      const { year } = req.query;
      const result = await adminRevenueService.getSalesPerformance({
        year: year ? parseInt(year) : new Date().getFullYear()
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getRevenueStats(req, res, next) {
    try {
      const result = await adminRevenueService.getRevenueStats();
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminRevenueController();
