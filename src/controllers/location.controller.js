import locationService from '../services/location.service.js';

const sendResponse = (res, result) => res.status(result.statusCode).json({
  success: true,
  message: result.message,
  ...(result.data !== undefined ? { data: result.data } : {}),
  ...(result.meta !== undefined ? { meta: result.meta } : {})
});

class LocationController {
  async createCountry(req, res, next) {
    try {
      const result = await locationService.createCountry(req.body);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateCountry(req, res, next) {
    try {
      const result = await locationService.updateCountry(req.params.countryId, req.body);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteCountry(req, res, next) {
    try {
      const result = await locationService.deleteCountry(req.params.countryId);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createRegion(req, res, next) {
    try {
      const result = await locationService.createRegion(req.params.countryId, req.body);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateRegion(req, res, next) {
    try {
      const result = await locationService.updateRegion(req.params.countryId, req.params.regionId, req.body);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteRegion(req, res, next) {
    try {
      const result = await locationService.deleteRegion(req.params.countryId, req.params.regionId);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getCountries(req, res, next) {
    try {
      const result = await locationService.getCountries();
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getRegionsByCountryId(req, res, next) {
    try {
      const result = await locationService.getRegionsByCountryId(req.params.countryId);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  // async getCountriesWithRegions(req, res, next) {
  //   try {
  //     const result = await locationService.getCountriesWithRegions();
  //     return sendResponse(res, result);
  //   } catch (error) {
  //     next(error);
  //   }
  // }


  async getCountriesWithRegions(req, res, next) {
  try {
    const { q, type } = req.query; // q=search text, type=country|region|city (optional)
    const result = await locationService.getCountriesWithRegions({ q, type });
    return sendResponse(res, result);
  } catch (error) {
    next(error);
  }
}
  async createCity(req, res, next) {
    try {
      const result = await locationService.createCity(req.params.regionId, req.body);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateCity(req, res, next) {
    try {
      const result = await locationService.updateCity(req.params.regionId, req.params.cityId, req.body);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteCity(req, res, next) {
    try {
      const result = await locationService.deleteCity(req.params.regionId, req.params.cityId);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getCitiesByRegionId(req, res, next) {
    try {
      const result = await locationService.getCitiesByRegionId(req.params.regionId);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new LocationController();