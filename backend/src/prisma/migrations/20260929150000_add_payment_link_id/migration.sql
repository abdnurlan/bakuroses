-- Chewick returns a link id when the payment link is created, but its status
-- endpoint is keyed by transaction id, which only appears in the callback.
-- Store both so a callback can be matched by either id.
ALTER TABLE "Payment" ADD COLUMN "linkId" TEXT;

CREATE INDEX "Payment_linkId_idx" ON "Payment"("linkId");
CREATE INDEX "Payment_transactionId_idx" ON "Payment"("transactionId");
