import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import 'dotenv/config';

export const PAYPAL_CURRENCY = (process.env.PAYPAL_CURRENCY || 'usd').toUpperCase();

let paypalClient;
let cachedClientKey = '';

export const getPayPalClient = () => {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    const error = new Error('PayPal credentials are not configured');
    error.statusCode = 500;
    throw error;
  }

  const clientKey = `${getPayPalMode()}:${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`;

  if (!paypalClient || cachedClientKey !== clientKey) {
    const environment =
      getPayPalMode() === 'live'
        ? new checkoutNodeJssdk.core.LiveEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET
          )
        : new checkoutNodeJssdk.core.SandboxEnvironment(
            process.env.PAYPAL_CLIENT_ID,
            process.env.PAYPAL_CLIENT_SECRET
          );

    paypalClient = new checkoutNodeJssdk.core.PayPalHttpClient(environment);
    cachedClientKey = clientKey;
  }

  return paypalClient;
};

export const getPayPalClientId = () => process.env.PAYPAL_CLIENT_ID || null;

export const getPayPalMode = () => {
  const configured = String(process.env.PAYPAL_MODE || '').trim().toLowerCase();

  if (configured === 'sandbox') {
    return 'sandbox';
  }

  // Default to live when PAYPAL_MODE is unset — use PAYPAL_MODE=sandbox only for local testing.
  return 'live';
};
