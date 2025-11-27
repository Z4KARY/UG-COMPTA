// Fiscal Logic for Algerian Invoicing
// Based on Code des Taxes sur le Chiffre d’Affaires (CTCA) and Code du Timbre

export const FISCAL_CONSTANTS = {
  VAT_STANDARD: 19,
  VAT_REDUCED: 9,
  VAT_ZERO: 0,
  
  STAMP_DUTY: {
    // Code du Timbre Art. 100, 258, etc.
    // LF 2023/2025 updates
    MIN_DUTY: 5,
    MAX_DUTY: 10000,
    RATE_PER_100DA: 1.0, // 1%
    THRESHOLD_EXEMPT: 0, // Usually all cash payments are subject
  }
};

/**
 * Calculates the Stamp Duty (Droit de Timbre) for a given amount.
 * Applies only to CASH payments.
 * 
 * Algorithm:
 * 1% per 100 DA or fraction thereof.
 * Min: 5 DA
 * Max: 10,000 DA
 * 
 * @param amountTtcBeforeStamp The total amount (HT + TVA) before stamp duty
 * @param paymentMethod The payment method used
 * @returns The calculated stamp duty amount
 */
export function calculateStampDuty(amountTtcBeforeStamp: number, paymentMethod: string): number {
  if (paymentMethod !== "CASH") {
    // Art. 258 quinquies: Electronic payments are exempt
    return 0;
  }

  const { MIN_DUTY, MAX_DUTY, RATE_PER_100DA } = FISCAL_CONSTANTS.STAMP_DUTY;

  // 1 DA per 100 DA or fraction thereof
  // Example: 150 DA -> 2 DA duty
  let duty = Math.ceil(amountTtcBeforeStamp / 100) * RATE_PER_100DA;

  if (duty < MIN_DUTY) duty = MIN_DUTY;
  if (duty > MAX_DUTY) duty = MAX_DUTY;

  return duty;
}

/**
 * Calculates line totals including VAT.
 */
export function calculateLineTotals(
  quantity: number, 
  unitPrice: number, 
  discountRate: number, 
  tvaRate: number
) {
  const priceAfterDiscount = unitPrice * (1 - (discountRate || 0) / 100);
  const lineTotalHt = priceAfterDiscount * quantity;
  const lineTva = lineTotalHt * (tvaRate / 100);
  const lineTotalTtc = lineTotalHt + lineTva;
  
  return { lineTotalHt, lineTva, lineTotalTtc };
}
