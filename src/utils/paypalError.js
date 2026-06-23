import { createHttpError } from './httpError.js';

const getPayPalErrorText = (error) => {
  const raw = error?._originalError?.text;
  if (typeof raw === 'string') return raw;
  if (typeof error?.message === 'string') return error.message;
  return '';
};

export const isPayPalSdkError = (error) =>
  Boolean(
    error?.headers?.['paypal-debug-id'] ||
      error?._originalError ||
      getPayPalErrorText(error).includes('invalid_client')
  );

export const normalizePayPalError = (error) => {
  if (!isPayPalSdkError(error)) {
    return null;
  }

  const details = getPayPalErrorText(error);

  if (details.includes('invalid_client')) {
    return createHttpError(
      502,
      'PayPal credentials are invalid or the sandbox/live mode does not match your PayPal app settings.'
    );
  }

  return createHttpError(
    502,
    'PayPal payment service rejected the request. Please try again later.'
  );
};
