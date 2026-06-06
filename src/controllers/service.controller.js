import listingService from '../services/services.service.js';

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

class ListingController {
  async createService(req, res, next) {
    try {
      const result = await listingService.createService({
        body: req.body,
        files: req.files,
        userId: req.user.userId,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getPublicServices(req, res, next) {
    try {
      const result = await listingService.getPublicServices({
        query: req.query,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getServiceById(req, res, next) {
    try {
      const result = await listingService.getServiceById({
        id: req.params.id,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getMyServices(req, res, next) {
    try {
      const result = await listingService.getMyServices({
        userId: req.user.userId,
        query: req.query,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateService(req, res, next) {
    try {
      const result = await listingService.updateService({
        id: req.params.id,
        userId: req.user.userId,
        body: req.body,
        files: req.files,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteMyService(req, res, next) {
    try {
      const result = await listingService.deleteMyService({
        id: req.params.id,
        userId: req.user.userId
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getAdminServices(req, res, next) {
    try {
      const result = await listingService.getAdminServices({
        query: req.query,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateServiceStatus(req, res, next) {
    try {
      const result = await listingService.updateServiceStatus({
        id: req.params.id,
        status: req.body.status,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createServicePaymentIntent(req, res, next) {
    try {
      const result = await listingService.createServicePaymentIntent({
        listingId: req.params.id,
        userId: req.user.userId,
        planId: req.body.planId,
        successUrl: req.body.successUrl,
        cancelUrl: req.body.cancelUrl,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createServiceRenewalCheckoutSession(req, res, next) {
    try {
      const result = await listingService.createServiceRenewalCheckoutSession({
        listingId: req.params.id,
        userId: req.user.userId,
        planId: req.body.planId,
        successUrl: req.body.successUrl,
        cancelUrl: req.body.cancelUrl,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async confirmServiceListingPurchase(req, res, next) {
    try {
      const result = await listingService.confirmServiceListingPurchase({
        listingId: req.params.id,
        userId: req.user.userId,
        planId: req.body.planId,
        checkoutSessionId: req.body.checkoutSessionId,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async confirmServiceRenewal(req, res, next) {
    try {
      const result = await listingService.confirmServiceRenewal({
        listingId: req.params.id,
        userId: req.user.userId,
        planId: req.body.planId,
        checkoutSessionId: req.body.checkoutSessionId,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async reportServiceSpam(req, res, next) {
    try {
      const result = await listingService.reportServiceSpam({
        id: req.params.id,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteService(req, res, next) {
    try {
      const result = await listingService.deleteService({
        id: req.params.id
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new ListingController();