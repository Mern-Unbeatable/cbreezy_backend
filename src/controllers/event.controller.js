import eventService from '../services/event.services.js';

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

class EventController {
  async createEvent(req, res, next) {
    try {
      const result = await eventService.createEvent({
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

  async getPublicEvents(req, res, next) {
    try {
      const result = await eventService.getPublicEvents({
        query: req.query,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getEventById(req, res, next) {
    try {
      const result = await eventService.getEventById({
        id: req.params.id,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getMyEvents(req, res, next) {
    try {
      const result = await eventService.getMyEvents({
        userId: req.user.userId,
        query: req.query,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateEvent(req, res, next) {
    try {
      const result = await eventService.updateEvent({
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

  async deleteMyEvent(req, res, next) {
    try {
      const result = await eventService.deleteMyEvent({
        id: req.params.id,
        userId: req.user.userId
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getAdminEvents(req, res, next) {
    try {
      const result = await eventService.getAdminEvents({
        query: req.query,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateEventStatus(req, res, next) {
    try {
      const result = await eventService.updateEventStatus({
        id: req.params.id,
        status: req.body.status,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createEventPaymentIntent(req, res, next) {
    try {
      const result = await eventService.createEventPaymentIntent({
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

  async createEventRenewalCheckoutSession(req, res, next) {
    try {
      const result = await eventService.createEventRenewalCheckoutSession({
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

  async confirmEventListingPurchase(req, res, next) {
    try {
      const result = await eventService.confirmEventListingPurchase({
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

  async confirmEventRenewal(req, res, next) {
    try {
      const result = await eventService.confirmEventRenewal({
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

  async reportEventSpam(req, res, next) {
    try {
      const result = await eventService.reportEventSpam({
        id: req.params.id,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteEvent(req, res, next) {
    try {
      const result = await eventService.deleteEvent({
        id: req.params.id
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new EventController();