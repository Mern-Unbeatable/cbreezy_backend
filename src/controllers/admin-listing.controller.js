import adminListingService from '../services/admin-listing.service.js';

const getBaseUrl = (req) => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, '');
  }

  return `${req.protocol}://${req.get('host')}`;
};

const sendResponse = (res, result) => res.status(result.statusCode).json({
  success: true,
  message: result.message,
  ...(result.data !== undefined ? { data: result.data } : {}),
  ...(result.meta !== undefined ? { meta: result.meta } : {})
});

class AdminListingController {
  async getAllListings(req, res, next) {
    try {
      const result = await adminListingService.getAllListings({
        query: req.query,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getListingById(req, res, next) {
    try {
      const result = await adminListingService.getListingById({
        id: req.params.id,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateListingStatus(req, res, next) {
    try {
      const result = await adminListingService.updateListingStatus({
        id: req.params.id,
        status: req.body.status,
        baseUrl: getBaseUrl(req),
        actorRole: req.user?.role
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteListing(req, res, next) {
    try {
      const result = await adminListingService.deleteListing({
        id: req.params.id
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminListingController();
