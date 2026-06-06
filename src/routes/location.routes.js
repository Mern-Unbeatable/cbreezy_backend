import express from 'express';
import locationController from '../controllers/location.controller.js';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/countries-with-regions', locationController.getCountriesWithRegions.bind(locationController));
router.get('/countries', locationController.getCountries.bind(locationController));
router.get('/countries/:countryId/regions', locationController.getRegionsByCountryId.bind(locationController));
router.get('/regions/:regionId/cities', locationController.getCitiesByRegionId.bind(locationController));
router.post('/countries', authenticate, authorize('ADMIN'), locationController.createCountry.bind(locationController));
router.put('/countries/:countryId', authenticate, authorize('ADMIN'), locationController.updateCountry.bind(locationController));
router.delete('/countries/:countryId', authenticate, authorize('ADMIN'), locationController.deleteCountry.bind(locationController));
router.post('/countries/:countryId/regions', authenticate, authorize('ADMIN'), locationController.createRegion.bind(locationController));
router.put('/countries/:countryId/regions/:regionId', authenticate, authorize('ADMIN'), locationController.updateRegion.bind(locationController));
router.delete('/countries/:countryId/regions/:regionId', authenticate, authorize('ADMIN'), locationController.deleteRegion.bind(locationController));
router.post('/regions/:regionId/cities', authenticate, authorize('ADMIN'), locationController.createCity.bind(locationController));
router.put('/regions/:regionId/cities/:cityId', authenticate, authorize('ADMIN'), locationController.updateCity.bind(locationController));
router.delete('/regions/:regionId/cities/:cityId', authenticate, authorize('ADMIN'), locationController.deleteCity.bind(locationController));

export default router;