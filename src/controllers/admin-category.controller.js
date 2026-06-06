import adminCategoryService from '../services/admin-category.service.js';

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

class AdminCategoryController {
  async updateServiceCategoryAndSubcategory(req, res, next) {
    try {
      const { categoryId, categoryName, subcategoryId, subcategoryName } = req.body;
      const result = await adminCategoryService.updateServiceCategoryAndSubcategory({
        categoryId,
        categoryName,
        subcategoryId,
        subcategoryName,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateEventCategory(req, res, next) {
    try {
      const { categoryId, categoryName } = req.body;
      const result = await adminCategoryService.updateEventCategory({
        categoryId,
        categoryName,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  // New separate PUT/DELETE handlers

  async updateServiceCategoryOnly(req, res, next) {
    try {
      const result = await adminCategoryService.updateServiceCategory(
        req.params.categoryId,
        {
          ...req.body,
          file: req.file
        },
        getBaseUrl(req)
      );
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteServiceCategoryOnly(req, res, next) {
    try {
      const result = await adminCategoryService.deleteServiceCategory(req.params.categoryId);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateServiceSubcategoryOnly(req, res, next) {
    try {
      const result = await adminCategoryService.updateServiceSubcategory(
        req.params.categoryId,
        req.params.subcategoryId,
        req.body,
        getBaseUrl(req)
      );
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteServiceSubcategoryOnly(req, res, next) {
    try {
      const result = await adminCategoryService.deleteServiceSubcategory(
        req.params.categoryId,
        req.params.subcategoryId
      );
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateEventCategoryOnly(req, res, next) {
    try {
      const result = await adminCategoryService.updateEventCategory(
        req.params.categoryId,
        {
          ...req.body,
          file: req.file
        },
        getBaseUrl(req)
      );
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteEventCategoryOnly(req, res, next) {
    try {
      const result = await adminCategoryService.deleteEventCategory(req.params.categoryId);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new AdminCategoryController();
