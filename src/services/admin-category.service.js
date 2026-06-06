import prisma from '../config/prisma.js';
import { createHttpError } from '../utils/httpError.js';

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;

const toPublicUploadPath = (filePath) => `/${filePath.split('uploads')[1].replace(/\\/g, '/').replace(/^\//, 'uploads/')}`;

const toAbsoluteMediaUrl = (baseUrl, mediaPath) => {
  if (!mediaPath) {
    return mediaPath;
  }

  if (ABSOLUTE_URL_PATTERN.test(mediaPath)) {
    return mediaPath;
  }

  const normalizedPath = mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`;
  return `${baseUrl}${normalizedPath}`;
};

const serializeCategoryImage = (baseUrl, category) => ({
  ...category,
  image: toAbsoluteMediaUrl(baseUrl, category.image)
});

const buildCategoryUpdatePayload = ({ name, file }) => {
  const data = {};

  if (typeof name === 'string') {
    const normalizedName = name.trim();
    if (!normalizedName) {
      throw createHttpError(400, 'Category name cannot be empty');
    }
    data.name = normalizedName;
  }

  if (file?.path) {
    data.image = toPublicUploadPath(file.path);
  }

  if (!Object.keys(data).length) {
    throw createHttpError(400, 'At least one field is required: name or image');
  }

  return data;
};

class AdminCategoryService {
  /**
   * Unified API to update/delete service category and subcategories
   * Supports:
   * - Update category name (categoryName must be provided and not null)
   * - Delete category (categoryName = null/empty, cascades to subcategories)
   * - Update subcategory name (subcategoryId and subcategoryName provided)
   * - Delete subcategory (subcategoryId provided, subcategoryName = null/empty)
   */
  async updateServiceCategoryAndSubcategory({
    categoryId,
    categoryName,
    subcategoryId,
    subcategoryName,
    baseUrl
  }) {
    try {
      // Validate inputs
      if (!categoryId) {
        throw createHttpError(400, 'categoryId is required');
      }

      // Check if category exists and is SERVICE type
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          type: 'SERVICE'
        },
        include: {
          subCategories: true
        }
      });

      if (!category) {
        throw createHttpError(404, 'Service category not found');
      }

      // Case 1: Delete category (categoryName is null/empty)
      if (categoryName === null || categoryName === '') {
        // Delete the category (cascades to subcategories due to Prisma schema)
        await prisma.category.delete({
          where: { id: categoryId }
        });

        return {
          statusCode: 200,
          message: 'Service category and all its subcategories deleted successfully',
          data: {
            action: 'deleted',
            type: 'category',
            categoryId
          }
        };
      }

      // Case 2: Update/manage subcategory
      if (subcategoryId) {
        // Validate subcategoryId belongs to this category
        const subcategory = await prisma.subCategory.findFirst({
          where: {
            id: subcategoryId,
            categoryId
          }
        });

        if (!subcategory) {
          throw createHttpError(404, 'Subcategory not found in this category');
        }

        // Case 2a: Delete subcategory (subcategoryName is null/empty)
        if (subcategoryName === null || subcategoryName === '') {
          await prisma.subCategory.delete({
            where: { id: subcategoryId }
          });

          return {
            statusCode: 200,
            message: 'Service subcategory deleted successfully',
            data: {
              action: 'deleted',
              type: 'subcategory',
              subcategoryId,
              categoryId
            }
          };
        }

        // Case 2b: Update subcategory name
        const normalizedSubcategoryName = subcategoryName.trim();

        // Check duplicate subcategory name within the same category
        const duplicateSubcategory = await prisma.subCategory.findFirst({
          where: {
            name: normalizedSubcategoryName,
            categoryId,
            id: {
              not: subcategoryId
            }
          }
        });

        if (duplicateSubcategory) {
          throw createHttpError(409, 'Subcategory with this name already exists in this category');
        }

        const updatedSubcategory = await prisma.subCategory.update({
          where: { id: subcategoryId },
          data: { name: normalizedSubcategoryName }
        });

        return {
          statusCode: 200,
          message: 'Service subcategory updated successfully',
          data: {
            action: 'updated',
            type: 'subcategory',
            subcategory: updatedSubcategory,
            categoryId
          }
        };
      }

      // Case 3: Update category name (categoryName is provided and not null)
      const normalizedCategoryName = categoryName.trim();

      if (!normalizedCategoryName) {
        throw createHttpError(400, 'Category name cannot be empty');
      }

      const duplicateCategory = await prisma.category.findFirst({
        where: {
          name: normalizedCategoryName,
          id: {
            not: categoryId
          }
        }
      });

      if (duplicateCategory) {
        throw createHttpError(409, 'Category with this name already exists');
      }

      const updatedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: { name: normalizedCategoryName },
        include: {
          subCategories: true
        }
      });

      return {
        statusCode: 200,
        message: 'Service category updated successfully',
        data: {
          action: 'updated',
          type: 'category',
          category: serializeCategoryImage(baseUrl, updatedCategory),
          subCategoriesCount: updatedCategory.subCategories.length
        }
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update/Delete event category (name only, no subcategories)
   * - Update: categoryName provided and not null
   * - Delete: categoryName is null/empty
   */
  async updateEventCategory({ categoryId, categoryName, baseUrl }) {
    try {
      if (!categoryId) {
        throw createHttpError(400, 'categoryId is required');
      }

      // Check if category exists and is EVENT type
      const category = await prisma.category.findFirst({
        where: {
          id: categoryId,
          type: 'EVENT'
        }
      });

      if (!category) {
        throw createHttpError(404, 'Event category not found');
      }

      // Case 1: Delete category (categoryName is null/empty)
      if (categoryName === null || categoryName === '') {
        await prisma.category.delete({
          where: { id: categoryId }
        });

        return {
          statusCode: 200,
          message: 'Event category deleted successfully',
          data: {
            action: 'deleted',
            type: 'category',
            categoryId
          }
        };
      }

      // Case 2: Update category name
      const normalizedCategoryName = categoryName.trim();

      if (!normalizedCategoryName) {
        throw createHttpError(400, 'Category name cannot be empty');
      }

      const duplicateCategory = await prisma.category.findFirst({
        where: {
          name: normalizedCategoryName,
          id: {
            not: categoryId
          }
        }
      });

      if (duplicateCategory) {
        throw createHttpError(409, 'Category with this name already exists');
      }

      const updatedCategory = await prisma.category.update({
        where: { id: categoryId },
        data: { name: normalizedCategoryName }
      });

      return {
        statusCode: 200,
        message: 'Event category updated successfully',
        data: {
          action: 'updated',
          type: 'category',
          category: serializeCategoryImage(baseUrl, updatedCategory)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  // New separate PUT/DELETE endpoints

  async updateServiceCategory(categoryId, { name, file }, baseUrl) {
    if (!categoryId) {
      throw createHttpError(400, 'categoryId is required');
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        type: 'SERVICE'
      },
      include: {
        subCategories: true
      }
    });

    if (!category) {
      throw createHttpError(404, 'Service category not found');
    }

    const data = buildCategoryUpdatePayload({ name, file });

    if (data.name) {
      const duplicate = await prisma.category.findFirst({
        where: {
          name: data.name,
          id: { not: categoryId }
        }
      });

      if (duplicate) {
        throw createHttpError(409, 'Category with this name already exists');
      }
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data,
      include: { subCategories: true }
    });

    return {
      statusCode: 200,
      message: 'Service category updated successfully',
      data: serializeCategoryImage(baseUrl, updated)
    };
  }

  async deleteServiceCategory(categoryId) {
    if (!categoryId) {
      throw createHttpError(400, 'categoryId is required');
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        type: 'SERVICE'
      }
    });

    if (!category) {
      throw createHttpError(404, 'Service category not found');
    }

    // Check if any listings exist under this category
    const listingCount = await prisma.listing.count({
      where: {
        categoryId,
        deletedAt: null
      }
    });

    if (listingCount > 0) {
      throw createHttpError(
        409,
        `There are ${listingCount} active listing(s) under this category. Please delete all listings first.`
      );
    }

    await prisma.category.delete({
      where: { id: categoryId }
    });

    return {
      statusCode: 200,
      message: 'Service category deleted successfully'
    };
  }

  async updateServiceSubcategory(categoryId, subcategoryId, { name }, baseUrl) {
    if (!categoryId || !subcategoryId) {
      throw createHttpError(400, 'categoryId and subcategoryId are required');
    }

    if (!name || !name.trim()) {
      throw createHttpError(400, 'Subcategory name is required');
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        type: 'SERVICE'
      }
    });

    if (!category) {
      throw createHttpError(404, 'Service category not found');
    }

    const subcategory = await prisma.subCategory.findFirst({
      where: {
        id: subcategoryId,
        categoryId
      }
    });

    if (!subcategory) {
      throw createHttpError(404, 'Subcategory not found in this category');
    }

    const normalizedName = name.trim();
    const duplicate = await prisma.subCategory.findFirst({
      where: {
        name: normalizedName,
        categoryId,
        id: { not: subcategoryId }
      }
    });

    if (duplicate) {
      throw createHttpError(409, 'Subcategory with this name already exists in this category');
    }

    const updated = await prisma.subCategory.update({
      where: { id: subcategoryId },
      data: { name: normalizedName }
    });

    return {
      statusCode: 200,
      message: 'Service subcategory updated successfully',
      data: updated
    };
  }

  async deleteServiceSubcategory(categoryId, subcategoryId) {
    if (!categoryId || !subcategoryId) {
      throw createHttpError(400, 'categoryId and subcategoryId are required');
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        type: 'SERVICE'
      }
    });

    if (!category) {
      throw createHttpError(404, 'Service category not found');
    }

    const subcategory = await prisma.subCategory.findFirst({
      where: {
        id: subcategoryId,
        categoryId
      }
    });

    if (!subcategory) {
      throw createHttpError(404, 'Subcategory not found in this category');
    }

    // Check if any listings exist under this subcategory
    const listingCount = await prisma.listing.count({
      where: {
        subCategoryId: subcategoryId,
        deletedAt: null
      }
    });

    if (listingCount > 0) {
      throw createHttpError(
        409,
        `There are ${listingCount} active listing(s) under this subcategory. Please delete all listings first.`
      );
    }

    await prisma.subCategory.delete({
      where: { id: subcategoryId }
    });

    return {
      statusCode: 200,
      message: 'Service subcategory deleted successfully'
    };
  }

  async updateEventCategory(categoryId, { name, file }, baseUrl) {
    if (!categoryId) {
      throw createHttpError(400, 'categoryId is required');
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        type: 'EVENT'
      }
    });

    if (!category) {
      throw createHttpError(404, 'Event category not found');
    }

    const data = buildCategoryUpdatePayload({ name, file });

    if (data.name) {
      const duplicate = await prisma.category.findFirst({
        where: {
          name: data.name,
          id: { not: categoryId }
        }
      });

      if (duplicate) {
        throw createHttpError(409, 'Category with this name already exists');
      }
    }

    const updated = await prisma.category.update({
      where: { id: categoryId },
      data
    });

    return {
      statusCode: 200,
      message: 'Event category updated successfully',
      data: serializeCategoryImage(baseUrl, updated)
    };
  }

  async deleteEventCategory(categoryId) {
    if (!categoryId) {
      throw createHttpError(400, 'categoryId is required');
    }

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        type: 'EVENT'
      }
    });

    if (!category) {
      throw createHttpError(404, 'Event category not found');
    }

    // Check if any listings exist under this category
    const listingCount = await prisma.listing.count({
      where: {
        categoryId,
        deletedAt: null
      }
    });

    if (listingCount > 0) {
      throw createHttpError(
        409,
        `There are ${listingCount} active event(s) under this category. Please delete all events first.`
      );
    }

    await prisma.category.delete({
      where: { id: categoryId }
    });

    return {
      statusCode: 200,
      message: 'Event category deleted successfully'
    };
  }
}

export default new AdminCategoryService();
