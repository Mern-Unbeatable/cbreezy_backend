// import prisma from '../config/prisma.js';
// import { STRIPE_CURRENCY, getStripeClient, getStripePublishableKey } from '../config/stripe.js';
// import { createHttpError } from '../utils/httpError.js';

// const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
// const LISTING_STATUSES = ['PENDING', 'APPROVED', 'SUSPENDED', 'EXPIRED'];
// const MODERATABLE_STATUSES = ['PENDING', 'APPROVED', 'SUSPENDED'];
// const SORTABLE_FIELDS = ['createdAt', 'price', 'title', 'startDate'];
// const PRICE_RANGE_MAP = {
//   all: {},
//   under20: { lte: 20 },
//   from25to100: { gte: 25, lte: 100 },
//   from100to300: { gte: 100, lte: 300 },
//   from300to500: { gte: 300, lte: 500 },
//   from500to1000: { gte: 500, lte: 1000 },
//   from1000to10000: { gte: 1000, lte: 10000 }
// };
// const INTRODUCTORY_PERIOD_DAYS = 90;
// const LISTING_ACTIVE_DAYS = 30;

// const toPublicUploadPath = (filePath) => `/${filePath.split('uploads')[1].replace(/\\/g, '/').replace(/^\//, 'uploads/')}`;

// const toAbsoluteMediaUrl = (baseUrl, mediaPath) => {
//   if (!mediaPath) {
//     return mediaPath;
//   }

//   if (ABSOLUTE_URL_PATTERN.test(mediaPath)) {
//     return mediaPath;
//   }

//   const normalizedPath = mediaPath.startsWith('/') ? mediaPath : `/${mediaPath}`;
//   return `${baseUrl}${normalizedPath}`;
// };

// const serializeEventMedia = (baseUrl, listing) => {
//   if (!listing) {
//     return listing;
//   }

//   const mainImage = toAbsoluteMediaUrl(baseUrl, listing.mainImage);
//   const gallery = Array.isArray(listing.gallery)
//     ? listing.gallery.map((image) => toAbsoluteMediaUrl(baseUrl, image))
//     : [];
//   const eventImages = Array.isArray(listing.serviceImages)
//     ? listing.serviceImages.map((image) => toAbsoluteMediaUrl(baseUrl, image))
//     : [];

//   return {
//     ...listing,
//     categoryName: listing.category?.name || null,
//     subCategoryName: listing.subCategory?.name || null,
//     countryName: listing.country?.name || null,
//     regionName: listing.region?.name || null,
//     cityName: listing.city?.name || null,
//     location: listing.address || null,
//     eventStart: listing.startDate,
//     eventEnd: listing.endDate,
//     eventImage: mainImage,
//     eventImages,
//     eventGallery: gallery,
//     mainImage,
//     serviceImages: eventImages,
//     gallery
//   };
// };

// const normalizeStringArray = (value) => {
//   if (value === undefined || value === null || value === '') {
//     return [];
//   }

//   if (Array.isArray(value)) {
//     return value.filter(Boolean).map((item) => String(item).trim()).filter(Boolean);
//   }

//   if (typeof value === 'string') {
//     const trimmedValue = value.trim();

//     if (!trimmedValue) {
//       return [];
//     }

//     if (trimmedValue.startsWith('[')) {
//       try {
//         const parsedValue = JSON.parse(trimmedValue);
//         return Array.isArray(parsedValue)
//           ? parsedValue.filter(Boolean).map((item) => String(item).trim()).filter(Boolean)
//           : [];
//       } catch {
//         return [trimmedValue];
//       }
//     }

//     return [trimmedValue];
//   }

//   return [];
// };

// const getIntroductoryCutoffDate = () => {
//   const date = new Date();
//   date.setDate(date.getDate() - INTRODUCTORY_PERIOD_DAYS);
//   return date;
// };

// const getListingExpiryDate = (startDate = new Date()) => {
//   const expiryDate = new Date(startDate);
//   expiryDate.setDate(expiryDate.getDate() + LISTING_ACTIVE_DAYS);
//   return expiryDate;
// };

// const getEventExpiryDate = ({ publishedAt = new Date(), endDate } = {}) => {
//   const thirtyDayExpiry = getListingExpiryDate(publishedAt);

//   if (!endDate) {
//     return thirtyDayExpiry;
//   }

//   const parsedEndDate = new Date(endDate);
//   if (Number.isNaN(parsedEndDate.getTime())) {
//     return thirtyDayExpiry;
//   }

//   return parsedEndDate < thirtyDayExpiry ? parsedEndDate : thirtyDayExpiry;
// };

// const isRenewableListing = (listing) => {
//   if (!listing) {
//     return false;
//   }

//   const now = new Date();
//   return Boolean(
//     listing.status === 'EXPIRED'
//     || (listing.expiresAt && listing.expiresAt <= now)
//     || (listing.endDate && listing.endDate <= now)
//   );
// };

// const EVENT_PAYMENT_INCLUDE = {
//   category: true,
//   subCategory: true,
//   country: true,
//   region: true,
//   user: {
//     select: {
//       id: true,
//       fullName: true,
//       email: true,
//       phoneNumber: true,
//       profileImage: true
//     }
//   },
//   payments: {
//     orderBy: {
//       createdAt: 'desc'
//     },
//     take: 1
//   },
//   subscription: true
// };

// const getEventPurchaseContext = (listingId, userId, planId) => Promise.all([
//   prisma.listing.findFirst({
//     where: {
//       id: listingId,
//       userId,
//       listingType: 'EVENT',
//       deletedAt: null
//     },
//     include: EVENT_PAYMENT_INCLUDE
//   }),
//   prisma.pricingPlan.findFirst({
//     where: {
//       id: planId,
//       isActive: true
//     }
//   }),
//   prisma.user.findUnique({
//     where: {
//       id: userId
//     },
//     select: {
//       createdAt: true
//     }
//   }),
//   prisma.pricingPlan.findFirst({
//     where: {
//       isActive: true
//     },
//     orderBy: {
//       price: 'asc'
//     }
//   })
// ]);

// const normalizeRedirectUrl = (url, queryKey, queryValue) => {
//   const parsedUrl = new URL(url);
//   parsedUrl.searchParams.set(queryKey, queryValue);
//   return parsedUrl.toString();
// };

// const expireEventListings = async () => {
//   const now = new Date();

//   const expiredListings = await prisma.listing.findMany({
//     where: {
//       listingType: 'EVENT',
//       deletedAt: null,
//       status: 'APPROVED',
//       OR: [
//         {
//           expiresAt: {
//             lt: now
//           }
//         },
//         {
//           endDate: {
//             lt: now
//           }
//         }
//       ]
//     },
//     select: {
//       id: true
//     }
//   });

//   if (!expiredListings.length) {
//     return;
//   }

//   const listingIds = expiredListings.map((listing) => listing.id);

//   await prisma.$transaction([
//     prisma.listing.updateMany({
//       where: {
//         id: {
//           in: listingIds
//         }
//       },
//       data: {
//         status: 'EXPIRED'
//       }
//     }),
//     prisma.subscription.updateMany({
//       where: {
//         listingId: {
//           in: listingIds
//         }
//       },
//       data: {
//         isActive: false
//       }
//     })
//   ]);
// };

// const parsePriceRange = (priceRange) => {
//   if (!priceRange) {
//     return { filter: null, isValid: true };
//   }

//   const normalizedPriceRange = String(priceRange).trim();

//   if (Object.prototype.hasOwnProperty.call(PRICE_RANGE_MAP, normalizedPriceRange)) {
//     return {
//       filter: PRICE_RANGE_MAP[normalizedPriceRange],
//       isValid: true
//     };
//   }

//   if (/^500(?:\s*(?:\+|plus))?$/i.test(normalizedPriceRange)) {
//     return {
//       filter: { gte: 500 },
//       isValid: true
//     };
//   }

//   const underMatch = /^under(\d+)$/i.exec(normalizedPriceRange);
//   if (underMatch) {
//     return {
//       filter: { lte: Number(underMatch[1]) },
//       isValid: true
//     };
//   }

//   const betweenMatch = /^from(\d+)to(\d+)$/i.exec(normalizedPriceRange);
//   if (betweenMatch) {
//     const minimum = Number(betweenMatch[1]);
//     const maximum = Number(betweenMatch[2]);

//     if (minimum > maximum) {
//       return { filter: null, isValid: false };
//     }

//     return {
//       filter: { gte: minimum, lte: maximum },
//       isValid: true
//     };
//   }

//   return { filter: null, isValid: false };
// };

// const parseDateInput = (value, fieldName) => {
//   const parsedDate = new Date(value);
//   if (Number.isNaN(parsedDate.getTime())) {
//     throw createHttpError(400, `${fieldName} must be a valid date`);
//   }

//   return parsedDate;
// };

// const normalizeError = (error) => {
//   if (error?.status) {
//     return error;
//   }

//   if (error?.statusCode) {
//     error.status = error.statusCode;
//     return error;
//   }

//   if (error?.type?.startsWith('Stripe')) {
//     return createHttpError(error.statusCode || 400, error.message);
//   }

//   if (error?.code === 'P2002') {
//     return createHttpError(409, 'This Stripe payment intent has already been recorded');
//   }

//   if (error?.code === 'P2011') {
//     const constraint = String(error?.meta?.constraint || error?.message || '');
//     if (/cityId/i.test(constraint)) {
//       return createHttpError(400, 'cityId is required');
//     }
//   }

//   return error;
// };

// class EventService {
//   async createEvent({ body, files, userId, baseUrl }) {
//     try {
//       const {
//         title,
//         description,
//         price,
//         categoryId,
//         countryId,
//         regionId,
//         cityId,
//         address,
//         location,
//         contactEmail,
//         contactPhone,
//         email,
//         phone,
//         facebookUrl,
//         instagramUrl,
//         facebook,
//         instagram,
//         mainImage,
//         eventImage,
//         eventImages,
//         gallery,
//         eventGallery,
//         startDate,
//         endDate,
//         eventStart,
//         eventEnd
//       } = body;

//       const normalizedCategoryId = typeof categoryId === 'string' ? categoryId.trim() : categoryId;
//       const normalizedCountryId = typeof countryId === 'string' ? countryId.trim() : countryId;
//       const normalizedRegionId = typeof regionId === 'string' ? regionId.trim() : regionId;
//       const normalizedCityId = typeof cityId === 'string' ? cityId.trim() : cityId;

//       const uploadedEventImages = [
//         ...(files?.eventImages || []),
//         ...(files?.eventImage || []),
//         ...(files?.mainImage || [])
//       ].map((file) => toPublicUploadPath(file.path));

//       const uploadedEventGallery = [
//         ...(files?.eventGallery || []),
//         ...(files?.gallery || [])
//       ].map((file) => toPublicUploadPath(file.path));

//       const bodyEventImages = normalizeStringArray(eventImages);
//       const bodyEventGallery = normalizeStringArray(eventGallery).concat(normalizeStringArray(gallery));
//       const bodyPrimaryImage = mainImage?.trim() || eventImage?.trim() || bodyEventImages[0] || null;
//       const resolvedContactEmail = contactEmail?.trim() || email?.trim() || null;
//       const resolvedContactPhone = contactPhone?.trim() || phone?.trim() || null;
//       const resolvedFacebookUrl = facebookUrl?.trim() || facebook?.trim() || null;
//       const resolvedInstagramUrl = instagramUrl?.trim() || instagram?.trim() || null;
//       const resolvedLocation = address?.trim() || location?.trim() || null;
//       const resolvedStartDateInput = startDate || eventStart;
//       const resolvedEndDateInput = endDate || eventEnd;

//       const normalizedEventImages = uploadedEventImages.length > 0
//         ? uploadedEventImages
//         : bodyEventImages.length > 0
//           ? bodyEventImages
//           : bodyPrimaryImage
//             ? [bodyPrimaryImage]
//             : [];
//       const resolvedMainImage = normalizedEventImages[0] || bodyPrimaryImage;
//       const resolvedGallery = uploadedEventGallery.length > 0 ? uploadedEventGallery : bodyEventGallery;

//       if (!normalizedCityId) {
//         throw createHttpError(400, 'cityId is required');
//       }

//       if (!title || !description || !normalizedCategoryId || !normalizedCountryId || !normalizedRegionId || !resolvedContactEmail || !resolvedContactPhone || !resolvedMainImage || !resolvedStartDateInput || !resolvedEndDateInput) {
//         throw createHttpError(400, 'title, description, categoryId, countryId, regionId, contactEmail, contactPhone, startDate, endDate, and event image are required');
//       }

//       const parsedPrice = price === undefined || price === null || price === '' ? 0 : Number(price);
//       if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
//         throw createHttpError(400, 'price must be a valid positive number');
//       }

//       const parsedStartDate = parseDateInput(resolvedStartDateInput, 'startDate');
//       const parsedEndDate = parseDateInput(resolvedEndDateInput, 'endDate');

//       if (parsedEndDate <= parsedStartDate) {
//         throw createHttpError(400, 'endDate must be later than startDate');
//       }

//       const [category, country] = await Promise.all([
//         prisma.category.findFirst({
//           where: {
//             id: normalizedCategoryId,
//             type: 'EVENT'
//           }
//         }),
//         prisma.country.findUnique({
//           where: { id: normalizedCountryId }
//         })
//       ]);

//       if (!category) {
//         throw createHttpError(400, 'Invalid event category');
//       }

//       if (!country) {
//         throw createHttpError(400, 'Invalid country');
//       }

//       const region = await prisma.region.findFirst({
//         where: {
//           id: normalizedRegionId,
//           countryId: normalizedCountryId
//         }
//       });

//       if (!region) {
//         throw createHttpError(400, 'Invalid region for the selected country');
//       }

//       const city = await prisma.city.findFirst({
//         where: {
//           id: normalizedCityId,
//           regionId: normalizedRegionId
//         }
//       });

//       if (!city) {
//         throw createHttpError(400, 'Invalid city for the selected region');
//       }

//       const listing = await prisma.listing.create({
//         data: {
//           title: title.trim(),
//           description: description.trim(),
//           price: parsedPrice,
//           listingType: 'EVENT',
//           status: 'PENDING',
//           countryId: normalizedCountryId,
//           regionId: normalizedRegionId,
//           cityId: normalizedCityId,
//           address: resolvedLocation,
//           contactEmail: resolvedContactEmail.toLowerCase(),
//           contactPhone: resolvedContactPhone,
//           facebookUrl: resolvedFacebookUrl,
//           instagramUrl: resolvedInstagramUrl,
//           startDate: parsedStartDate,
//           endDate: parsedEndDate,
//           mainImage: resolvedMainImage.trim(),
//           serviceImages: normalizedEventImages,
//           gallery: resolvedGallery,
//           userId,
//           categoryId: normalizedCategoryId,
//           subCategoryId: null
//         },
//         include: {
//           category: true,
//           subCategory: true,
//           country: true,
//           region: true,
//           city: true
//         }
//       });

//       return {
//         statusCode: 201,
//         message: 'Event created successfully and is pending admin approval',
//         data: serializeEventMedia(baseUrl, listing)
//       };
//     } catch (error) {
//       throw normalizeError(error);
//     }
//   }

//   async getPublicEvents({ query, baseUrl }) {
//     try {
//       await expireEventListings();

//       const {
//         categoryId,
//         countryId,
//         regionId,
//         search,
//         cityId,
//         priceRange,
//         minPrice,
//         maxPrice,
//         sortBy = 'createdAt',
//         sortOrder = 'desc',
//         page = '1',
//         limit = '12'
//       } = query;

//       const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
//       const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 100);
//       const parsedMinPrice = minPrice !== undefined ? Number(minPrice) : undefined;
//       const parsedMaxPrice = maxPrice !== undefined ? Number(maxPrice) : undefined;
//       const { filter: selectedPriceRange, isValid: isPriceRangeValid } = parsePriceRange(priceRange);

//       if ((minPrice !== undefined && Number.isNaN(parsedMinPrice)) || (maxPrice !== undefined && Number.isNaN(parsedMaxPrice))) {
//         throw createHttpError(400, 'minPrice and maxPrice must be valid numbers');
//       }

//       if (!isPriceRangeValid) {
//         throw createHttpError(400, 'Invalid priceRange value');
//       }

//       const selectedSortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
//       const selectedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

//       const where = {
//         listingType: 'EVENT',
//         status: 'APPROVED',
//         expiresAt: {
//           gt: new Date()
//         },
//         deletedAt: null,
//         ...(categoryId ? { categoryId } : {}),
//         ...(countryId ? { countryId } : {}),
//         ...(regionId ? { regionId } : {}),
//         ...(cityId ? { cityId } : {}),
//         ...((selectedPriceRange || parsedMinPrice !== undefined || parsedMaxPrice !== undefined)
//           ? {
//               price: {
//                 ...(selectedPriceRange || {}),
//                 ...(parsedMinPrice !== undefined ? { gte: parsedMinPrice } : {}),
//                 ...(parsedMaxPrice !== undefined ? { lte: parsedMaxPrice } : {})
//               }
//             }
//           : {}),
//         ...(search
//           ? {
//               OR: [
//                 {
//                   title: {
//                     contains: search,
//                     mode: 'insensitive'
//                   }
//                 },
//                 {
//                   description: {
//                     contains: search,
//                     mode: 'insensitive'
//                   }
//                 }
//               ]
//             }
//           : {})
//       };

//       const [total, events] = await Promise.all([
//         prisma.listing.count({ where }),
//         prisma.listing.findMany({
//           where,
//           include: {
//               category: true,
//               subCategory: true,
//               country: true,
//               region: true,
//               city: true,
//             user: {
//               select: {
//                 id: true,
//                 fullName: true,
//                 email: true,
//                 phoneNumber: true,
//                 profileImage: true
//               }
//             }
//           },
//           orderBy: {
//             [selectedSortField]: selectedSortOrder
//           },
//           skip: (parsedPage - 1) * parsedLimit,
//           take: parsedLimit
//         })
//       ]);

//       return {
//         statusCode: 200,
//         message: 'Events retrieved successfully',
//         data: events.map((event) => serializeEventMedia(baseUrl, event)),
//         meta: {
//           total,
//           page: parsedPage,
//           limit: parsedLimit,
//           totalPages: Math.ceil(total / parsedLimit) || 1,
//           filters: {
//             categoryId: categoryId || null,
//             countryId: countryId || null,
//             regionId: regionId || null,
//             search: search || null,
//             priceRange: priceRange || null,
//             minPrice: parsedMinPrice ?? null,
//             maxPrice: parsedMaxPrice ?? null,
//             sortBy: selectedSortField,
//             sortOrder: selectedSortOrder
//           }
//         }
//       };
//     } catch (error) {
//       throw normalizeError(error);
//     }
//   }

//   async getEventById({ id, baseUrl }) {
//     try {
//       await expireEventListings();

//       const listing = await prisma.listing.findUnique({
//         where: { id },
//         include: {
//           category: true,
//           subCategory: true,
//           country: true,
//           region: true,
//           city: true,
//           user: {
//             select: {
//               id: true,
//               fullName: true,
//               email: true,
//               phoneNumber: true,
//               profileImage: true
//             }
//           }
//         }
//       });

//       if (!listing || listing.deletedAt || listing.listingType !== 'EVENT' || listing.status !== 'APPROVED' || !listing.expiresAt || listing.expiresAt <= new Date()) {
//         throw createHttpError(404, 'Event not found');
//       }

//       return {
//         statusCode: 200,
//         message: 'Event retrieved successfully',
//         data: serializeEventMedia(baseUrl, listing)
//       };
//     } catch (error) {
//       throw normalizeError(error);
//     }
//   }

//   async getMyEvents({ userId, query = {}, baseUrl }) {
//     try {
//       await expireEventListings();

//       const { status, search, page = '1', limit = '20' } = query;

//       if (status && !LISTING_STATUSES.includes(status)) {
//         throw createHttpError(400, 'Invalid status value');
//       }

//       const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
//       const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

//       const where = {
//         userId,
//         listingType: 'EVENT',
//         deletedAt: null,
//         ...(status ? { status } : {}),
//         ...(search
//           ? {
//               OR: [
//                 {
//                   title: {
//                     contains: search,
//                     mode: 'insensitive'
//                   }
//                 },
//                 {
//                   description: {
//                     contains: search,
//                     mode: 'insensitive'
//                   }
//                 }
//               ]
//             }
//           : {})
//       };

//       const [total, events] = await Promise.all([
//         prisma.listing.count({ where }),
//         prisma.listing.findMany({
//           where,
//           include: {
//             category: true,
//             subCategory: true,
//             country: true,
//             region: true,
//             payments: {
//               orderBy: {
//                 createdAt: 'desc'
//               },
//               take: 1
//             },
//             subscription: true
//           },
//           orderBy: {
//             createdAt: 'desc'
//           },
//           skip: (parsedPage - 1) * parsedLimit,
//           take: parsedLimit
//         })
//       ]);

//       return {
//         statusCode: 200,
//         message: 'Your events retrieved successfully',
//         data: events.map((event) => serializeEventMedia(baseUrl, event)),
//         meta: {
//           total,
//           page: parsedPage,
//           limit: parsedLimit,
//           totalPages: Math.ceil(total / parsedLimit) || 1
//         }
//       };
//     } catch (error) {
//       throw normalizeError(error);
//     }
//   }

//   async updateEvent({ id, userId, body, files, baseUrl }) {
//     try {
//       await expireEventListings();

//       const existingEvent = await prisma.listing.findFirst({
//         where: {
//           id,
//           userId,
//           listingType: 'EVENT',
//           deletedAt: null
//         }
//       });

//       if (!existingEvent) {
//         throw createHttpError(404, 'Event not found or you do not have permission to edit it');
//       }

//       const updateData = {};

//       if (body.title) updateData.title = body.title;
//       if (body.description) updateData.description = body.description;
//       if (body.price) updateData.price = parseFloat(body.price);
//       if (body.contactEmail) updateData.contactEmail = body.contactEmail;
//       if (body.contactPhone) updateData.contactPhone = body.contactPhone;
//       if (body.facebookUrl) updateData.facebookUrl = body.facebookUrl;
//       if (body.instagramUrl) updateData.instagramUrl = body.instagramUrl;
//       if (body.countryId) updateData.countryId = body.countryId;
//       if (body.regionId) updateData.regionId = body.regionId;
//       if (body.cityId) {
//         const targetRegionId = body.regionId || existingEvent.regionId;
//         const foundCity = await prisma.city.findFirst({ where: { id: body.cityId, regionId: targetRegionId } });
//         if (!foundCity) {
//           throw createHttpError(400, 'Invalid city for the selected region');
//         }
//         updateData.cityId = body.cityId;
//       }
//       if (body.address) updateData.address = body.address;
//       if (body.categoryId) updateData.categoryId = body.categoryId;
//       if (body.startDate) updateData.startDate = new Date(body.startDate);
//       if (body.endDate) updateData.endDate = new Date(body.endDate);

//       if (files) {
//         if (files.mainImage && files.mainImage[0]) {
//           updateData.mainImage = toPublicUploadPath(files.mainImage[0].path);
//         }
//         if (files.serviceImages) {
//           updateData.serviceImages = files.serviceImages.map((file) => toPublicUploadPath(file.path));
//         }
//         if (files.gallery) {
//           updateData.gallery = files.gallery.map((file) => toPublicUploadPath(file.path));
//         }
//       }

//       const event = await prisma.listing.update({
//         where: { id },
//         data: updateData,
//         include: {
//           category: true,
//           country: true,
//           region: true,
//           city: true,
//           payments: {
//             orderBy: {
//               createdAt: 'desc'
//             },
//             take: 1
//           },
//           subscription: true
//         }
//       });

//       return {
//         statusCode: 200,
//         message: 'Event updated successfully',
//         data: serializeEventMedia(baseUrl, event)
//       };
//     } catch (error) {
//       throw normalizeError(error);
//     }
//   }

//   async deleteMyEvent({ id, userId }) {
//     try {
//       await expireEventListings();

//       const existingEvent = await prisma.listing.findFirst({
//         where: {
//           id,
//           userId,
//           listingType: 'EVENT',
//           deletedAt: null
//         }
//       });

//       if (!existingEvent) {
//         throw createHttpError(404, 'Event not found or you do not have permission to delete it');
//       }

//       await prisma.listing.update({
//         where: { id },
//         data: {
//           deletedAt: new Date()
//         }
//       });

//       return {
//         statusCode: 200,
//         message: 'Event deleted successfully'
//       };
//     } catch (error) {
//       throw normalizeError(error);
//     }
//   }

//   async getAdminEvents({ query, baseUrl }) {
//     try {
//       await expireEventListings();

//       const {
//         status,
//         categoryId,
//         countryId,
//         regionId,
//         search,
//         sortBy = 'createdAt',
//         sortOrder = 'desc',
//         page = '1',
//         limit = '20'
//       } = query;

//       if (status && !LISTING_STATUSES.includes(status)) {
//         throw createHttpError(400, 'Invalid status value');
//       }

//       const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
//       const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
//       const selectedSortField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : 'createdAt';
//       const selectedSortOrder = sortOrder === 'asc' ? 'asc' : 'desc';

//       const where = {
//         listingType: 'EVENT',
//         deletedAt: null,
//         payments: {
//           some: {
//             status: 'SUCCESS'
//           }
//         },
//         ...(status ? { status } : {}),
//         ...(categoryId ? { categoryId } : {}),
//         ...(countryId ? { countryId } : {}),
//         ...(regionId ? { regionId } : {}),
//         ...(search
//           ? {
//               OR: [
//                 {
//                   title: {
//                     contains: search,
//                     mode: 'insensitive'
//                   }
//                 },
//                 {
//                   description: {
//                     contains: search,
//                     mode: 'insensitive'
//                   }
//                 },
//                 {
//                   user: {
//                     fullName: {
//                       contains: search,
//                       mode: 'insensitive'
//                     }
//                   }
//                 }
//               ]
//             }
//           : {})
//       };

//       const [total, events] = await Promise.all([
//         prisma.listing.count({ where }),
//         prisma.listing.findMany({
//           where,
//           include: {
//             category: true,
//             subCategory: true,
//             country: true,
//             region: true,
//             user: {
//               select: {
//                 id: true,
//                 fullName: true,
//                 email: true,
//                 phoneNumber: true,
//                 profileImage: true
//               }
//             },
//             payments: {
//               orderBy: {
//                 createdAt: 'desc'
//               },
//               take: 1
//             },
//             subscription: true
//           },
//           orderBy: {
//             [selectedSortField]: selectedSortOrder
//           },
//           skip: (parsedPage - 1) * parsedLimit,
//           take: parsedLimit
//         })
//       ]);

//       return {
//         statusCode: 200,
//         message: 'Admin events retrieved successfully',
//         data: events.map((event) => serializeEventMedia(baseUrl, event)),
//         meta: {
//           total,
//           page: parsedPage,
//           limit: parsedLimit,
//           totalPages: Math.ceil(total / parsedLimit) || 1
//         }
//       };
//     } catch (error) {
//       throw normalizeError(error);
//     }
//   }

//   async updateEventStatus({ id, status, baseUrl }) {
//     try {
//       await expireEventListings();

//       if (!MODERATABLE_STATUSES.includes(status)) {
//         throw createHttpError(400, 'status must be PENDING, APPROVED, or SUSPENDED');
//       }

//       const existingListing = await prisma.listing.findFirst({
//         where: {
//           id,
//           listingType: 'EVENT',
//           deletedAt: null,
//           payments: {
//             some: {
//               status: 'SUCCESS'
//             }
//           }
//         }
//       });

//       if (!existingListing) {
//         throw createHttpError(404, 'Event not found');
//       }

//       const approvalPublishedAt = new Date();

//       const listing = await prisma.listing.update({
//         where: { id },
//         data: status === 'APPROVED'
//           ? {
//               status,
//               publishedAt: approvalPublishedAt,
//               expiresAt: getEventExpiryDate({
//                 publishedAt: approvalPublishedAt,
//                 endDate: existingListing.endDate
//               })
//             }
//           : {
//               status
//             },
//         include: {
//           category: true,
//           subCategory: true,
//           country: true,
//           region: true,
//           user: {
//             select: {
//               id: true,
//               fullName: true,
//               email: true,
//               phoneNumber: true,
//               profileImage: true
//             }
//           },
//           payments: {
//             orderBy: {
//               createdAt: 'desc'
//             },
//             take: 1
//           },
//           subscription: true
//         }
//       });

//       if (status === 'APPROVED') {
//         await prisma.subscription.upsert({
//           where: {
//             listingId: listing.id
//           },
//           update: {
//             planType: listing.subscription?.planType || 'Listing Renewal',
//             startDate: listing.publishedAt,
//             endDate: listing.expiresAt,
//             isActive: true
//           },
//           create: {
//             listingId: listing.id,
//             planType: 'Listing Activation',
//             startDate: listing.publishedAt,
//             endDate: listing.expiresAt,
//             isActive: true
//           }
//         });
//       }

//       if (status === 'SUSPENDED') {
//         await prisma.subscription.updateMany({
//           where: {
//             listingId: listing.id
//           },
//           data: {
//             isActive: false
//           }
//         });
//       }

//       return {
//         statusCode: 200,
//         message: `Event status updated to ${status}`,
//         data: serializeEventMedia(baseUrl, listing)
//       };
//     } catch (error) {
//       throw normalizeError(error);
//     }
//   }

//   async reportEventSpam({ id, baseUrl }) {
//     try {
//       const existingListing = await prisma.listing.findFirst({
//         where: {
//           id,
//           listingType: 'EVENT',
//           deletedAt: null
//         }
//       });

//       if (!existingListing) {
//         throw createHttpError(404, 'Event not found');
//       }

//       const listing = await prisma.listing.update({
//         where: { id },
//         data: {
//           spamReports: {
//             increment: 1
//           }
//         },
//         include: {
//           category: true,
//           subCategory: true,
//           country: true,
//           region: true,
//           user: {
//             select: {
//               id: true,
//               fullName: true,
//               email: true,
//               phoneNumber: true,
//               profileImage: true
//             }
//           },
//           payments: {
//             orderBy: {
//               createdAt: 'desc'
//             },
//             take: 1
//           },
//           subscription: true
//         }
//       });

//       return {
//         statusCode: 200,
//         message: 'Event spam report submitted successfully',
//         data: serializeEventMedia(baseUrl, listing)
//       };
//     } catch (error) {
//       throw normalizeError(error);
//     }
//   }

//   async deleteEvent({ id }) {
//     try {
//       await expireEventListings();

//       const existingListing = await prisma.listing.findFirst({
//         where: {
//           id,
//           listingType: 'EVENT',
//           deletedAt: null
//         }
//       });

//       if (!existingListing) {
//         throw createHttpError(404, 'Event not found');
//       }

//       await prisma.listing.update({
//         where: { id },
//         data: {
//           deletedAt: new Date()
//         }
//       });

//       return {
//         statusCode: 200,
//         message: 'Event deleted successfully'
//       };
//     } catch (error) {
//       throw normalizeError(error);
//     }
//   }

//   async createEventPaymentIntent({ listingId, userId, planId, successUrl, cancelUrl, baseUrl }) {
//     try {
//       await expireEventListings();

//       if (!planId || !successUrl || !cancelUrl) {
//         throw createHttpError(400, 'planId, successUrl, and cancelUrl are required');
//       }

//       let normalizedSuccessUrl;
//       let normalizedCancelUrl;

//       try {
//         normalizedSuccessUrl = normalizeRedirectUrl(successUrl, 'session_id', '{CHECKOUT_SESSION_ID}');
//         normalizedCancelUrl = cancelUrl;
//         new URL(normalizedCancelUrl);
//       } catch {
//         throw createHttpError(400, 'successUrl and cancelUrl must be valid absolute URLs');
//       }

//       const [listing, plan, user, introductoryPlan] = await getEventPurchaseContext(listingId, userId, planId);

//       if (!listing) {
//         throw createHttpError(404, 'Event listing not found');
//       }

//       if (!plan) {
//         throw createHttpError(404, 'Pricing plan not found');
//       }

//       if (!user) {
//         throw createHttpError(404, 'User not found');
//       }

//       const isUnderFirstThreeMonths = user.createdAt >= getIntroductoryCutoffDate();
//       if (introductoryPlan && plan.id === introductoryPlan.id && !isUnderFirstThreeMonths) {
//         throw createHttpError(400, 'You are no longer eligible for the introductory pricing plan');
//       }

//       const isRenewal = listing.status === 'EXPIRED' || (listing.expiresAt && listing.expiresAt <= new Date());

//       if (!isRenewal && listing.payments?.some((payment) => payment.status === 'SUCCESS')) {
//         throw createHttpError(409, 'This event listing has already been paid for');
//       }

//       const publishableKey = getStripePublishableKey();
//       if (!publishableKey) {
//         throw createHttpError(500, 'STRIPE_PUBLISHABLE_KEY is not configured');
//       }

//       const stripe = getStripeClient();
//       const checkoutSession = await stripe.checkout.sessions.create({
//         mode: 'payment',
//         success_url: normalizedSuccessUrl,
//         cancel_url: normalizedCancelUrl,
//         customer_email: listing.user?.email || undefined,
//         line_items: [
//           {
//             quantity: 1,
//             price_data: {
//               currency: STRIPE_CURRENCY,
//               unit_amount: Math.round(plan.price * 100),
//               product_data: {
//                 name: plan.title,
//                 description: `${plan.title} for ${listing.title}`
//               }
//             }
//           }
//         ],
//         metadata: {
//           listingId: listing.id,
//           planId: plan.id,
//           userId,
//           listingType: 'EVENT'
//         }
//       });

//       return {
//         statusCode: 200,
//         message: 'Stripe checkout session created successfully',
//         data: {
//           listing: serializeEventMedia(baseUrl, listing),
//           selectedPlan: plan,
//           isUnderFirstThreeMonths,
//           checkoutSessionId: checkoutSession.id,
//           checkoutUrl: checkoutSession.url,
//           publishableKey,
//           amount: plan.price,
//           currency: STRIPE_CURRENCY
//         }
//       };
//     } catch (error) {
//       throw normalizeError(error);
//     }
//   }

//   async createEventRenewalCheckoutSession({ listingId, userId, planId, successUrl, cancelUrl, baseUrl }) {
//     try {
//       await expireEventListings();

//       const listing = await prisma.listing.findFirst({
//         where: {
//           id: listingId,
//           userId,
//           listingType: 'EVENT',
//           deletedAt: null
//         },
//         select: {
//           id: true,
//           status: true,
//           expiresAt: true,
//           endDate: true
//         }
//       });

//       if (!listing) {
//         throw createHttpError(404, 'Event listing not found');
//       }

//       if (!isRenewableListing(listing)) {
//         throw createHttpError(400, 'Only expired events can use the renew checkout endpoint');
//       }

//       return this.createEventPaymentIntent({
//         listingId,
//         userId,
//         planId,
//         successUrl,
//         cancelUrl,
//         baseUrl
//       });
//     } catch (error) {
//       throw normalizeError(error);
//     }
//   }

//   async confirmEventListingPurchase({ listingId, userId, planId, checkoutSessionId, baseUrl }) {
//     try {
//       await expireEventListings();

//       if (!planId || !checkoutSessionId) {
//         throw createHttpError(400, 'planId and checkoutSessionId are required');
//       }

//       const [listing, plan, user, introductoryPlan] = await getEventPurchaseContext(listingId, userId, planId);

//       if (!listing) {
//         throw createHttpError(404, 'Event listing not found');
//       }

//       if (!plan) {
//         throw createHttpError(404, 'Pricing plan not found');
//       }

//       if (!user) {
//         throw createHttpError(404, 'User not found');
//       }

//       const isUnderFirstThreeMonths = user.createdAt >= getIntroductoryCutoffDate();
//       if (introductoryPlan && plan.id === introductoryPlan.id && !isUnderFirstThreeMonths) {
//         throw createHttpError(400, 'You are no longer eligible for the introductory pricing plan');
//       }

//       const stripe = getStripeClient();
//       const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId);

//       if (checkoutSession.metadata?.listingId !== listing.id || checkoutSession.metadata?.planId !== plan.id || checkoutSession.metadata?.userId !== userId) {
//         throw createHttpError(400, 'Checkout session does not match this event listing purchase request');
//       }

//       if (checkoutSession.payment_status !== 'paid') {
//         throw createHttpError(400, 'Stripe checkout payment is not completed yet');
//       }

//       const isRenewal = listing.status === 'EXPIRED' || (listing.expiresAt && listing.expiresAt <= new Date());
//       const renewalPublishedAt = new Date();
//       const renewalCycleEndAt = getListingExpiryDate(renewalPublishedAt);

//       const result = await prisma.$transaction(async (tx) => {
//         const existingPayment = await tx.payment.findUnique({
//           where: {
//             stripeSessionId: checkoutSession.id
//           }
//         });

//         const successfulPaymentForListing = await tx.payment.findFirst({
//           where: {
//             listingId: listing.id,
//             status: 'SUCCESS'
//           }
//         });

//         if (!isRenewal && successfulPaymentForListing && successfulPaymentForListing.stripeSessionId !== checkoutSession.id) {
//           throw createHttpError(409, 'This event listing has already been paid for');
//         }

//         const payment = existingPayment
//           ? await tx.payment.update({
//               where: {
//                 stripeSessionId: checkoutSession.id
//               },
//               data: {
//                 amount: checkoutSession.amount_total > 0 ? checkoutSession.amount_total / 100 : plan.price,
//                 status: 'SUCCESS',
//                 listingId: listing.id,
//                 userId
//               }
//             })
//           : await tx.payment.create({
//               data: {
//                 stripeSessionId: checkoutSession.id,
//                 amount: checkoutSession.amount_total > 0 ? checkoutSession.amount_total / 100 : plan.price,
//                 status: 'SUCCESS',
//                 listingId: listing.id,
//                 userId
//               }
//             });

//         const subscription = isRenewal
//           ? await tx.subscription.upsert({
//               where: {
//                 listingId: listing.id
//               },
//               update: {
//                 planType: plan.title,
//                 startDate: renewalPublishedAt,
//                 endDate: renewalCycleEndAt,
//                 isActive: true
//               },
//               create: {
//                 listingId: listing.id,
//                 planType: plan.title,
//                 startDate: renewalPublishedAt,
//                 endDate: renewalCycleEndAt,
//                 isActive: true
//               }
//             })
//           : await tx.subscription.updateMany({
//               where: {
//                 listingId: listing.id
//               },
//               data: {
//                 isActive: false
//               }
//             }).then(() => null);

//         await tx.listing.update({
//           where: {
//             id: listing.id
//           },
//           data: {
//             status: isRenewal ? 'APPROVED' : 'PENDING',
//             publishedAt: isRenewal ? renewalPublishedAt : listing.publishedAt,
//             expiresAt: isRenewal ? renewalCycleEndAt : listing.expiresAt,
//             endDate: isRenewal ? null : listing.endDate
//           }
//         });

//         const refreshedListing = await tx.listing.findUnique({
//           where: { id: listing.id },
//           include: EVENT_PAYMENT_INCLUDE
//         });

//         return { payment, subscription, listing: refreshedListing };
//       });

//       return {
//         statusCode: 200,
//         message: isRenewal
//           ? 'Stripe checkout payment verified successfully and the event has been renewed'
//           : 'Stripe checkout payment verified successfully and the event is now ready for admin review',
//         data: {
//           listing: serializeEventMedia(baseUrl, result.listing),
//           payment: result.payment,
//           subscription: result.subscription,
//           selectedPlan: plan,
//           isUnderFirstThreeMonths,
//           checkoutSessionId: checkoutSession.id,
//           paymentStatus: checkoutSession.payment_status
//         }
//       };
//     } catch (error) {
//       throw normalizeError(error);
//     }
//   }

//   async confirmEventRenewal({ listingId, userId, planId, checkoutSessionId, baseUrl }) {
//     try {
//       await expireEventListings();

//       const listing = await prisma.listing.findFirst({
//         where: {
//           id: listingId,
//           userId,
//           listingType: 'EVENT',
//           deletedAt: null
//         },
//         select: {
//           id: true,
//           status: true,
//           expiresAt: true,
//           endDate: true
//         }
//       });

//       if (!listing) {
//         throw createHttpError(404, 'Event listing not found');
//       }

//       if (!isRenewableListing(listing)) {
//         throw createHttpError(400, 'Only expired events can use the renew confirmation endpoint');
//       }

//       return this.confirmEventListingPurchase({
//         listingId,
//         userId,
//         planId,
//         checkoutSessionId,
//         baseUrl
//       });
//     } catch (error) {
//       throw normalizeError(error);
//     }
//   }
// }

// export default new EventService();




import prisma from '../config/prisma.js';
import { STRIPE_CURRENCY, getStripeClient, getStripePublishableKey } from '../config/stripe.js';
import { createHttpError } from '../utils/httpError.js';

const ABSOLUTE_URL_PATTERN = /^https?:\/\//i;
const LISTING_STATUSES = ['PENDING', 'APPROVED', 'SUSPENDED', 'EXPIRED'];
const MODERATABLE_STATUSES = ['PENDING', 'APPROVED', 'SUSPENDED'];
const SORTABLE_FIELDS = ['createdAt', 'price', 'title', 'startDate'];
const PRICE_RANGE_MAP = {
  all: {},
  under20: { lte: 20 },
  from25to100: { gte: 25, lte: 100 },
  from100to300: { gte: 100, lte: 300 },
  from300to500: { gte: 300, lte: 500 },
  from500to1000: { gte: 500, lte: 1000 },
  from1000to10000: { gte: 1000, lte: 10000 }
};

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

const serializeEventMedia = (baseUrl, listing) => {
  if (!listing) {
    return listing;
  }

  const mainImage = toAbsoluteMediaUrl(baseUrl, listing.mainImage);
  const gallery = Array.isArray(listing.gallery)
    ? listing.gallery.map((image) => toAbsoluteMediaUrl(baseUrl, image))
    : [];
  const eventImages = Array.isArray(listing.serviceImages)
    ? listing.serviceImages.map((image) => toAbsoluteMediaUrl(baseUrl, image))
    : [];

  return {
    ...listing,
    categoryName: listing.category?.name || null,
    subCategoryName: listing.subCategory?.name || null,
    countryName: listing.country?.name || null,
    regionName: listing.region?.name || null,
    cityName: listing.city?.name || null,
    location: listing.address || null,
    eventStart: listing.startDate,
    eventEnd: listing.endDate,
    eventImage: mainImage,
    eventImages,
    eventGallery: gallery,
    mainImage,
    serviceImages: eventImages,
    gallery
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

const getListingExpiryDate = (startDate = new Date()) => {
  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + LISTING_ACTIVE_DAYS);
  return expiryDate;
};

const getEventExpiryDate = ({ publishedAt = new Date(), endDate } = {}) => {
  const thirtyDayExpiry = getListingExpiryDate(publishedAt);

  if (!endDate) {
    return thirtyDayExpiry;
  }

  const parsedEndDate = new Date(endDate);
  if (Number.isNaN(parsedEndDate.getTime())) {
    return thirtyDayExpiry;
  }

  return parsedEndDate < thirtyDayExpiry ? parsedEndDate : thirtyDayExpiry;
};

const isRenewableListing = (listing) => {
  if (!listing) {
    return false;
  }

  const now = new Date();
  return Boolean(
    listing.status === 'EXPIRED'
    || (listing.expiresAt && listing.expiresAt <= now)
    || (listing.endDate && listing.endDate <= now)
  );
};

const EVENT_PAYMENT_INCLUDE = {
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

const getEventPurchaseContext = (listingId, userId, planId) => Promise.all([
  prisma.listing.findFirst({
    where: {
      id: listingId,
      userId,
      listingType: 'EVENT',
      deletedAt: null
    },
    include: EVENT_PAYMENT_INCLUDE
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
  prisma.systemSettings.findUnique({
    where: { id: 'default' }
  })
]);

const normalizeRedirectUrl = (url, queryKey, queryValue) => {
  const parsedUrl = new URL(url);
  parsedUrl.searchParams.set(queryKey, queryValue);
  return parsedUrl.toString();
};

const expireEventListings = async () => {
  const now = new Date();

  const expiredListings = await prisma.listing.findMany({
    where: {
      listingType: 'EVENT',
      deletedAt: null,
      status: 'APPROVED',
      OR: [
        {
          expiresAt: {
            lt: now
          }
        },
        {
          endDate: {
            lt: now
          }
        }
      ]
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

const parseDateInput = (value, fieldName) => {
  const parsedDate = new Date(value);
  if (Number.isNaN(parsedDate.getTime())) {
    throw createHttpError(400, `${fieldName} must be a valid date`);
  }

  return parsedDate;
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

class EventService {
  async createEvent({ body, files, userId, baseUrl }) {
    try {
      const {
        title,
        description,
        price,
        categoryId,
        countryId,
        regionId,
        cityId,
        address,
        location,
        contactEmail,
        contactPhone,
        email,
        phone,
        facebookUrl,
        instagramUrl,
        facebook,
        instagram,
        mainImage,
        eventImage,
        eventImages,
        gallery,
        eventGallery,
        startDate,
        endDate,
        eventStart,
        eventEnd
      } = body;

      const normalizedCategoryId = typeof categoryId === 'string' ? categoryId.trim() : categoryId;
      const normalizedCountryId = typeof countryId === 'string' ? countryId.trim() : countryId;
      const normalizedRegionId = typeof regionId === 'string' ? regionId.trim() : regionId;
      const normalizedCityId = typeof cityId === 'string' ? cityId.trim() : cityId;

      const uploadedEventImages = [
        ...(files?.eventImages || []),
        ...(files?.eventImage || []),
        ...(files?.mainImage || [])
      ].map((file) => toPublicUploadPath(file.path));

      const uploadedEventGallery = [
        ...(files?.eventGallery || []),
        ...(files?.gallery || [])
      ].map((file) => toPublicUploadPath(file.path));

      const bodyEventImages = normalizeStringArray(eventImages);
      const bodyEventGallery = normalizeStringArray(eventGallery).concat(normalizeStringArray(gallery));
      const bodyPrimaryImage = mainImage?.trim() || eventImage?.trim() || bodyEventImages[0] || null;
      const resolvedContactEmail = contactEmail?.trim() || email?.trim() || null;
      const resolvedContactPhone = contactPhone?.trim() || phone?.trim() || null;
      const resolvedFacebookUrl = facebookUrl?.trim() || facebook?.trim() || null;
      const resolvedInstagramUrl = instagramUrl?.trim() || instagram?.trim() || null;
      const resolvedLocation = address?.trim() || location?.trim() || null;
      const resolvedStartDateInput = startDate || eventStart;
      const resolvedEndDateInput = endDate || eventEnd;

      const normalizedEventImages = uploadedEventImages.length > 0
        ? uploadedEventImages
        : bodyEventImages.length > 0
          ? bodyEventImages
          : bodyPrimaryImage
            ? [bodyPrimaryImage]
            : [];
      const resolvedMainImage = normalizedEventImages[0] || bodyPrimaryImage;
      const resolvedGallery = uploadedEventGallery.length > 0 ? uploadedEventGallery : bodyEventGallery;

      if (!normalizedCityId) {
        throw createHttpError(400, 'cityId is required');
      }

      if (!title || !description || !normalizedCategoryId || !normalizedCountryId || !normalizedRegionId || !resolvedContactEmail || !resolvedContactPhone || !resolvedMainImage || !resolvedStartDateInput || !resolvedEndDateInput) {
        throw createHttpError(400, 'title, description, categoryId, countryId, regionId, contactEmail, contactPhone, startDate, endDate, and event image are required');
      }

      const parsedPrice = price === undefined || price === null || price === '' ? 0 : Number(price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        throw createHttpError(400, 'price must be a valid positive number');
      }

      const parsedStartDate = parseDateInput(resolvedStartDateInput, 'startDate');
      const parsedEndDate = parseDateInput(resolvedEndDateInput, 'endDate');

      if (parsedEndDate <= parsedStartDate) {
        throw createHttpError(400, 'endDate must be later than startDate');
      }

      const [category, country] = await Promise.all([
        prisma.category.findFirst({
          where: {
            id: normalizedCategoryId,
            type: 'EVENT'
          }
        }),
        prisma.country.findUnique({
          where: { id: normalizedCountryId }
        })
      ]);

      if (!category) {
        throw createHttpError(400, 'Invalid event category');
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

      const listing = await prisma.listing.create({
        data: {
          title: title.trim(),
          description: description.trim(),
          price: parsedPrice,
          listingType: 'EVENT',
          status: 'PENDING',
          countryId: normalizedCountryId,
          regionId: normalizedRegionId,
          cityId: normalizedCityId,
          address: resolvedLocation,
          contactEmail: resolvedContactEmail.toLowerCase(),
          contactPhone: resolvedContactPhone,
          facebookUrl: resolvedFacebookUrl,
          instagramUrl: resolvedInstagramUrl,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          mainImage: resolvedMainImage.trim(),
          serviceImages: normalizedEventImages,
          gallery: resolvedGallery,
          userId,
          categoryId: normalizedCategoryId,
          subCategoryId: null
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
        message: 'Event created successfully and is pending admin approval',
        data: serializeEventMedia(baseUrl, listing)
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getPublicEvents({ query, baseUrl }) {
    try {
      await expireEventListings();

      const {
        categoryId,
        countryId,
        regionId,
        search,
        cityId,
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
        listingType: 'EVENT',
        status: 'APPROVED',
        expiresAt: {
          gt: new Date()
        },
        deletedAt: null,
        ...(categoryId ? { categoryId } : {}),
        ...(countryId ? { countryId } : {}),
        ...(regionId ? { regionId } : {}),
        ...(cityId ? { cityId } : {}),
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

      const [total, events] = await Promise.all([
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
        message: 'Events retrieved successfully',
        data: events.map((event) => serializeEventMedia(baseUrl, event)),
        meta: {
          total,
          page: parsedPage,
          limit: parsedLimit,
          totalPages: Math.ceil(total / parsedLimit) || 1,
          filters: {
            categoryId: categoryId || null,
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

  async getEventById({ id, baseUrl }) {
    try {
      await expireEventListings();

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

      if (!listing || listing.deletedAt || listing.listingType !== 'EVENT' || listing.status !== 'APPROVED' || !listing.expiresAt || listing.expiresAt <= new Date()) {
        throw createHttpError(404, 'Event not found');
      }

      return {
        statusCode: 200,
        message: 'Event retrieved successfully',
        data: serializeEventMedia(baseUrl, listing)
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getMyEvents({ userId, query = {}, baseUrl }) {
    try {
      await expireEventListings();

      const { status, search, page = '1', limit = '20' } = query;

      if (status && !LISTING_STATUSES.includes(status)) {
        throw createHttpError(400, 'Invalid status value');
      }

      const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
      const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

      const where = {
        userId,
        listingType: 'EVENT',
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

      const [total, events] = await Promise.all([
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
        message: 'Your events retrieved successfully',
        data: events.map((event) => serializeEventMedia(baseUrl, event)),
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

  async updateEvent({ id, userId, body, files, baseUrl }) {
    try {
      await expireEventListings();

      const existingEvent = await prisma.listing.findFirst({
        where: {
          id,
          userId,
          listingType: 'EVENT',
          deletedAt: null
        }
      });

      if (!existingEvent) {
        throw createHttpError(404, 'Event not found or you do not have permission to edit it');
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
        const targetRegionId = body.regionId || existingEvent.regionId;
        const foundCity = await prisma.city.findFirst({ where: { id: body.cityId, regionId: targetRegionId } });
        if (!foundCity) {
          throw createHttpError(400, 'Invalid city for the selected region');
        }
        updateData.cityId = body.cityId;
      }
      if (body.address) updateData.address = body.address;
      if (body.categoryId) updateData.categoryId = body.categoryId;
      if (body.startDate) updateData.startDate = new Date(body.startDate);
      if (body.endDate) updateData.endDate = new Date(body.endDate);

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

      const event = await prisma.listing.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          country: true,
          region: true,
          city: true,
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
        message: 'Event updated successfully',
        data: serializeEventMedia(baseUrl, event)
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async deleteMyEvent({ id, userId }) {
    try {
      await expireEventListings();

      const existingEvent = await prisma.listing.findFirst({
        where: {
          id,
          userId,
          listingType: 'EVENT',
          deletedAt: null
        }
      });

      if (!existingEvent) {
        throw createHttpError(404, 'Event not found or you do not have permission to delete it');
      }

      await prisma.listing.update({
        where: { id },
        data: {
          deletedAt: new Date()
        }
      });

      return {
        statusCode: 200,
        message: 'Event deleted successfully'
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async getAdminEvents({ query, baseUrl }) {
    try {
      await expireEventListings();

      const {
        status,
        categoryId,
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
        listingType: 'EVENT',
        deletedAt: null,
        payments: {
          some: {
            status: 'SUCCESS'
          }
        },
        ...(status ? { status } : {}),
        ...(categoryId ? { categoryId } : {}),
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

      const [total, events] = await Promise.all([
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
        message: 'Admin events retrieved successfully',
        data: events.map((event) => serializeEventMedia(baseUrl, event)),
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

  async updateEventStatus({ id, status, baseUrl }) {
    try {
      await expireEventListings();

      if (!MODERATABLE_STATUSES.includes(status)) {
        throw createHttpError(400, 'status must be PENDING, APPROVED, or SUSPENDED');
      }

      const existingListing = await prisma.listing.findFirst({
        where: {
          id,
          listingType: 'EVENT',
          deletedAt: null,
          payments: {
            some: {
              status: 'SUCCESS'
            }
          }
        }
      });

      if (!existingListing) {
        throw createHttpError(404, 'Event not found');
      }

      const approvalPublishedAt = new Date();

      const listing = await prisma.listing.update({
        where: { id },
        data: status === 'APPROVED'
          ? {
              status,
              publishedAt: approvalPublishedAt,
              expiresAt: getEventExpiryDate({
                publishedAt: approvalPublishedAt,
                endDate: existingListing.endDate
              })
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
        message: `Event status updated to ${status}`,
        data: serializeEventMedia(baseUrl, listing)
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async reportEventSpam({ id, baseUrl }) {
    try {
      const existingListing = await prisma.listing.findFirst({
        where: {
          id,
          listingType: 'EVENT',
          deletedAt: null
        }
      });

      if (!existingListing) {
        throw createHttpError(404, 'Event not found');
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
        message: 'Event spam report submitted successfully',
        data: serializeEventMedia(baseUrl, listing)
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async deleteEvent({ id }) {
    try {
      await expireEventListings();

      const existingListing = await prisma.listing.findFirst({
        where: {
          id,
          listingType: 'EVENT',
          deletedAt: null
        }
      });

      if (!existingListing) {
        throw createHttpError(404, 'Event not found');
      }

      await prisma.listing.update({
        where: { id },
        data: {
          deletedAt: new Date()
        }
      });

      return {
        statusCode: 200,
        message: 'Event deleted successfully'
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async createEventPaymentIntent({ listingId, userId, planId, successUrl, cancelUrl, baseUrl }) {
    try {
      await expireEventListings();

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

      const [listing, plan, user, settings] = await getEventPurchaseContext(listingId, userId, planId);

      if (!listing) {
        throw createHttpError(404, 'Event listing not found');
      }
      if (!plan) {
        throw createHttpError(404, 'Pricing plan not found');
      }
      if (!user) {
        throw createHttpError(404, 'User not found');
      }

      const userCreatedAt = new Date(user.createdAt);
      const now = new Date();

      const freePromoEndsAt = new Date(userCreatedAt);
      freePromoEndsAt.setDate(freePromoEndsAt.getDate() + (settings?.freePeriodDays || 30));

      const discountPromoEndsAt = new Date(freePromoEndsAt);
      discountPromoEndsAt.setDate(discountPromoEndsAt.getDate() + (settings?.promoPeriodDays || 90));

      const isEligibleForFree = now <= freePromoEndsAt;
      const isEligibleForDiscount = now > freePromoEndsAt && now <= discountPromoEndsAt;

      if (plan.tier === 'FREE' && !isEligibleForFree) {
        throw createHttpError(400, 'You are no longer eligible for the free pricing plan');
      }

      if (plan.tier === 'PROMO' && !isEligibleForDiscount) {
        throw createHttpError(400, 'You are no longer eligible for the promo pricing plan');
      }

      const isUnderFirstThreeMonths = isEligibleForDiscount || isEligibleForFree; 

      const isRenewal = listing.status === 'EXPIRED' || (listing.expiresAt && listing.expiresAt <= new Date());

      if (!isRenewal && listing.payments?.some((payment) => payment.status === 'SUCCESS')) {
        throw createHttpError(409, 'This event listing has already been paid for');
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
          listingType: 'EVENT'
        }
      });

      return {
        statusCode: 200,
        message: 'Stripe checkout session created successfully',
        data: {
          listing: serializeEventMedia(baseUrl, listing),
          selectedPlan: plan,
          isUnderFirstThreeMonths,
          isEligibleForFree,
          isEligibleForDiscount,
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

  async createEventRenewalCheckoutSession({ listingId, userId, planId, successUrl, cancelUrl, baseUrl }) {
    try {
      await expireEventListings();

      const listing = await prisma.listing.findFirst({
        where: {
          id: listingId,
          userId,
          listingType: 'EVENT',
          deletedAt: null
        },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          endDate: true
        }
      });

      if (!listing) {
        throw createHttpError(404, 'Event listing not found');
      }

      if (!isRenewableListing(listing)) {
        throw createHttpError(400, 'Only expired events can use the renew checkout endpoint');
      }

      return this.createEventPaymentIntent({
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

  async confirmEventListingPurchase({ listingId, userId, planId, checkoutSessionId, baseUrl }) {
    try {
      await expireEventListings();

      if (!planId || !checkoutSessionId) {
        throw createHttpError(400, 'planId and checkoutSessionId are required');
      }

      const [listing, plan, user, settings] = await getEventPurchaseContext(listingId, userId, planId);

      if (!listing) {
        throw createHttpError(404, 'Event listing not found');
      }
      if (!plan) {
        throw createHttpError(404, 'Pricing plan not found');
      }
      if (!user) {
        throw createHttpError(404, 'User not found');
      }

      const userCreatedAt = new Date(user.createdAt);
      const now = new Date();

      const freePromoEndsAt = new Date(userCreatedAt);
      freePromoEndsAt.setDate(freePromoEndsAt.getDate() + (settings?.freePeriodDays || 30));

      const discountPromoEndsAt = new Date(freePromoEndsAt);
      discountPromoEndsAt.setDate(discountPromoEndsAt.getDate() + (settings?.promoPeriodDays || 90));

      const isEligibleForFree = now <= freePromoEndsAt;
      const isEligibleForDiscount = now > freePromoEndsAt && now <= discountPromoEndsAt;

      if (plan.tier === 'FREE' && !isEligibleForFree) {
        throw createHttpError(400, 'You are no longer eligible for the free pricing plan');
      }

      if (plan.tier === 'PROMO' && !isEligibleForDiscount) {
        throw createHttpError(400, 'You are no longer eligible for the promo pricing plan');
      }

      const isUnderFirstThreeMonths = isEligibleForDiscount || isEligibleForFree; 

      const stripe = getStripeClient();
      const checkoutSession = await stripe.checkout.sessions.retrieve(checkoutSessionId);

      if (checkoutSession.metadata?.listingId !== listing.id || checkoutSession.metadata?.planId !== plan.id || checkoutSession.metadata?.userId !== userId) {
        throw createHttpError(400, 'Checkout session does not match this event listing purchase request');
      }

      if (checkoutSession.payment_status !== 'paid') {
        throw createHttpError(400, 'Stripe checkout payment is not completed yet');
      }

      const isRenewal = listing.status === 'EXPIRED' || (listing.expiresAt && listing.expiresAt <= new Date());
      const renewalPublishedAt = new Date();
      const renewalCycleEndAt = getListingExpiryDate(renewalPublishedAt);

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
          throw createHttpError(409, 'This event listing has already been paid for');
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
                endDate: renewalCycleEndAt,
                isActive: true
              },
              create: {
                listingId: listing.id,
                planType: plan.title,
                startDate: renewalPublishedAt,
                endDate: renewalCycleEndAt,
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
            expiresAt: isRenewal ? renewalCycleEndAt : listing.expiresAt,
            endDate: isRenewal ? null : listing.endDate
          }
        });

        const refreshedListing = await tx.listing.findUnique({
          where: { id: listing.id },
          include: EVENT_PAYMENT_INCLUDE
        });

        return { payment, subscription, listing: refreshedListing };
      });

      return {
        statusCode: 200,
        message: isRenewal
          ? 'Stripe checkout payment verified successfully and the event has been renewed'
          : 'Stripe checkout payment verified successfully and the event is now ready for admin review',
        data: {
          listing: serializeEventMedia(baseUrl, result.listing),
          payment: result.payment,
          subscription: result.subscription,
          selectedPlan: plan,
          isUnderFirstThreeMonths,
          isEligibleForFree,
          isEligibleForDiscount,
          checkoutSessionId: checkoutSession.id,
          paymentStatus: checkoutSession.payment_status
        }
      };
    } catch (error) {
      throw normalizeError(error);
    }
  }

  async confirmEventRenewal({ listingId, userId, planId, checkoutSessionId, baseUrl }) {
    try {
      await expireEventListings();

      const listing = await prisma.listing.findFirst({
        where: {
          id: listingId,
          userId,
          listingType: 'EVENT',
          deletedAt: null
        },
        select: {
          id: true,
          status: true,
          expiresAt: true,
          endDate: true
        }
      });

      if (!listing) {
        throw createHttpError(404, 'Event listing not found');
      }

      if (!isRenewableListing(listing)) {
        throw createHttpError(400, 'Only expired events can use the renew confirmation endpoint');
      }

      return this.confirmEventListingPurchase({
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

export default new EventService();