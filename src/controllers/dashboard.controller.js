import dashboardService from '../services/dashboard.service.js';

const sendResponse = (res, result) => res.status(result.statusCode).json({
  success: true,
  message: result.message,
  ...(result.data !== undefined ? { data: result.data } : {}),
  ...(result.meta !== undefined ? { meta: result.meta } : {})
});

class DashboardController {
  async getAdminOverview(req, res, next) {
    try {
      const result = await dashboardService.getAdminOverview({
        period: req.query.period
      });

      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new DashboardController();