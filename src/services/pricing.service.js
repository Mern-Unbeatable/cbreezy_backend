import prisma from '../config/prisma.js';
import { PAYPAL_CURRENCY, getPayPalClientId } from '../config/paypal.js';
import { createHttpError } from '../utils/httpError.js';

// Required default plans that must always exist. Backend will ensure these on startup.
const REQUIRED_PLANS = [
  { title: 'Free Activation', price: 0, duration: 30, tier: 'FREE' },
  { title: 'Intro Pricing', price: 0.99, duration: 90, tier: 'REGULAR' },
  { title: 'Standard Pricing', price: 2.99, duration: 30, tier: 'REGULAR' }
];

const orderPlansByRequired = (plans) => {
  if (!Array.isArray(plans) || !plans.length) return plans;
  const titleIndex = (title) => {
    const idx = REQUIRED_PLANS.findIndex((p) => p.title.toLowerCase() === (title || '').toLowerCase());
    return idx === -1 ? Number.MAX_SAFE_INTEGER : idx;
  };

  // Stable sort: plans that match required titles appear in REQUIRED_PLANS order first
  return [...plans].sort((a, b) => {
    const ia = titleIndex(a.title);
    const ib = titleIndex(b.title);
    if (ia !== ib) return ia - ib;
    // fallback: keep existing order by price then title
    if (a.price !== b.price) return a.price - b.price;
    return a.title.localeCompare(b.title);
  });
};

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

  /**
   * Ensure required default plans exist. Safe to call on startup.
   */
  async ensureRequiredPlansExist() {
    for (const p of REQUIRED_PLANS) {
      const existing = await prisma.pricingPlan.findFirst({
        where: { title: p.title }
      });

      if (!existing) {
        await prisma.pricingPlan.create({
          data: {
            title: p.title,
            price: p.price,
            duration: p.duration,
            tier: p.tier,
            isActive: true
          }
        });
      } else {
        // If exists but tier differs, normalize tier (do not change other fields here)
        if (existing.tier !== p.tier) {
          await prisma.pricingPlan.update({
            where: { id: existing.id },
            data: { tier: p.tier }
          });
        }
      }
    }
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
        paypalClientId: getPayPalClientId(),
        paypalCurrency: PAYPAL_CURRENCY
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
    
    // Order plans so required fixed plans appear in the configured sequence
    const orderedPlans = orderPlansByRequired(decoratedPlans);
    return {
      statusCode: 200,
      message: 'Pricing eligibility retrieved successfully',
      data: {
        userLifecycle: {
          daysSinceRegistration: Math.floor((now.getTime() - userCreatedAt.getTime()) / (1000 * 60 * 60 * 24)),
          freePromoEndsAt,
          discountPromoEndsAt,
          // Boolean preserved for compatibility
          isEligibleForFree,
          // Also expose remaining days
          freeDaysLeft: Math.max(0, Math.ceil((freePromoEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
          discountDaysLeft: Math.max(0, Math.ceil((discountPromoEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
          isEligibleForDiscount,
          // When free period has ended, provide the upcoming promo price and how many days remain for that promo (if applicable)
          nextPromoPrice: (function() {
            const promoPlan = (function() {
              // Prefer the next plan according to REQUIRED_PLANS order (skip FREE)
              const ordered = orderPlansByRequired(plans);
              return ordered.find((p) => p.tier !== 'FREE' && p.price > 0) || null;
            })();
            const freeDays = Math.max(0, Math.ceil((freePromoEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const discountDays = Math.max(0, Math.ceil((discountPromoEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            if (freeDays === 0 && discountDays > 0 && promoPlan) return promoPlan.price;
            return null;
          })(),
          nextPromoDaysLeft: (function() {
            const freeDays = Math.max(0, Math.ceil((freePromoEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            const discountDays = Math.max(0, Math.ceil((discountPromoEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
            if (freeDays === 0 && discountDays > 0) return discountDays;
            return 0;
          })()
        },
        plans: orderedPlans,
        paypalClientId: getPayPalClientId(),
        paypalCurrency: PAYPAL_CURRENCY
      }
    };
  }

  async getPayPalConfig() {
    return {
      statusCode: 200,
      message: 'PayPal configuration retrieved successfully',
      data: {
        clientId: getPayPalClientId(),
        currency: PAYPAL_CURRENCY
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

    // Prevent creating a plan that conflicts with required fixed plans
    if (REQUIRED_PLANS.some((p) => p.title.toLowerCase() === title.trim().toLowerCase())) {
      throw createHttpError(400, 'This plan is reserved and cannot be created');
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

    // If this is a required fixed plan, only allow price and duration updates
    const isRequired = REQUIRED_PLANS.some((p) => p.title.toLowerCase() === existingPlan.title.toLowerCase());

    if (isRequired) {
      if (title !== undefined && title.trim() !== existingPlan.title) {
        throw createHttpError(403, 'Cannot rename required plan');
      }
      if (tier !== undefined && tier !== existingPlan.tier) {
        throw createHttpError(403, 'Cannot change tier of required plan');
      }
      if (isActive !== undefined && typeof isActive === 'boolean' && isActive !== existingPlan.isActive) {
        throw createHttpError(403, 'Cannot change active state of required plan');
      }
    } else {
      if (title !== undefined) {
        if (!title || !title.trim()) {
          throw createHttpError(400, 'title cannot be empty');
        }
        updates.title = title.trim();
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

    // Note: price and duration are handled below and allowed for required plans

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
    // Prevent deletion of required default plans
    const isRequired = REQUIRED_PLANS.some((p) => p.title.toLowerCase() === existingPlan.title.toLowerCase());
    if (isRequired) {
      throw createHttpError(403, 'This plan is required and cannot be deleted');
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