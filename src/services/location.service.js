import prisma from '../config/prisma.js';
import { createHttpError } from '../utils/httpError.js';

class LocationService {
  async createCountry({ name }) {
    if (!name || !name.trim()) {
      throw createHttpError(400, 'Country name is required');
    }

    const normalizedName = name.trim();
    const existingCountry = await prisma.country.findUnique({
      where: { name: normalizedName }
    });

    if (existingCountry) {
      throw createHttpError(409, 'Country already exists');
    }

    const country = await prisma.country.create({
      data: {
        name: normalizedName
      }
    });

    return {
      statusCode: 201,
      message: 'Country created successfully',
      data: country
    };
  }

  async updateCountry(countryId, { name }) {
    if (!name || !name.trim()) {
      throw createHttpError(400, 'Country name is required');
    }

    const existingCountry = await prisma.country.findUnique({
      where: { id: countryId }
    });

    if (!existingCountry) {
      throw createHttpError(404, 'Country not found');
    }

    const normalizedName = name.trim();
    const duplicateCountry = await prisma.country.findFirst({
      where: {
        name: normalizedName,
        NOT: {
          id: countryId
        }
      }
    });

    if (duplicateCountry) {
      throw createHttpError(409, 'Country already exists');
    }

    const country = await prisma.country.update({
      where: { id: countryId },
      data: {
        name: normalizedName
      }
    });

    return {
      statusCode: 200,
      message: 'Country updated successfully',
      data: country
    };
  }

  async deleteCountry(countryId) {
    const existingCountry = await prisma.country.findUnique({
      where: { id: countryId }
    });

    if (!existingCountry) {
      throw createHttpError(404, 'Country not found');
    }

    // Check if any user or listing is associated with this country
    const [userCount, listingCount] = await Promise.all([
      prisma.user.count({
        where: {
          countryId,
          deletedAt: null
        }
      }),
      prisma.listing.count({
        where: {
          countryId,
          deletedAt: null
        }
      })
    ]);

    if (userCount > 0) {
      throw createHttpError(409, 'Cannot delete country with registered users. Please delete users first.');
    }

    if (listingCount > 0) {
      throw createHttpError(409, 'Cannot delete country with active listings.');
    }

    // If no users or listings, delete country (regions will cascade delete automatically)
    await prisma.country.delete({
      where: { id: countryId }
    });

    return {
      statusCode: 200,
      message: 'Country and all its regions deleted successfully'
    };
  }

  async createRegion(countryId, { name }) {
    if (!name || !name.trim()) {
      throw createHttpError(400, 'Region name is required');
    }

    const country = await prisma.country.findUnique({
      where: { id: countryId }
    });

    if (!country) {
      throw createHttpError(404, 'Country not found');
    }

    const normalizedName = name.trim();
    const existingRegion = await prisma.region.findFirst({
      where: {
        countryId,
        name: normalizedName
      }
    });

    if (existingRegion) {
      throw createHttpError(409, 'Region already exists in this country');
    }

    const region = await prisma.region.create({
      data: {
        name: normalizedName,
        countryId
      }
    });

    return {
      statusCode: 201,
      message: 'Region created successfully',
      data: region
    };
  }

  async updateRegion(countryId, regionId, { name }) {
    if (!name || !name.trim()) {
      throw createHttpError(400, 'Region name is required');
    }

    const country = await prisma.country.findUnique({
      where: { id: countryId }
    });

    if (!country) {
      throw createHttpError(404, 'Country not found');
    }

    const existingRegion = await prisma.region.findFirst({
      where: {
        id: regionId,
        countryId
      }
    });

    if (!existingRegion) {
      throw createHttpError(404, 'Region not found in this country');
    }

    const normalizedName = name.trim();
    const duplicateRegion = await prisma.region.findFirst({
      where: {
        countryId,
        name: normalizedName,
        NOT: {
          id: regionId
        }
      }
    });

    if (duplicateRegion) {
      throw createHttpError(409, 'Region already exists in this country');
    }

    const region = await prisma.region.update({
      where: { id: regionId },
      data: {
        name: normalizedName
      }
    });

    return {
      statusCode: 200,
      message: 'Region updated successfully',
      data: region
    };
  }

  async deleteRegion(countryId, regionId) {
    const existingRegion = await prisma.region.findFirst({
      where: {
        id: regionId,
        countryId
      }
    });

    if (!existingRegion) {
      throw createHttpError(404, 'Region not found in this country');
    }

    // Check if any user is registered with this region
    const userCount = await prisma.user.count({
      where: {
        regionId,
        deletedAt: null
      }
    });

    if (userCount > 0) {
      throw createHttpError(409, 'Cannot delete region with registered users. Please delete users first.');
    }

    // Check for listings in this region
    const listingCount = await prisma.listing.count({
      where: {
        regionId,
        deletedAt: null
      }
    });

    if (listingCount > 0) {
      throw createHttpError(409, 'Cannot delete region with active listings.');
    }

    await prisma.region.delete({
      where: { id: regionId }
    });

    return {
      statusCode: 200,
      message: 'Region deleted successfully'
    };
  }

  async getCountries() {
    const countries = await prisma.country.findMany({
      orderBy: {
        name: 'asc'
      }
    });

    return {
      statusCode: 200,
      message: 'Countries retrieved successfully',
      data: countries
    };
  }

  async getRegionsByCountryId(countryId) {
    const country = await prisma.country.findUnique({
      where: { id: countryId }
    });

    if (!country) {
      throw createHttpError(404, 'Country not found');
    }

    const regions = await prisma.region.findMany({
      where: {
        countryId
      },
      orderBy: {
        name: 'asc'
      }
    });

    return {
      statusCode: 200,
      message: 'Regions retrieved successfully',
      data: regions
    };
  }

  // async getCountriesWithRegions() {
  //   const countries = await prisma.country.findMany({
  //     include: {
  //       regions: {
  //         include: {
  //           cities: {
  //             orderBy: {
  //               name: 'asc'
  //             }
  //           }
  //         },
  //         orderBy: {
  //           name: 'asc'
  //         }
  //       }
  //     },
  //     orderBy: {
  //       name: 'asc'
  //     }
  //   });

  //   return {
  //     statusCode: 200,
  //     message: 'Countries with regions and cities retrieved successfully',
  //     data: countries
  //   };
  // }
async getCountriesWithRegions({ q, type } = {}) {
  const query = (q || "").trim();

  const countryNameCond = query ? { name: { contains: query, mode: 'insensitive' } } : undefined;
  const regionNameCond = query ? { name: { contains: query, mode: 'insensitive' } } : undefined;
  const cityNameCond = query ? { name: { contains: query, mode: 'insensitive' } } : undefined;

  let countryWhere = {};
  let regionWhere = undefined;
  let cityWhere = undefined;

  if (query) {
    if (type === 'country') {
      // explicit country search -> include all regions/cities for matched countries
      countryWhere = countryNameCond;
      regionWhere = undefined;
      cityWhere = undefined;
    } else {
      // if any country matches the query, return those countries with full nested data
      const matchingCountries = await prisma.country.findMany({
        where: countryNameCond,
        select: { id: true }
      });

      if (matchingCountries.length > 0) {
        countryWhere = { id: { in: matchingCountries.map(c => c.id) } };
        regionWhere = undefined;
        cityWhere = undefined;
      } else {
        // no direct country match — apply search across all levels (keep nested filters)
        countryWhere = {
          OR: [
            countryNameCond,
            { regions: { some: regionNameCond } },
            { regions: { some: { cities: { some: cityNameCond } } } }
          ]
        };
        regionWhere = {
          OR: [
            regionNameCond,
            { cities: { some: cityNameCond } }
          ]
        };
        // leave cityWhere defined only when searching for cities
        cityWhere = (type === 'city') ? cityNameCond : undefined;
      }
    }
  }

  const countries = await prisma.country.findMany({
    where: countryWhere,
    include: {
      regions: {
        where: regionWhere,
        include: {
          cities: {
            where: cityWhere,
            orderBy: { name: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      }
    },
    orderBy: { name: 'asc' }
  });

  return {
    statusCode: 200,
    message: 'Countries with regions and cities retrieved successfully',
    data: countries
  };
}

  async createCity(regionId, { name }) {
    if (!name || !name.trim()) {
      throw createHttpError(400, 'City name is required');
    }

    const region = await prisma.region.findUnique({
      where: { id: regionId }
    });

    if (!region) {
      throw createHttpError(404, 'Region not found');
    }

    const normalizedName = name.trim();
    const existingCity = await prisma.city.findFirst({
      where: {
        regionId,
        name: normalizedName
      }
    });

    if (existingCity) {
      throw createHttpError(409, 'City already exists in this region');
    }

    const city = await prisma.city.create({
      data: {
        name: normalizedName,
        regionId
      }
    });

    return {
      statusCode: 201,
      message: 'City created successfully',
      data: city
    };
  }

  async updateCity(regionId, cityId, { name }) {
    if (!name || !name.trim()) {
      throw createHttpError(400, 'City name is required');
    }

    const region = await prisma.region.findUnique({
      where: { id: regionId }
    });

    if (!region) {
      throw createHttpError(404, 'Region not found');
    }

    const existingCity = await prisma.city.findFirst({
      where: {
        id: cityId,
        regionId
      }
    });

    if (!existingCity) {
      throw createHttpError(404, 'City not found in this region');
    }

    const normalizedName = name.trim();
    const duplicateCity = await prisma.city.findFirst({
      where: {
        regionId,
        name: normalizedName,
        NOT: {
          id: cityId
        }
      }
    });

    if (duplicateCity) {
      throw createHttpError(409, 'City already exists in this region');
    }

    const city = await prisma.city.update({
      where: { id: cityId },
      data: {
        name: normalizedName
      }
    });

    return {
      statusCode: 200,
      message: 'City updated successfully',
      data: city
    };
  }

  async deleteCity(regionId, cityId) {
    const existingCity = await prisma.city.findFirst({
      where: {
        id: cityId,
        regionId
      }
    });

    if (!existingCity) {
      throw createHttpError(404, 'City not found in this region');
    }

    // Note: If you add user.cityId or listing.cityId fields in the future,
    // add validation here to prevent deletion of cities with active users/listings

    await prisma.city.delete({
      where: { id: cityId }
    });

    return {
      statusCode: 200,
      message: 'City deleted successfully'
    };
  }

  async getCitiesByRegionId(regionId) {
    const region = await prisma.region.findUnique({
      where: { id: regionId }
    });

    if (!region) {
      throw createHttpError(404, 'Region not found');
    }

    const cities = await prisma.city.findMany({
      where: {
        regionId
      },
      orderBy: {
        name: 'asc'
      }
    });

    return {
      statusCode: 200,
      message: 'Cities retrieved successfully',
      data: cities
    };
  }
}

export default new LocationService();