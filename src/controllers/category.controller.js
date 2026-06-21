import categoryService from '../services/category.service.js';

const getBaseUrl = (req) => {
  if (process.env.BACKEND_URL) {
    return process.env.BACKEND_URL.replace(/\/$/, '');
  }

  return `${req.protocol}://${req.get('host')}`;
};

const getSortOrder = (req) => {
  const sortOrder = req.query.sortOrder || req.body?.sortOrder || 'desc';
  return ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
};

const sendResponse = (res, result) => res.status(result.statusCode).json({
  success: true,
  message: result.message,
  ...(result.data !== undefined ? { data: result.data } : {}),
  ...(result.meta !== undefined ? { meta: result.meta } : {})
});

class CategoryController {
  async createEventCategory(req, res, next) {
    try {
      const result = await categoryService.createEventCategory({
        body: req.body,
        file: req.file,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createServiceCategory(req, res, next) {
    try {
      const result = await categoryService.createServiceCategory({
        body: req.body,
        file: req.file,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createCategory(req, res, next) {
    try {
      const result = await categoryService.createCategory({
        ...req.body,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async createSubCategory(req, res, next) {
    try {
      const result = await categoryService.createSubCategory(req.params.id, req.body);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all categories
   * GET /api/categories?sortOrder=desc
   */
  async getAllCategories(req, res, next) {
    try {
      const result = await categoryService.getAllCategories({
        baseUrl: getBaseUrl(req),
        sortOrder: getSortOrder(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      console.error('Error fetching categories:', error);
      next(error);
    }
  }

  /**
   * Get category by ID with subcategories
   * GET /api/categories/:id?sortOrder=desc
   */
  async getCategoryById(req, res, next) {
    try {
      const result = await categoryService.getCategoryById(req.params.id, {
        baseUrl: getBaseUrl(req),
        sortOrder: getSortOrder(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      console.error('Error fetching category:', error);
      next(error);
    }
  }

  async getServiceCategoryById(req, res, next) {
    try {
      const sortBy = req.query.sortBy || 'createdAt';
      const result = await categoryService.getCategoryByIdAndType(req.params.id, 'SERVICE', {
        baseUrl: getBaseUrl(req),
        sortOrder: getSortOrder(req),
        sortBy
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getEventCategoryById(req, res, next) {
    try {
      const sortBy = req.query.sortBy || 'createdAt';
      const result = await categoryService.getCategoryByIdAndType(req.params.id, 'EVENT', {
        baseUrl: getBaseUrl(req),
        sortOrder: getSortOrder(req),
        sortBy
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all categories with their subcategories
   * GET /api/categories/with-subcategories?sortOrder=desc
   */
  async getAllCategoriesWithSubcategories(req, res, next) {
    try {
      const result = await categoryService.getAllCategoriesWithSubcategories({
        baseUrl: getBaseUrl(req),
        sortOrder: getSortOrder(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      console.error('Error fetching categories with subcategories:', error);
      next(error);
    }
  }

  async getServiceCategoriesWithSubcategories(req, res, next) {
    try {
      const sortOrder = req.query.sortOrder || req.body?.sortOrder || 'desc';
      const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
      const result = await categoryService.getServiceCategoriesWithSubcategories({
        baseUrl: getBaseUrl(req),
        sortOrder: validSortOrder
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get categories by type (SERVICE or EVENT)
   * GET /api/categories/type/:type?sortOrder=desc
   */
  async getCategoriesByType(req, res, next) {
    try {
      const result = await categoryService.getCategoriesByType(req.params.type, {
        baseUrl: getBaseUrl(req),
        sortOrder: getSortOrder(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      console.error('Error fetching categories by type:', error);
      next(error);
    }
  }

  /**
   * Get all subcategories for a category
   * GET /api/categories/:id/subcategories?sortOrder=desc
   */
  async getSubcategoriesByCategoryId(req, res, next) {
    try {
      const result = await categoryService.getSubcategoriesByCategoryId(req.params.id, {
        sortOrder: getSortOrder(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      next(error);
    }
  }

  async getServiceSubcategoriesByCategoryId(req, res, next) {
    try {
      const result = await categoryService.getServiceSubcategoriesByCategoryId(req.params.id, {
        sortOrder: getSortOrder(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getServiceSubcategoriesWithCategory(req, res, next) {
    try {
      const result = await categoryService.getServiceSubcategoriesWithCategory({
        sortOrder: getSortOrder(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search categories by name
   * GET /api/categories/search?q=searchTerm&sortOrder=desc
   */
  async searchCategories(req, res, next) {
    try {
      const result = await categoryService.searchCategories(req.query.q, {
        baseUrl: getBaseUrl(req),
        sortOrder: getSortOrder(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      console.error('Error searching categories:', error);
      next(error);
    }
  }

  async getEventCategoriesSummary(req, res, next) {
    try {
      const result = await categoryService.getEventCategoriesSummary({
        baseUrl: getBaseUrl(req),
        sortOrder: getSortOrder(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateEventCategory(req, res, next) {
    try {
      const result = await categoryService.updateEventCategory(req.params.id, {
        body: req.body,
        file: req.file,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteEventCategory(req, res, next) {
    try {
      const result = await categoryService.deleteEventCategory(req.params.id);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async getServiceCategoriesSummary(req, res, next) {
    try {
      const result = await categoryService.getServiceCategoriesSummary({
        baseUrl: getBaseUrl(req),
        sortOrder: getSortOrder(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async updateServiceCategory(req, res, next) {
    try {
      const result = await categoryService.updateServiceCategory(req.params.id, {
        body: req.body,
        file: req.file,
        baseUrl: getBaseUrl(req)
      });
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }

  async deleteServiceCategory(req, res, next) {
    try {
      const result = await categoryService.deleteServiceCategory(req.params.id);
      return sendResponse(res, result);
    } catch (error) {
      next(error);
    }
  }
}

export default new CategoryController();
