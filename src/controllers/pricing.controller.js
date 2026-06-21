// import pricingService from '../services/pricing.service.js';

// const sendResponse = (res, result) => res.status(result.statusCode).json({
//   success: true,
//   message: result.message,
//   ...(result.data !== undefined ? { data: result.data } : {}),
//   ...(result.meta !== undefined ? { meta: result.meta } : {})
// });

// class PricingController {
//   async getActivePricingPlans(req, res, next) {
//     try {
//       const result = await pricingService.getActivePricingPlans();
//       return sendResponse(res, result);
//     } catch (error) {
//       next(error);
//     }
//   }

//   async getPricingEligibility(req, res, next) {
//     try {
//       const result = await pricingService.getPricingEligibility(req.user.userId);
//       return sendResponse(res, result);
//     } catch (error) {
//       next(error);
//     }
//   }

//   async getStripeConfig(req, res, next) {
//     try {
//       const result = await pricingService.getStripeConfig();
//       return sendResponse(res, result);
//     } catch (error) {
//       next(error);
//     }
//   }

//   async createPricingPlan(req, res, next) {
//     try {
//       const result = await pricingService.createPricingPlan(req.body);
//       return sendResponse(res, result);
//     } catch (error) {
//       next(error);
//     }
//   }

//   async updatePricingPlan(req, res, next) {
//     try {
//       const result = await pricingService.updatePricingPlan(req.params.id, req.body);
//       return sendResponse(res, result);
//     } catch (error) {
//       next(error);
//     }
//   }

//   async deletePricingPlan(req, res, next) {
//     try {
//       const result = await pricingService.deletePricingPlan(req.params.id);
//       return sendResponse(res, result);
//     } catch (error) {
//       next(error);
//     }
//   }
// }

// export default new PricingController();




import pricingService from '../services/pricing.service.js';

const sendResponse = (res, result) => res.status(result.statusCode).json({
  success: true,
  message: result.message,
  ...(result.data !== undefined ? { data: result.data } : {}),
  ...(result.meta !== undefined ? { meta: result.meta } : {})
});

class PricingController {
  async getSystemSettings(req, res, next) {
    try {
      const result = await pricingService.getSystemSettings();
      return res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  async updateSystemSettings(req, res, next) {
    try {
      const result = await pricingService.updateSystemSettings(req.body);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getActivePricingPlans(req, res, next) {
    try {
      const result = await pricingService.getActivePricingPlans();
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getPricingEligibility(req, res, next) {
    try {
      const result = await pricingService.getPricingEligibility(req.user.userId);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getPayPalConfig(req, res, next) {
    try {
      const result = await pricingService.getPayPalConfig();
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createPricingPlan(req, res, next) {
    try {
      const result = await pricingService.createPricingPlan(req.body);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updatePricingPlan(req, res, next) {
    try {
      const result = await pricingService.updatePricingPlan(req.params.id, req.body);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deletePricingPlan(req, res, next) {
    try {
      const result = await pricingService.deletePricingPlan(req.params.id);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new PricingController();