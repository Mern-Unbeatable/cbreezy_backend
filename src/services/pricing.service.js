// import prisma from '../config/prisma.js';
// import { STRIPE_CURRENCY, getStripePublishableKey } from '../config/stripe.js';
// import { createHttpError } from '../utils/httpError.js';

// const INTRODUCTORY_PERIOD_DAYS = 90;

// const getIntroductoryCutoffDate = () => {
//   const date = new Date();
//   date.setDate(date.getDate() - INTRODUCTORY_PERIOD_DAYS);
//   return date;
// };

// const decoratePlans = (plans) => {
//   if (!plans.length) {
//     return [];
//   }

//   const minimumPrice = Math.min(...plans.map((plan) => plan.price));

//   return plans.map((plan) => ({
//     ...plan,
//     isIntroductory: plan.price === minimumPrice
//   }));
// };

// class PricingService {
//   async getActivePricingPlans() {
//     const plans = await prisma.pricingPlan.findMany({
//       where: {
//         isActive: true
//       },
//       orderBy: [
//         { price: 'asc' },
//         { title: 'asc' }
//       ]
//     });

//     const decoratedPlans = decoratePlans(plans);

//     return {
//       statusCode: 200,
//       message: 'Pricing plans retrieved successfully',
//       data: decoratedPlans,
//       meta: {
//         introductoryPlanId: decoratedPlans.find((plan) => plan.isIntroductory)?.id || null,
//         stripePublishableKey: getStripePublishableKey(),
//         stripeCurrency: STRIPE_CURRENCY
//       }
//     };
//   }

//   async getPricingEligibility(userId) {
//     const [user, plans] = await Promise.all([
//       prisma.user.findUnique({
//         where: { id: userId },
//         select: {
//           id: true,
//           createdAt: true
//         }
//       }),
//       prisma.pricingPlan.findMany({
//         where: {
//           isActive: true
//         },
//         orderBy: [
//           { price: 'asc' },
//           { title: 'asc' }
//         ]
//       })
//     ]);

//     if (!user) {
//       throw createHttpError(404, 'User not found');
//     }

//     const decoratedPlans = decoratePlans(plans);
//     const introductoryPlan = decoratedPlans.find((plan) => plan.isIntroductory) || null;
//     const isUnderFirstThreeMonths = user.createdAt >= getIntroductoryCutoffDate();

//     return {
//       statusCode: 200,
//       message: 'Pricing eligibility retrieved successfully',
//       data: {
//         isUnderFirstThreeMonths,
//         introductoryPlanId: introductoryPlan?.id || null,
//         introductoryPlan,
//         plans: decoratedPlans,
//         stripePublishableKey: getStripePublishableKey(),
//         stripeCurrency: STRIPE_CURRENCY
//       }
//     };
//   }

//   async getStripeConfig() {
//     return {
//       statusCode: 200,
//       message: 'Stripe configuration retrieved successfully',
//       data: {
//         publishableKey: getStripePublishableKey(),
//         currency: STRIPE_CURRENCY
//       }
//     };
//   }

//   async createPricingPlan({ title, price, duration, isActive = true }) {
//     if (!title || !title.trim() || price === undefined || duration === undefined) {
//       throw createHttpError(400, 'title, price, and duration are required');
//     }

//     const parsedPrice = Number(price);
//     const parsedDuration = Number(duration);

//     if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
//       throw createHttpError(400, 'price must be a valid positive number');
//     }

//     if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
//       throw createHttpError(400, 'duration must be a positive integer in days');
//     }

//     const plan = await prisma.pricingPlan.create({
//       data: {
//         title: title.trim(),
//         price: parsedPrice,
//         duration: parsedDuration,
//         isActive: Boolean(isActive)
//       }
//     });

//     const activePlans = await prisma.pricingPlan.findMany({
//       where: {
//         isActive: true
//       },
//       orderBy: {
//         price: 'asc'
//       }
//     });

//     const minimumPrice = activePlans[0]?.price ?? null;

//     return {
//       statusCode: 201,
//       message: 'Pricing plan created successfully',
//       data: {
//         ...plan,
//         isIntroductory: plan.isActive && plan.price === minimumPrice
//       }
//     };
//   }

//   async updatePricingPlan(id, { title, price, duration, isActive }) {
//     const existingPlan = await prisma.pricingPlan.findUnique({
//       where: { id }
//     });

//     if (!existingPlan) {
//       throw createHttpError(404, 'Pricing plan not found');
//     }

//     const updates = {};

//     if (title !== undefined) {
//       if (!title || !title.trim()) {
//         throw createHttpError(400, 'title cannot be empty');
//       }
//       updates.title = title.trim();
//     }

//     if (price !== undefined) {
//       const parsedPrice = Number(price);
//       if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
//         throw createHttpError(400, 'price must be a valid positive number');
//       }
//       updates.price = parsedPrice;
//     }

//     if (duration !== undefined) {
//       const parsedDuration = Number(duration);
//       if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
//         throw createHttpError(400, 'duration must be a positive integer in days');
//       }
//       updates.duration = parsedDuration;
//     }

//     if (isActive !== undefined) {
//       updates.isActive = Boolean(isActive);
//     }

//     if (!Object.keys(updates).length) {
//       throw createHttpError(400, 'At least one field is required: title, price, duration, or isActive');
//     }

//     const updatedPlan = await prisma.pricingPlan.update({
//       where: { id },
//       data: updates
//     });

//     const activePlans = await prisma.pricingPlan.findMany({
//       where: {
//         isActive: true
//       },
//       orderBy: {
//         price: 'asc'
//       }
//     });

//     const minimumPrice = activePlans[0]?.price ?? null;

//     return {
//       statusCode: 200,
//       message: 'Pricing plan updated successfully',
//       data: {
//         ...updatedPlan,
//         isIntroductory: updatedPlan.isActive && updatedPlan.price === minimumPrice
//       }
//     };
//   }

//   async deletePricingPlan(id) {
//     const existingPlan = await prisma.pricingPlan.findUnique({
//       where: { id }
//     });

//     if (!existingPlan) {
//       throw createHttpError(404, 'Pricing plan not found');
//     }

//     await prisma.pricingPlan.delete({
//       where: { id }
//     });

//     return {
//       statusCode: 200,
//       message: 'Pricing plan deleted successfully'
//     };
//   }
// }

// export default new PricingService();











import prisma from '../config/prisma.js';
import { STRIPE_CURRENCY, getStripePublishableKey } from '../config/stripe.js';
import { createHttpError } from '../utils/httpError.js';

class PricingService {
  async getSystemSettings() {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });
    
    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 'default', freePeriodDays: 30, promoPeriodDays: 90 }
      });
    }
    
    return settings;
  }

  async updateSystemSettings(data) {
    const updates = {};
    
    if (data.freePeriodDays !== undefined) updates.freePeriodDays = Number(data.freePeriodDays);
    if (data.promoPeriodDays !== undefined) updates.promoPeriodDays = Number(data.promoPeriodDays);

    const settings = await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: updates,
      create: { id: 'default', ...updates }
    });

    return {
      statusCode: 200,
      message: 'System settings updated successfully',
      data: settings
    };
  }

  async getActivePricingPlans() {
    const plans = await prisma.pricingPlan.findMany({
      where: { isActive: true },
      orderBy: [
        { price: 'asc' },
        { title: 'asc' }
      ]
    });

    return {
      statusCode: 200,
      message: 'Pricing plans retrieved successfully',
      data: plans,
      meta: {
        stripePublishableKey: getStripePublishableKey(),
        stripeCurrency: STRIPE_CURRENCY
      }
    };
  }

  async getPricingEligibility(userId) {
    const [user, plans, settings] = await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, createdAt: true }
      }),
      prisma.pricingPlan.findMany({
        where: { isActive: true },
        orderBy: [
          { price: 'asc' },
          { title: 'asc' }
        ]
      }),
      this.getSystemSettings()
    ]);

    if (!user) {
      throw createHttpError(404, 'User not found');
    }

    const userCreatedAt = new Date(user.createdAt);
    const now = new Date();

    const freePromoEndsAt = new Date(userCreatedAt);
    freePromoEndsAt.setDate(freePromoEndsAt.getDate() + settings.freePeriodDays);

    const discountPromoEndsAt = new Date(freePromoEndsAt);
    discountPromoEndsAt.setDate(discountPromoEndsAt.getDate() + settings.promoPeriodDays);

    const isEligibleForFree = now <= freePromoEndsAt;
    const isEligibleForDiscount = now > freePromoEndsAt && now <= discountPromoEndsAt;

    const decoratedPlans = plans.map((plan) => {
      let isLocked = false;
      
      if (plan.tier === 'FREE' && !isEligibleForFree) isLocked = true;
      if (plan.tier === 'PROMO' && !isEligibleForDiscount) isLocked = true;

      return {
        ...plan,
        isLocked
      };
    });

    return {
      statusCode: 200,
      message: 'Pricing eligibility retrieved successfully',
      data: {
        userLifecycle: {
          daysSinceRegistration: Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)),
          freePromoEndsAt,
          discountPromoEndsAt,
          isEligibleForFree,
          isEligibleForDiscount
        },
        plans: decoratedPlans,
        stripePublishableKey: getStripePublishableKey(),
        stripeCurrency: STRIPE_CURRENCY
      }
    };
  }

  async getStripeConfig() {
    return {
      statusCode: 200,
      message: 'Stripe configuration retrieved successfully',
      data: {
        publishableKey: getStripePublishableKey(),
        currency: STRIPE_CURRENCY
      }
    };
  }

  async createPricingPlan({ title, price, duration, tier = 'REGULAR', isActive = true }) {
    if (!title || !title.trim() || price === undefined || duration === undefined) {
      throw createHttpError(400, 'title, price, and duration are required');
    }

    const parsedPrice = Number(price);
    const parsedDuration = Number(duration);

    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      throw createHttpError(400, 'price must be a valid positive number');
    }

    if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
      throw createHttpError(400, 'duration must be a positive integer in days');
    }

    const validTiers = ['FREE', 'PROMO', 'REGULAR'];
    if (!validTiers.includes(tier)) {
      throw createHttpError(400, 'tier must be FREE, PROMO, or REGULAR');
    }

    const plan = await prisma.pricingPlan.create({
      data: {
        title: title.trim(),
        price: parsedPrice,
        duration: parsedDuration,
        tier,
        isActive: Boolean(isActive)
      }
    });

    return {
      statusCode: 201,
      message: 'Pricing plan created successfully',
      data: plan
    };
  }

  async updatePricingPlan(id, { title, price, duration, tier, isActive }) {
    const existingPlan = await prisma.pricingPlan.findUnique({
      where: { id }
    });

    if (!existingPlan) {
      throw createHttpError(404, 'Pricing plan not found');
    }

    const updates = {};

    if (title !== undefined) {
      if (!title || !title.trim()) {
        throw createHttpError(400, 'title cannot be empty');
      }
      updates.title = title.trim();
    }

    if (price !== undefined) {
      const parsedPrice = Number(price);
      if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
        throw createHttpError(400, 'price must be a valid positive number');
      }
      updates.price = parsedPrice;
    }

    if (duration !== undefined) {
      const parsedDuration = Number(duration);
      if (!Number.isInteger(parsedDuration) || parsedDuration <= 0) {
        throw createHttpError(400, 'duration must be a positive integer in days');
      }
      updates.duration = parsedDuration;
    }

    if (tier !== undefined) {
      const validTiers = ['FREE', 'PROMO', 'REGULAR'];
      if (!validTiers.includes(tier)) {
        throw createHttpError(400, 'tier must be FREE, PROMO, or REGULAR');
      }
      updates.tier = tier;
    }

    if (isActive !== undefined) {
      updates.isActive = Boolean(isActive);
    }

    if (!Object.keys(updates).length) {
      throw createHttpError(400, 'At least one field is required to update');
    }

    const updatedPlan = await prisma.pricingPlan.update({
      where: { id },
      data: updates
    });

    return {
      statusCode: 200,
      message: 'Pricing plan updated successfully',
      data: updatedPlan
    };
  }

  async deletePricingPlan(id) {
    const existingPlan = await prisma.pricingPlan.findUnique({
      where: { id }
    });

    if (!existingPlan) {
      throw createHttpError(404, 'Pricing plan not found');
    }

    await prisma.pricingPlan.delete({
      where: { id }
    });

    return {
      statusCode: 200,
      message: 'Pricing plan deleted successfully'
    };
  }
}

export default new PricingService();