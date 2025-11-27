// Fiscal Logic for Algerian Invoicing
// Based on Code des Taxes sur le Chiffre d'Affaires (CTCA) and Code du Timbre
// Updated to reflect Loi de Finances 2025 (Law n° 24-08 of 24 Nov 2024)

export const FISCAL_CONSTANTS = {
  VAT_STANDARD: 19,
  VAT_REDUCED: 9,
  VAT_ZERO: 0,
  
  STAMP_DUTY: {
    // Code du Timbre Art. 258: Droit de timbre de quittance (Stamp Duty on Receipts)
    // Rate: 1 DA per 100 DA or fraction thereof (1%)
    // LF 2025 reinforces exemptions for electronic payments (Art. 258 quinquies)
    MIN_DUTY: 5,
    MAX_DUTY: 10000, // Capped at 10,000 DA (since LF 2022/2023)
    RATE_PER_100DA: 1.0, // 1%
    THRESHOLD_EXEMPT: 0, // All cash payments are subject to duty
  }
};

/**
 * Calculates the Stamp Duty (Droit de Timbre) for a given amount.
 * Applies only to CASH payments.
 * 
 * Legal Reference:
 * - Code du Timbre Art. 258: 1% duty on cash payments.
 * - Code du Timbre Art. 258 quinquies: Exemption for payments via bank, CCP, or electronic means.
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
    // Art. 258 quinquies: Electronic payments (Bank, Card, Cheque) are exempt
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