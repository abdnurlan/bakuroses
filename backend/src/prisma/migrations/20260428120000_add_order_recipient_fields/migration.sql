ALTER TABLE "Order" ADD COLUMN "deliveryFor" TEXT NOT NULL DEFAULT 'self';
ALTER TABLE "Order" ADD COLUMN "recipientName" TEXT;
ALTER TABLE "Order" ADD COLUMN "recipientPhone" TEXT;
