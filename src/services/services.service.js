import prisma from '../config/prisma.js';
import { STRIPE_CURRENCY, getStripeClient, getStripePublishableKey } from '../config/stripe.js';
import { createHttpError } from '../utils/httpError.js';

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const LISTING_STATUSES = ['PENDING', 'APPROVED', 'SUSPENDED', 'EXPIRED'];
const MODERATABLE_STATUSES = ['PENDING', 'APPROVED', 'SUSPENDED'];
const SORTABLE_FIELDS = ['createdAt', 'price', 'title'];
const PRICE_RANGE_MAP = {
  all: {},
  under20: { lte: 20 },
  from25to100: { gte: 25, lte: 100 },
  from100to300: { gte: 100, lte: 300 },
  from300to500: { gte: 300, lte: 500 },
  from500to1000: { gte: 500, lte: 1000 },
  from1000to10000: { gte: 1000, lte: 10000 }
};
const INTRODUCTORY_PERIOD_DAYS = 90;
const LISTING_ACTIVE_DAYS = 30;

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

const serializeListingMedia = (baseUrl, listing) => {
  if (!listing) {
    return listing;
  }

  return {
    ...listing,
    categoryName: listing.category?.name || null,
    subCategoryName: listing.subCategory?.name || null,
    countryName: listing.country?.name || null,
    regionName: listing.region?.name || null,
    cityName: listing.city?.name || null,
    mainImage: toAbsoluteMediaUrl(baseUrl, listing.mainImage),
    serviceImages: Array.isArray(listing.serviceImages)
      ? listing.serviceImages.map((image) => toAbsoluteMediaUrl(baseUrl, image))
      : [],
    gallery: Array.isArray(listing.gallery)
      ? listing.gallery.map((image) => toAbsoluteMediaUrl(baseUrl, image))
      : []
  };
};

const normalizeStringArray = (value) => {
  if (value === undefined || value === null || value === '') {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (!trimmedValue) {
      return [];
    }

    if (trimmedValue.startsWith('[')) {
      try {
        const parsedValue = JSON.parse(trimmedValue);
        return Array.isArray(parsedValue)
          ? parsedValue.filter(Boolean).map((item) => String(item).trim()).filter(Boolean)
          : [];
      } catch {
        return [trimmedValue];
      }
    }

    return [trimmedValue];
  }

  return [];
};

const getIntroductoryCutoffDate = () => {
  const date = new Date();
  date.setDate(date.getDate() - INTRODUCTORY_PERIOD_DAYS);
  return date;
};

const getListingExpiryDate = (startDate = new Date()) => {
  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + LISTING_ACTIVE_DAYS);
  return expiryDate;
};

const isRenewableListing = (listing) => Boolean(
  listing && (listing.status === 'EXPIRED' || (listing.expiresAt && listing.expiresAt <= new Date()))
);

const LISTING_PAYMENT_INCLUDE = {
  category: true,
  subCategory: true,
  country: true,
  region: true,
  user: {
    select: {
      id: true,
      fullName: true,
      email: true,
      phoneNumber: true,
      profileImage: true
    }
  },
  payments: {
    orderBy: {
      createdAt: 'desc'
    },
    take: 1
  },
  subscription: true
};

const getServicePurchaseContext = (listingId, userId, planId) => Promise.all([
  prisma.listing.findFirst({
    where: {
      id: listingId,
      userId,
      listingType: 'SERVICE',
      deletedAt: null
    },
    include: LISTING_PAYMENT_INCLUDE
  }),
  prisma.pricingPlan.findFirst({
    where: {
      id: planId,
      isActive: true
    }
  }),
  prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      createdAt: true
    }
  }),
  prisma.pricingPlan.findFirst({
    where: {
      isActive: true
    },
    orderBy: {
      price: 'asc'
    }
  })
]);

const normalizeRedirectUrl = (url, queryKey, queryValue) => {
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.set(queryKey, queryValue);
  return parsedUrl.toString();
};

const expireServiceListings = async () => {
  const now = new Date();

  const expiredListings = await prisma.listing.findMany({
    where: {
      listingType: 'SERVICE',
      deletedAt: null,
      status: 'APPROVED',
      expiresAt: {
        lt: now
      }
    },
    select: {
      id: true
    }
  });

  if (!expiredListings.length) {
    return;
  }

  const listingIds = expiredListings.map((listing) => listing.id);

  await prisma.$transaction([
    prisma.listing.updateMany({
      where: {
        id: {
          in: listingIds
        }
      },
      data: {
        status: 'EXPIRED'
      }
    }),
    prisma.subscription.updateMany({
      where: {
        listingId: {
          in: listingIds
        }
      },
      data: {
        isActive: false
      }
    })
  ]);
};

const parsePriceRange = (priceRange) => {
  if (!priceRange) {
    return { filter: null, isValid: true };
  }

  const normalizedPriceRange = String(priceRange).trim();

  if (Object.prototype.hasOwnProperty.call(PRICE_RANGE_MAP, normalizedPriceRange)) {
    return {
      filter: PRICE_RANGE_MAP[normalizedPriceRange],
      isValid: true
    };
  }

  if (/^500(?:\s*(?:\+|plus))?$/i.test(normalizedPriceRange)) {
    return {
      filter: { gte: 500 },
      isValid: true
    };
  }

  const underMatch = /^under(\d+)$/i.exec(normalizedPriceRange);
  if (underMatch) {
    return {
      filter: { lte: Number(underMatch[1]) },
      isValid: true
    };
  }

  const betweenMatch = /^from(\d+)to(\d+)$/i.exec(normalizedPriceRange);
  if (betweenMatch) {
    const minimum = Number(betweenMatch[1]);
    const maximum = Number(betweenMatch[2]);

    if (minimum > maximum) {
      return { filter: null, isValid: false };
    }

    return {
      filter: { gte: minimum, lte: maximum },
      isValid: true
    };
  }

  return { filter: null, isValid: false };
};

const normalizeError = (error) => {
  if (error?.status) {
    return error;
  }

  if (error?.statusCode) {
    error.status = error.statusCode;
    return error;
  }

  if (error?.type?.startsWith('Stripe')) {
    return createHttpError(error.statusCode || 400, error.message);
  }

  if (error?.code === 'P2002') {
    return createHttpError(409, 'This Stripe payment intent has already been recorded');
  }

  if (error?.code === 'P2011') {
    const constraint = String(error?.meta?.constraint || error?.message || '');
    if (/cityId/i.test(constraint)) {
      return createHttpError(400, 'cityId is required');
    }
  }

  return error;
};

class ListingService {
  async createService({ body, files, userId, baseUrl }) {
    try {
      const {
        title,
        description,
        price,
        categoryId,
        subCategoryId,
        countryId,
        regionId,
        cityId,
        address,
        contactEmail,
        contactPhone,
        facebookUrl,
        instagramUrl,
        mainImage,
        gallery,
        serviceImage,
        serviceImages,
        serviceGallery
      } = body;

      const normalizedCategoryId = typeof categoryId === 'string' ? categoryId.trim() : categoryId;
      const normalizedSubCategoryId = typeof subCategoryId === 'string' ? subCategoryId.trim() : subCategoryId;
      const normalizedCountryId = typeof countryId === 'string' ? countryId.trim() : countryId;
      const normalizedRegionId = typeof regionId === 'string' ? regionId.trim() : regionId;
      const normalizedCityId = typeof cityId === 'string' ? cityId.trim() : cityId;

      const uploadedServiceImages = [
        ...(files?.serviceImages || []),
        ...(files?.serviceImage || []),
        ...(files?.mainImage || [])
      ].map((file) => toPublicUploadPath(file.path));

      const uploadedServiceGallery = [
        ...(files?.serviceGallery || []),
        ...(files?.gallery || [])
      ].map((file) => toPublicUploadPath(file.path));

      const bodyServiceImages = normalizeStringArray(serviceImages);
      const bodyServiceGallery = normalizeStringArray(serviceGallery).concat(normalizeStringArray(gallery));
      const bodyPrimaryImage = mainImage?.trim() || serviceImage?.trim() || bodyServiceImages[0] || null;

      const normalizedServiceImages = uploadedServiceImages.length > 0
        ? uploadedServiceImages
        : bodyServiceImages.length > 0
          ? bodyServiceImages
          : bodyPrimaryImage
            ? [bodyPrimaryImage]
            : [];
      const resolvedMainImage = normalizedServiceImages[0] || bodyPrimaryImage;
      const resolvedGallery = uploadedServiceGallery.length > 0 ? uploadedServiceGallery : bodyServiceGallery;

      if (!normalizedCityId) {
        throw createHttpError(400, 'cityId is required');
      }

      if (!title || !description || price === undefined || !normalizedCategoryId || !normalizedCountryId || !normalizedRegionId || !contactEmail || !contactPhone || !resolvedMainImage) {
        throw createHttpError(400, 'title, description, price, categoryId, countryId, regionId, contactEmail, contactPhone, and service image are required');
      }

      const parsedPrice = Number(price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        throw createHttpError(400, 'price must be a valid positive number');
      }

      const [category, country, categorySubCategories] = await Promise.all([
        prisma.category.findFirst({
          where: {
            id: normalizedCategoryId,
            type: 'SERVICE'
          }
        }),
        prisma.country.findUnique({
          where: { id: normalizedCountryId }
        }),
        prisma.subCategory.findMany({
          where: {
            categoryId: normalizedCategoryId
          },
          select: {
            id: true
          }
        })
      ]);

      if (!category) {
        throw createHttpError(400, 'Invalid service category');
      }

      if (!country) {
        throw createHttpError(400, 'Invalid country');
      }

      const region = await prisma.region.findFirst({
        where: {
          id: normalizedRegionId,
          countryId: normalizedCountryId
        }
      });

      if (!region) {
        throw createHttpError(400, 'Invalid region for the selected country');
      }

      const city = await prisma.city.findFirst({
        where: {
          id: normalizedCityId,
          regionId: normalizedRegionId
        }
      });

      if (!city) {
        throw createHttpError(400, 'Invalid city for the selected region');
      }

      if (!subCategoryId && categorySubCategories.length > 0) {
        throw createHttpError(400, 'subCategoryId is required for the selected category');
      }

      let validatedSubCategoryId = null;
      if (normalizedSubCategoryId) {
        const subCategory = await prisma.subCategory.findFirst({
          where: {
            id: normalizedSubCategoryId,
            categoryId: normalizedCategoryId
          }
        });

        if (!subCategory) {
          throw createHttpError(400, 'Invalid subcategory for the selected category');
        }

        validatedSubCategoryId = subCategory.id;
      }

      const listing = await prisma.listing.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          price: parsedPrice,
          listingType: 'SERVICE',
          status: 'PENDING',
          countryId: normalizedCountryId,
          regionId: normalizedRegionId,
          cityId: normalizedCityId,
          address: address?.trim() || null,
          contactEmail: contactEmail.trim().toLowerCase(),
          contactPhone: contactPhone.trim(),
          facebookUrl: facebookUrl?.trim() || null,
          instagramUrl: instagramUrl?.trim() || null,
          mainImage: resolvedMainImage.trim(),
          serviceImages: normalizedServiceImages,
          gallery: resolvedGallery,
          userId,
          categoryId: normalizedCategoryId,
          subCategoryId: validatedSubCategoryId
        },
        include: {
          category: true,
          subCategory: true,
          country: true,
          region: true,
          city: true
        }
      });

      return {
        statusCode: 201,
        message: 'Service created successfully and is pending admin approval',
        data: serializeListingMedia(baseUrl, listing)
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getPublicServices({ query, baseUrl }) {
    try {
      await expireServiceListings();

      const {
        categoryId,
        subCategoryId,
        countryId,
        regionId,
        search,
        priceRange,
        minPrice,
        maxPrice,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = '1',
        limit = '12'
      } = query;

      const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
      const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
      const parsedMinPrice = minPrice !== undefined ? Number(minPrice) : undefined;
      const parsedMaxPrice = maxPrice !== undefined ? Number(maxPrice) : undefined;
      const { filter: selectedPriceRange, isValid: isPriceRangeValid } = parsePriceRange(priceRange);

      if ((minPrice !== undefined && Number.isNaN(parsedMinPrice)) || (maxPrice !== undefined && Number.isNaN(parsedMaxPrice))) {
        throw createHttpError(400, 'minPrice and maxPrice must be valid numbers');
      }

      if (!isPriceRangeValid) {
        throw createHttpError(400, 'Invalid priceRange value');
      }

      const selectedSortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
      const selectedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

      const where = {
        listingType: 'SERVICE',
        status: 'APPROVED',
        expiresAt: {
          gt: new Date()
        },
        deletedAt: null,
        ...(categoryId ? { categoryId } : {}),
        ...(subCategoryId ? { subCategoryId } : {}),
        ...(countryId ? { countryId } : {}),
        ...(regionId ? { regionId } : {}),
        ...(query.cityId ? { cityId: query.cityId } : {}),
        ...((selectedPriceRange || parsedMinPrice !== undefined || parsedMaxPrice !== undefined)
          ? {
              price: {
                ...(selectedPriceRange || {}),
                ...(parsedMinPrice !== undefined ? { gte: parsedMinPrice } : {}),
                ...(parsedMaxPrice !== undefined ? { lte: parsedMaxPrice } : {})
              }
            }
          : {}),
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: 'insensitive'
                  }
                },
                {
                  description: {
                    contains: search,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          : {})
      };

      const [total, services] = await Promise.all([
        prisma.listing.count({ where }),
        prisma.listing.findMany({
          where,
          include: {
              category: true,
              subCategory: true,
              country: true,
              region: true,
              city: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                profileImage: true
              }
            }
          },
          orderBy: {
            [selectedSortField]: selectedSortOrder
          },
          skip: (parsedPage - 1) * parsedLimit,
          take: parsedLimit
        })
      ]);

      return {
        statusCode: 200,
        message: 'Services retrieved successfully',
        data: services.map((service) => serializeListingMedia(baseUrl, service)),
        meta: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(total / parsedLimit) || 1,
          filters: {
            categoryId: categoryId || null,
            subCategoryId: subCategoryId || null,
            countryId: countryId || null,
            regionId: regionId || null,
            search: search || null,
            priceRange: priceRange || null,
            minPrice: parsedMinPrice ?? null,
            maxPrice: parsedMaxPrice ?? null,
            sortBy: selectedSortField,
            sortOrder: selectedSortOrder
          }
        }
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getServiceById({ id, baseUrl }) {
    try {
      await expireServiceListings();

      const listing = await prisma.listing.findUnique({
        where: { id },
        include: {
          category: true,
          subCategory: true,
          country: true,
          region: true,
          city: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              profileImage: true
            }
          }
        }
      });

      if (!listing || listing.deletedAt || listing.listingType !== 'SERVICE' || listing.status !== 'APPROVED' || !listing.expiresAt || listing.expiresAt <= new Date()) {
        throw createHttpError(404, 'Service not found');
      }

      return {
        statusCode: 200,
        message: 'Service retrieved successfully',
        data: serializeListingMedia(baseUrl, listing)
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getMyServices({ userId, query = {}, baseUrl }) {
    try {
      await expireServiceListings();

      const { status, search, page = '1', limit = '20' } = query;

      if (status && !LISTING_STATUSES.includes(status)) {
        throw createHttpError(400, 'Invalid status value');
      }

      const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
      const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

      const where = {
        userId,
        listingType: 'SERVICE',
        deletedAt: null,
        ...(status ? { status } : {}),
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: 'insensitive'
                  }
                },
                {
                  description: {
                    contains: search,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          : {})
      };

      const [total, services] = await Promise.all([
        prisma.listing.count({ where }),
        prisma.listing.findMany({
          where,
          include: {
            category: true,
            subCategory: true,
            country: true,
            region: true,
            payments: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            },
            subscription: true
          },
          orderBy: {
            createdAt: 'desc'
          },
          skip: (parsedPage - 1) * parsedLimit,
          take: parsedLimit
        })
      ]);

      return {
        statusCode: 200,
        message: 'Your services retrieved successfully',
        data: services.map((service) => serializeListingMedia(baseUrl, service)),
        meta: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(total / parsedLimit) || 1
        }
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async updateService({ id, userId, body, files, baseUrl }) {
    try {
      await expireServiceListings();

      const existingService = await prisma.listing.findFirst({
        where: {
          id,
          userId,
          listingType: 'SERVICE',
          deletedAt: null
        }
      });

      if (!existingService) {
        throw createHttpError(404, 'Service not found or you do not have permission to edit it');
      }

      const updateData = {};

      if (body.title) updateData.title = body.title;
      if (body.description) updateData.description = body.description;
      if (body.price) updateData.price = parseFloat(body.price);
      if (body.contactEmail) updateData.contactEmail = body.contactEmail;
      if (body.contactPhone) updateData.contactPhone = body.contactPhone;
      if (body.facebookUrl) updateData.facebookUrl = body.facebookUrl;
      if (body.instagramUrl) updateData.instagramUrl = body.instagramUrl;
      if (body.countryId) updateData.countryId = body.countryId;
      if (body.regionId) updateData.regionId = body.regionId;
      if (body.cityId) {
        const targetRegionId = body.regionId || existingService.regionId;
        const foundCity = await prisma.city.findFirst({ where: { id: body.cityId, regionId: targetRegionId } });
        if (!foundCity) {
          throw createHttpError(400, 'Invalid city for the selected region');
        }
        updateData.cityId = body.cityId;
      }
      if (body.address) updateData.address = body.address;
      if (body.categoryId) updateData.categoryId = body.categoryId;
      if (body.subCategoryId) updateData.subCategoryId = body.subCategoryId;

      if (files) {
        if (files.mainImage && files.mainImage[0]) {
          updateData.mainImage = toPublicUploadPath(files.mainImage[0].path);
        }
        if (files.serviceImages) {
          updateData.serviceImages = files.serviceImages.map((file) => toPublicUploadPath(file.path));
        }
        if (files.gallery) {
          updateData.gallery = files.gallery.map((file) => toPublicUploadPath(file.path));
        }
      }

      const service = await prisma.listing.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          subCategory: true,
          country: true,
          region: true,
          payments: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          subscription: true
        }
      });

      return {
        statusCode: 200,
        message: 'Service updated successfully',
        data: serializeListingMedia(baseUrl, service)
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async deleteMyService({ id, userId }) {
    try {
      await expireServiceListings();

      const existingService = await prisma.listing.findFirst({
        where: {
          id,
          userId,
          listingType: 'SERVICE',
          deletedAt: null
        }
      });

      if (!existingService) {
        throw createHttpError(404, 'Service not found or you do not have permission to delete it');
      }

      await prisma.listing.update({
        where: { id },
        data: {
          deletedAt: new Date()
        }
      });

      return {
        statusCode: 200,
        message: 'Service deleted successfully'
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getAdminServices({ query, baseUrl }) {
    try {
      await expireServiceListings();

      const {
        status,
        categoryId,
        subCategoryId,
        countryId,
        regionId,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        page = '1',
        limit = '20'
      } = query;

      if (status && !LISTING_STATUSES.includes(status)) {
        throw createHttpError(400, 'Invalid status value');
      }

      const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
      const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
      const selectedSortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
      const selectedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

      const where = {
        listingType: 'SERVICE',
        deletedAt: null,
        payments: {
          some: {
            status: 'SUCCESS'
          }
        },
        ...(status ? { status } : {}),
        ...(categoryId ? { categoryId } : {}),
        ...(subCategoryId ? { subCategoryId } : {}),
        ...(countryId ? { countryId } : {}),
        ...(regionId ? { regionId } : {}),
        ...(search
          ? {
              OR: [
                {
                  title: {
                    contains: search,
                    mode: 'insensitive'
                  }
                },
                {
                  description: {
                    contains: search,
                    mode: 'insensitive'
                  }
                },
                {
                  user: {
                    fullName: {
                      contains: search,
                      mode: 'insensitive'
                    }
                  }
                }
              ]
            }
          : {})
      };

      const [total, services] = await Promise.all([
        prisma.listing.count({ where }),
        prisma.listing.findMany({
          where,
          include: {
            category: true,
            subCategory: true,
            country: true,
            region: true,
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                phoneNumber: true,
                profileImage: true
              }
            },
            payments: {
              orderBy: {
                createdAt: 'desc'
              },
              take: 1
            },
            subscription: true
          },
          orderBy: {
            [selectedSortField]: selectedSortOrder
          },
          skip: (parsedPage - 1) * parsedLimit,
          take: parsedLimit
        })
      ]);

      return {
        statusCode: 200,
        message: 'Admin services retrieved successfully',
        data: services.map((service) => serializeListingMedia(baseUrl, service)),
        meta: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(total / parsedLimit) || 1
        }
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async updateServiceStatus({ id, status, baseUrl }) {
    try {
      await expireServiceListings();

      if (!MODERATABLE_STATUSES.includes(status)) {
        throw createHttpError(400, 'status must be PENDING, APPROVED, or SUSPENDED');
      }

      const existingListing = await prisma.listing.findFirst({
        where: {
          id,
          listingType: 'SERVICE',
          deletedAt: null,
          payments: {
            some: {
              status: 'SUCCESS'
            }
          }
        }
      });

      if (!existingListing) {
        throw createHttpError(404, 'Service not found');
      }

      const listing = await prisma.listing.update({
        where: { id },
        data: status === 'APPROVED'
          ? {
              status,
              publishedAt: new Date(),
              expiresAt: getListingExpiryDate()
            }
          : {
              status
            },
        include: {
          category: true,
          subCategory: true,
          country: true,
          region: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              profileImage: true
            }
          },
          payments: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          subscription: true
        }
      });

      if (status === 'APPROVED') {
        await prisma.subscription.upsert({
          where: {
            listingId: listing.id
          },
          update: {
            planType: listing.subscription?.planType || 'Listing Renewal',
            startDate: listing.publishedAt,
            endDate: listing.expiresAt,
            isActive: true
          },
          create: {
            listingId: listing.id,
            planType: 'Listing Activation',
            startDate: listing.publishedAt,
            endDate: listing.expiresAt,
            isActive: true
          }
        });
      }

      if (status === 'SUSPENDED') {
        await prisma.subscription.updateMany({
          where: {
            listingId: listing.id
          },
          data: {
            isActive: false
          }
        });
      }

      return {
        statusCode: 200,
        message: `Service status updated to ${status}`,
        data: serializeListingMedia(baseUrl, listing)
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async reportServiceSpam({ id, baseUrl }) {
    try {
      const existingListing = await prisma.listing.findFirst({
        where: {
          id,
          listingType: 'SERVICE',
          deletedAt: null
        }
      });

      if (!existingListing) {
        throw createHttpError(404, 'Service not found');
      }

      const listing = await prisma.listing.update({
        where: { id },
        data: {
          spamReports: {
            increment: 1
          }
        },
        include: {
          category: true,
          subCategory: true,
          country: true,
          region: true,
          user: {
            select: {
              id: true,
              fullName: true,
              email: true,
              phoneNumber: true,
              profileImage: true
            }
          },
          payments: {
            orderBy: {
              createdAt: 'desc'
            },
            take: 1
          },
          subscription: true
        }
      });

      return {
        statusCode: 200,
        message: 'Service spam report submitted successfully',
        data: serializeListingMedia(baseUrl, listing)
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async deleteService({ id }) {
    try {
      await expireServiceListings();

      const existingListing = await prisma.listing.findFirst({
        where: {
          id,
          listingType: 'SERVICE',
          deletedAt: null
        }
      });

      if (!existingListing) {
        throw createHttpError(404, 'Service not found');
      }

      await prisma.listing.update({
        where: { id },
        data: {
          deletedAt: new Date()
        }
      });

      return {
        statusCode: 200,
        message: 'Service deleted successfully'
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async createServicePaymentIntent({ listingId, userId, planId, successUrl, cancelUrl, baseUrl }) {
    try {
      await expireServiceListings();

      if (!planId || !successUrl || !cancelUrl) {
        throw createHttpError(400, 'planId, successUrl, and cancelUrl are required');
      }

      let normalizedSuccessUrl;
      let normalizedCancelUrl;

      try {
        normalizedSuccessUrl = normalizeRedirectUrl(successUrl, 'session_id', '{CHECKOUT_SESSION_ID}');
        normalizedCancelUrl = cancelUrl;
        new URL(normalizedCancelUrl);
      } catch {
        throw createHttpError(400, 'successUrl and cancelUrl must be valid absolute URLs');
      }

      const [listing, plan, user, introductoryPlan] = await getServicePurchaseContext(listingId, userId, planId);

      if (!listing) {
        throw createHttpError(404, 'Service listing not found');
      }

      if (!plan) {
        throw createHttpError(404, 'Pricing plan not found');
      }

      if (!user) {
        throw createHttpError(404, 'User not found');
      }

      const isUnderFirstThreeMonths = user.createdAt >= getIntroductoryCutoffDate();
      if (introductoryPlan && plan.id === introductoryPlan.id && !isUnderFirstThreeMonths) {
        throw createHttpError(400, 'You are no longer eligible for the introductory pricing plan');
      }

      const isRenewal = listing.status === 'EXPIRED' || (listing.expiresAt && listing.expiresAt <= new Date());

      if (!isRenewal && listing.payments?.some((payment) => payment.status === 'SUCCESS')) {
        throw createHttpError(409, 'This service listing has already been paid for');
      }

      const publishableKey = getStripePublishableKey();
      if (!publishableKey) {
        throw createHttpError(500, 'STRIPE_PUBLISHABLE_KEY is not configured');
      }

      const stripe = getStripeClient();
      const checkoutSession = await stripe.checkout.sessions.create({
        mode: 'payment',
        success_url: normalizedSuccessUrl,
        cancel_url: normalizedCancelUrl,
        customer_email: listing.user?.email || undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: STRIPE_CURRENCY,
              unit_amount: Math.round(plan.price * 100),
              product_data: {
                name: plan.title,
                description: `${plan.title} for ${listing.title}`
              }
            }
          }
        ],
        metadata: {
          listingId: listing.id,
          planId: plan.id,
          userId,
          listingType: 'SERVICE'
        }
      });

      return {
        statusCode: 200,
        message: 'Stripe checkout session created successfully',
        data: {
          listing: serializeListingMedia(baseUrl, listing),
          selectedPlan: plan,
          isUnderFirstThreeMonths,
          checkoutSessionId: checkoutSession.id,
          checkoutUrl: checkoutSession.url,
          publishableKey,
          amount: plan.price,
          currency: STRIPE_CURRENCY
        }
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async createServiceRenewalCheckoutSession({ listingId, userId, planId, successUrl, cancelUrl, baseUrl }) {
    try {
      await expireServiceListings();

      const listing = await prisma.listing.findFirst({
        where: {
          id: listingId,
          userId,
          listingType: 'SERVICE',
          deletedAt: null
        },
        select: {
          id: true,
          status: true,
          expiresAt: true
        }
      });

      if (!listing) {
        throw createHttpError(404, 'Service listing not found');
      }

      if (!isRenewableListing(listing)) {
        throw createHttpError(400, 'Only expired services can use the renew checkout endpoint');
      }

      return this.createServicePaymentIntent({
        listingId,
        userId,
        planId,
        successUrl,
        cancelUrl,
        baseUrl
      });
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async confirmServiceListingPurchase({ listingId, userId, planId, checkoutSessionId, baseUrl }) {
    try {
      await expireServiceListings();

      if (!planId || !checkoutSessionId) {
        throw createHttpError(400, 'planId and checkoutSessionId are required');
      }

      const [listing, plan, user, introductoryPlan] = await getServicePurchaseContext(listingId, userId, planId);

      if (!listing) {
        throw createHttpError(404, 'Service listing not found');
      }

      if (!plan) {
        throw createHttpError(404, 'Pricing plan not found');
      }

      if (!user) {
        throw createHttpError(404, 'User not found');
      }

      const isUnderFirstThreeMonths = user.createdAt >= getIntroductoryCutoffDate();
      if (introductoryPlan && plan.id === introductoryPlan.id && !isUnderFirstThreeMonths) {
        throw createHttpError(400, 'You are no longer eligible for the introductory pricing plan');
      }

      const stripe = getStripeClient();
      const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId);

      if (checkoutSession.metadata?.listingId !== listing.id || checkoutSession.metadata?.planId !== plan.id || checkoutSession.metadata?.userId !== userId) {
        throw createHttpError(400, 'Checkout session does not match this service listing purchase request');
      }

      if (checkoutSession.payment_status !== 'paid') {
        throw createHttpError(400, 'Stripe checkout payment is not completed yet');
      }

      const isRenewal = listing.status === 'EXPIRED' || (listing.expiresAt && listing.expiresAt <= new Date());
      const renewalPublishedAt = new Date();
      const renewalExpiresAt = getListingExpiryDate(renewalPublishedAt);

      const result = await prisma.$transaction(async (tx) => {
        const existingPayment = await tx.payment.findUnique({
          where: {
            stripeSessionId: checkoutSession.id
          }
        });

        const successfulPaymentForListing = await tx.payment.findFirst({
          where: {
            listingId: listing.id,
            status: 'SUCCESS'
          }
        });

        if (!isRenewal && successfulPaymentForListing && successfulPaymentForListing.stripeSessionId !== checkoutSession.id) {
          throw createHttpError(409, 'This service listing has already been paid for');
        }

        const payment = existingPayment
          ? await tx.payment.update({
              where: {
                stripeSessionId: checkoutSession.id
              },
              data: {
                amount: checkoutSession.amount_total > 0 ? checkoutSession.amount_total / 100 : plan.price,
                status: 'SUCCESS',
                listingId: listing.id,
                userId
              }
            })
          : await tx.payment.create({
              data: {
                stripeSessionId: checkoutSession.id,
                amount: checkoutSession.amount_total > 0 ? checkoutSession.amount_total / 100 : plan.price,
                status: 'SUCCESS',
                listingId: listing.id,
                userId
              }
            });

        const subscription = isRenewal
          ? await tx.subscription.upsert({
              where: {
                listingId: listing.id
              },
              update: {
                planType: plan.title,
                startDate: renewalPublishedAt,
                endDate: renewalExpiresAt,
                isActive: true
              },
              create: {
                listingId: listing.id,
                planType: plan.title,
                startDate: renewalPublishedAt,
                endDate: renewalExpiresAt,
                isActive: true
              }
            })
          : await tx.subscription.updateMany({
              where: {
                listingId: listing.id
              },
              data: {
                isActive: false
              }
            }).then(() => null);

        await tx.listing.update({
          where: {
            id: listing.id
          },
          data: {
            status: isRenewal ? 'APPROVED' : 'PENDING',
            publishedAt: isRenewal ? renewalPublishedAt : listing.publishedAt,
            expiresAt: isRenewal ? renewalExpiresAt : listing.expiresAt
          }
        });

        const refreshedListing = await tx.listing.findUnique({
          where: { id: listing.id },
          include: LISTING_PAYMENT_INCLUDE
        });

        return { payment, subscription, listing: refreshedListing };
      });

      return {
        statusCode: 200,
        message: isRenewal
          ? 'Stripe checkout payment verified successfully and the listing has been renewed'
          : 'Stripe checkout payment verified successfully and the listing is now ready for admin review',
        data: {
          listing: serializeListingMedia(baseUrl, result.listing),
          payment: result.payment,
          subscription: result.subscription,
          selectedPlan: plan,
          isUnderFirstThreeMonths,
          checkoutSessionId: checkoutSession.id,
          paymentStatus: checkoutSession.payment_status
        }
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async confirmServiceRenewal({ listingId, userId, planId, checkoutSessionId, baseUrl }) {
    try {
      await expireServiceListings();

      const listing = await prisma.listing.findFirst({
        where: {
          id: listingId,
          userId,
          listingType: 'SERVICE',
          deletedAt: null
        },
        select: {
          id: true,
          status: true,
          expiresAt: true
        }
      });

      if (!listing) {
        throw createHttpError(404, 'Service listing not found');
      }

      if (!isRenewableListing(listing)) {
        throw createHttpError(400, 'Only expired services can use the renew confirmation endpoint');
      }

      return this.confirmServiceListingPurchase({
        listingId,
        userId,
        planId,
        checkoutSessionId,
        baseUrl
      });
    } catch (error) {
      throw normalizeError(error);
    }
  }
}

export default new ListingService();