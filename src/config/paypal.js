import checkoutNodeJssdk from '@paypal/checkout-server-sdk';
import 'dotenv/config';

export const PAYPAL_CURRENCY = (process.env.PAYPAL_CURRENCY || 'usd').toUpperCase();

let paypalClient;

export const getPayPalClient = () => {
  if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
    const error = new Error('PayPal credentials are not configured');
    error.statusCode = 500;
    throw error;
  }

  if (!paypalClient) {
    const environment = process.env.PAYPAL_MODE === 'live'
      ? new checkoutNodeJssdk.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
      : new checkoutNodeJssdk.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);
      
    paypalClient = new checkoutNodeJssdk.core.PayPalHttpClient(environment);
  }

  return paypalClient;
};

export const getPayPalClientId = () => process.env.PAYPAL_CLIENT_ID || null;
