import prisma from '../config/prisma.js';
import listingService from './services.service.js';
import eventService from './event.services.js';
import { createHttpError } from '../utils/httpError.js';

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

import { getUploadedFileUrl, toAbsoluteMediaUrl } from '../utils/media.js';

const serializeCategoryImage = (baseUrl, category) => {
  if (!category) {
    return category;
  }

  return {
    ...category,
    image: toAbsoluteMediaUrl(baseUrl, category.image)
  };
};

const reorderSubcategoriesOtherLast = (category) => {
  if (!category || !Array.isArray(category.subCategories)) return category;
  const isOther = (s) => (s.name || '').toLowerCase() === 'other';
  const others = category.subCategories.filter((s) => !isOther(s));
  const other = category.subCategories.filter((s) => isOther(s));
  return { ...category, subCategories: [...others, ...other] };
};

const serializeCategoryWithSubcategories = (baseUrl, category) => {
  if (!category) return category;
  const reordered = reorderSubcategoriesOtherLast(category);
  return serializeCategoryImage(baseUrl, reordered);
};

class CategoryService {
  async createEventCategory({ body, file, baseUrl }) {
    return this.createCategory({
      name: body?.name,
      image: file ? getUploadedFileUrl(file) : undefined,
      type: 'EVENT',
      baseUrl
    });
  }

  async createServiceCategory({ body, file, baseUrl }) {
    return this.createCategory({
      name: body?.name,
      image: file ? getUploadedFileUrl(file) : undefined,
      type: 'SERVICE',
      baseUrl
    });
  }

  async createCategory({ name, image, type = 'SERVICE', baseUrl }) {
    if (!name || !name.trim()) {
      throw createHttpError(400, 'Category name is required');
    }

    if (!image || !image.trim()) {
      throw createHttpError(400, 'Category image file is required');
    }

    if (!['SERVICE', 'EVENT'].includes(type)) {
      throw createHttpError(400, 'Invalid category type. Must be SERVICE or EVENT');
    }

    const normalizedName = name.trim();
    const existingCategory = await prisma.category.findUnique({
      where: {
        name: normalizedName
      }
    });

    if (existingCategory) {
      throw createHttpError(409, 'Category already exists');
    }

    const category = await prisma.category.create({
      data: {
        name: normalizedName,
        image: image.trim(),
        type
      }
    });

    return {
      statusCode: 201,
      message: 'Category created successfully',
      data: serializeCategoryImage(baseUrl, category)
    };
  }

  async createSubCategory(categoryId, { name }) {
    if (!name || !name.trim()) {
      throw createHttpError(400, 'Subcategory name is required');
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      throw createHttpError(404, 'Category not found');
    }

    if (category.type !== 'SERVICE') {
      throw createHttpError(400, 'Subcategories are only allowed for service categories');
    }

    const normalizedName = name.trim();
    const existingSubCategory = await prisma.subCategory.findFirst({
      where: {
        categoryId,
        name: normalizedName
      }
    });

    if (existingSubCategory) {
      throw createHttpError(409, 'Subcategory already exists in this category');
    }

    const subCategory = await prisma.subCategory.create({
      data: {
        name: normalizedName,
        categoryId
      }
    });

    return {
      statusCode: 201,
      message: 'Subcategory created successfully',
      data: subCategory
    };
  }

  async getAllCategories({ baseUrl, sortOrder = 'desc' } = {}) {
    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
    const categories = await prisma.category.findMany({
      orderBy: {
        createdAt: validSortOrder
      }
    });

    return {
      statusCode: 200,
      message: 'Categories retrieved successfully',
      data: categories.map((category) => serializeCategoryImage(baseUrl, category))
    };
  }

  async getCategoryById(id, { baseUrl, sortOrder = 'desc' } = {}) {
    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        subCategories: {
          orderBy: {
            createdAt: validSortOrder
          }
        }
      }
    });

    if (!category) {
      throw createHttpError(404, 'Category not found');
    }

    return {
      statusCode: 200,
      message: 'Category retrieved successfully',
      data: serializeCategoryWithSubcategories(baseUrl, category)
    };
  }

  async getCategoryByIdAndType(id, type, { baseUrl, sortOrder = 'desc', sortBy = 'createdAt' } = {}) {
    if (!['SERVICE', 'EVENT'].includes(type)) {
      throw createHttpError(400, 'Invalid category type. Must be SERVICE or EVENT');
    }

    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
    const category = await prisma.category.findFirst({
      where: {
        id,
        type
      },
      include: {
        subCategories: {
          orderBy: {
            createdAt: validSortOrder
          }
        }
      }
    });

    if (!category) {
      throw createHttpError(404, `${type === 'SERVICE' ? 'Service' : 'Event'} category not found`);
    }

    const serializedCategory = serializeCategoryWithSubcategories(baseUrl, category);

    if (type === 'SERVICE') {
      const services = await listingService.getServicesByCategoryId({
        categoryId: id,
        baseUrl,
        sortBy,
        sortOrder: validSortOrder
      });

      return {
        statusCode: 200,
        message: `${type} category retrieved successfully`,
        data: {
          ...serializedCategory,
          services
        }
      };
    }

    const events = await eventService.getEventsByCategoryId({
      categoryId: id,
      baseUrl,
      sortBy,
      sortOrder: validSortOrder
    });

    return {
      statusCode: 200,
      message: `${type} category retrieved successfully`,
      data: {
        ...serializedCategory,
        events
      }
    };
  }

  async getAllCategoriesWithSubcategories({ baseUrl, sortOrder = 'desc' } = {}) {
    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
    const categories = await prisma.category.findMany({
      include: {
        subCategories: {
          orderBy: {
            createdAt: validSortOrder
          }
        }
      },
      orderBy: {
        createdAt: validSortOrder
      }
    });

    return {
      statusCode: 200,
      message: 'Categories with subcategories retrieved successfully',
      data: categories.map((category) => serializeCategoryWithSubcategories(baseUrl, category))
    };
  }

  async getServiceCategoriesWithSubcategories({ baseUrl, sortOrder = 'asc' } = {}) {
    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'asc';
    const categories = await prisma.category.findMany({
      where: {
        type: 'SERVICE'
      },
      include: {
        subCategories: {
          orderBy: {
            createdAt: validSortOrder
          }
        }
      },
      orderBy: {
        createdAt: validSortOrder
      }
    });

    // Put category named "Other" last while preserving the sort for others
    const otherLower = (c) => (c.name || '').toLowerCase() === 'other';
    const others = categories.filter((c) => !otherLower(c));
    const otherCat = categories.filter((c) => otherLower(c));
    const ordered = [...others, ...otherCat];

    return {
      statusCode: 200,
      message: 'Service categories with subcategories retrieved successfully',
      data: ordered.map((category) => serializeCategoryWithSubcategories(baseUrl, category))
    };
  }

  async getCategoriesByType(type, { baseUrl, sortOrder = 'desc' } = {}) {
    if (!['SERVICE', 'EVENT'].includes(type)) {
      throw createHttpError(400, 'Invalid category type. Must be SERVICE or EVENT');
    }

    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
    const categories = await prisma.category.findMany({
      where: {
        type
      },
      include: {
        subCategories: {
          orderBy: {
            createdAt: validSortOrder
          }
        }
      },
      orderBy: {
        createdAt: validSortOrder
      }
    });

    return {
      statusCode: 200,
      message: `${type} categories retrieved successfully`,
      data: categories.map((category) => serializeCategoryWithSubcategories(baseUrl, category))
    };
  }

  async getSubcategoriesByCategoryId(id, { sortOrder = 'desc' } = {}) {
    const category = await prisma.category.findUnique({
      where: { id }
    });

    if (!category) {
      throw createHttpError(404, 'Category not found');
    }

    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
    const subcategories = await prisma.subCategory.findMany({
      where: {
        categoryId: id
      },
      orderBy: {
        createdAt: validSortOrder
      }
    });

    return {
      statusCode: 200,
      message: 'Subcategories retrieved successfully',
      data: subcategories
    };
  }

  async getServiceSubcategoriesByCategoryId(id, { sortOrder = 'desc' } = {}) {
    const category = await prisma.category.findFirst({
      where: {
        id,
        type: 'SERVICE'
      }
    });

    if (!category) {
      throw createHttpError(404, 'Service category not found');
    }

    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
    const subcategories = await prisma.subCategory.findMany({
      where: {
        categoryId: id
      },
      orderBy: {
        createdAt: validSortOrder
      }
    });

    return {
      statusCode: 200,
      message: 'Service subcategories retrieved successfully',
      data: subcategories
    };
  }

  async getServiceSubcategoriesWithCategory({ sortOrder = 'desc' } = {}) {
    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
    const subcategories = await prisma.subCategory.findMany({
      include: {
        category: {
          select: {
            id: true,
            name: true,
            image: true,
            type: true
          }
        }
      },
      where: {
        category: {
          type: 'SERVICE'
        }
      },
      orderBy: [
        {
          category: {
            createdAt: validSortOrder
          }
        },
        {
          createdAt: validSortOrder
        }
      ]
    });

    return {
      statusCode: 200,
      message: 'Service subcategories with categories retrieved successfully',
      data: subcategories
    };
  }

  async searchCategories(query, { baseUrl, sortOrder = 'desc' } = {}) {
    if (!query || query.trim() === '') {
      throw createHttpError(400, 'Search query is required');
    }

    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
    const categories = await prisma.category.findMany({
      where: {
        name: {
          contains: query,
          mode: 'insensitive'
        }
      },
      include: {
        subCategories: {
          orderBy: {
            createdAt: validSortOrder
          }
        }
      },
      orderBy: {
        createdAt: validSortOrder
      }
    });

    return {
      statusCode: 200,
      message: 'Search results retrieved successfully',
      data: categories.map((category) => serializeCategoryWithSubcategories(baseUrl, category))
    };
  }

  async getCategorySummaryByType(type, { baseUrl, sortOrder = 'desc' } = {}) {
    if (!['SERVICE', 'EVENT'].includes(type)) {
      throw createHttpError(400, 'Invalid category type. Must be SERVICE or EVENT');
    }

    const validSortOrder = ['asc', 'desc'].includes(sortOrder) ? sortOrder : 'desc';
    const categories = await prisma.category.findMany({
      where: {
        type
      },
      select: {
        id: true,
        name: true,
        image: true,
        createdAt: true
      },
      orderBy: {
        createdAt: validSortOrder
      }
    });

    return {
      statusCode: 200,
      message: `${type} categories retrieved successfully`,
      data: categories.map((category) => serializeCategoryImage(baseUrl, category))
    };
  }

  async getEventCategoriesSummary({ baseUrl, sortOrder = 'desc' } = {}) {
    return this.getCategorySummaryByType('EVENT', { baseUrl, sortOrder });
  }

  async getServiceCategoriesSummary({ baseUrl, sortOrder = 'desc' } = {}) {
    return this.getCategorySummaryByType('SERVICE', { baseUrl, sortOrder });
  }

  async updateCategoryByType(id, { body, file, baseUrl }, type) {
    if (!['SERVICE', 'EVENT'].includes(type)) {
      throw createHttpError(400, 'Invalid category type. Must be SERVICE or EVENT');
    }

    const { name } = body || {};
    const image = file ? getUploadedFileUrl(file) : undefined;

    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        type
      }
    });

    if (!existingCategory) {
      throw createHttpError(404, `${type === 'EVENT' ? 'Event' : 'Service'} category not found`);
    }

    const updateData = {};

    if (name !== undefined) {
      if (!name || !name.trim()) {
        throw createHttpError(400, 'Category name cannot be empty');
      }

      const normalizedName = name.trim();
      const duplicateCategory = await prisma.category.findFirst({
        where: {
          name: normalizedName,
          id: {
            not: id
          }
        }
      });

      if (duplicateCategory) {
        throw createHttpError(409, 'Category already exists');
      }

      updateData.name = normalizedName;
    }

    if (image !== undefined) {
      updateData.image = image?.trim() || null;
    }

    if (!Object.keys(updateData).length) {
      throw createHttpError(400, 'At least one of name or image is required to update');
    }

    const category = await prisma.category.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        image: true,
        type: true
      }
    });

    return {
      statusCode: 200,
      message: `${type === 'EVENT' ? 'Event' : 'Service'} category updated successfully`,
      data: serializeCategoryImage(baseUrl, category)
    };
  }

  async updateEventCategory(id, payload) {
    return this.updateCategoryByType(id, payload, 'EVENT');
  }

  async updateServiceCategory(id, payload) {
    return this.updateCategoryByType(id, payload, 'SERVICE');
  }

  async deleteCategoryByType(id, type) {
    if (!['SERVICE', 'EVENT'].includes(type)) {
      throw createHttpError(400, 'Invalid category type. Must be SERVICE or EVENT');
    }

    const existingCategory = await prisma.category.findFirst({
      where: {
        id,
        type
      },
      include: {
        subCategories: {
          select: {
            id: true
          }
        },
        listings: {
          where: {
            deletedAt: null
          },
          select: {
            id: true
          },
          take: 1
        }
      }
    });

    if (!existingCategory) {
      throw createHttpError(404, `${type === 'EVENT' ? 'Event' : 'Service'} category not found`);
    }

    if (existingCategory.subCategories.length > 0) {
      throw createHttpError(409, `Cannot delete ${type === 'EVENT' ? 'event' : 'service'} category with subcategories. Remove subcategories first.`);
    }

    if (existingCategory.listings.length > 0) {
      throw createHttpError(409, `Cannot delete ${type === 'EVENT' ? 'event' : 'service'} category with existing ${type === 'EVENT' ? 'event' : 'service'} listings.`);
    }

    await prisma.category.delete({
      where: { id }
    });

    return {
      statusCode: 200,
      message: `${type === 'EVENT' ? 'Event' : 'Service'} category deleted successfully`
    };
  }

  async deleteEventCategory(id) {
    return this.deleteCategoryByType(id, 'EVENT');
  }

  async deleteServiceCategory(id) {
    return this.deleteCategoryByType(id, 'SERVICE');
  }
}

export default new CategoryService();