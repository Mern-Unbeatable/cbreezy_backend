-- Rename Payment.stripeSessionId to paypalOrderId (schema was updated without a prior migration)
ALTER TABLE "Payment" RENAME COLUMN "stripeSessionId" TO "paypalOrderId";

ALTER INDEX "Payment_stripeSessionId_key" RENAME TO "Payment_paypalOrderId_key";
