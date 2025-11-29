// Fiscal Logic for Algerian Invoicing
// Based on Code des Taxes sur le Chiffre d'Affaires (CTCA) and Code du Timbre
// Updated for Loi de Finances 2025 (Law n° 24-08 of 24 Nov 2024)

export type StampDutyBracket = {
  up_to: number | null; // null means infinity/rest
  rate_per_100da: number;
};

export type StampDutyConfig = {
  MIN_AMOUNT_SUBJECT: number;
  MIN_DUTY: number;
  MAX_DUTY: number | null;
  BRACKETS: StampDutyBracket[];
};

export const FISCAL_CONSTANTS = {
  STAMP_DUTY: {
    MIN_AMOUNT_SUBJECT: 0,
    MIN_DUTY: 5,
    MAX_DUTY: 10000,
    BRACKETS: [
      { up_to: null, rate_per_100da: 1.0 } // Default linear 1%
    ]
  } as StampDutyConfig,
  VAT_RATES: [0, 9, 19],
};

// Helper for rounding to 2 decimal places
export function roundCurrency(amount: number): number {
  if (isNaN(amount)) throw new Error("Invalid currency amount: NaN");
  return Math.round((amount + Number.EPSILON) * 100) / 100;
}

export function calculateLineItem(
  quantity: number, 
  unitPrice: number, 
  discountRate: number, 
  tvaRate: number
) {
  if (quantity < 0) throw new Error("Quantity cannot be negative");
  if (unitPrice < 0) throw new Error("Unit price cannot be negative");
  if (discountRate < 0 || discountRate > 100) throw new Error("Discount rate must be between 0 and 100");
  if (tvaRate < 0) throw new Error("VAT rate cannot be negative");

  const basePrice = unitPrice * quantity;
  const discountAmount = roundCurrency(basePrice * (discountRate / 100));
  const lineTotalHt = roundCurrency(basePrice - discountAmount);
  const tvaAmount = roundCurrency(lineTotalHt * (tvaRate / 100));
  const lineTotalTtc = roundCurrency(lineTotalHt + tvaAmount);

  return {
    discountAmount,
    lineTotalHt,
    tvaAmount,
    lineTotalTtc
  };
}

/**
 * Calculates the Stamp Duty (Droit de Timbre) for a given amount.
 * Applies only to CASH payments.
 * 
 * Legal Reference:
 * - Code du Timbre, Art. 258
 * - Loi de Finances 2025, Art. 258 quinquies (Exemption for electronic payments)
 * 
 * Algorithm:
 * Supports bracket-based calculation per 100 DA.
 * 
 * @param amountTtcBeforeStamp The total amount (HT + TVA) before stamp duty
 * @param paymentMethod The payment method used
 * @param config Optional configuration object to override defaults (from DB)
 * @returns The calculated stamp duty amount
 */
export function calculateStampDuty(
  amountTtcBeforeStamp: number, 
  paymentMethod: string,
  config: StampDutyConfig = FISCAL_CONSTANTS.STAMP_DUTY
): number {
  if (amountTtcBeforeStamp < 0) throw new Error("Amount cannot be negative for stamp duty calculation");
  if (!config || !Array.isArray(config.BRACKETS)) {
    console.error("Invalid stamp duty config:", config);
    throw new Error("Invalid stamp duty configuration: Missing brackets");
  }

  // Art. 258 quinquies: Electronic payments (Bank Transfer, Cheque, Card) are exempt.
  // Only CASH (Espèces) is subject to stamp duty.
  if (paymentMethod !== "CASH") {
    return 0;
  }

  const { MIN_AMOUNT_SUBJECT, MIN_DUTY, MAX_DUTY, BRACKETS } = config;

  if (amountTtcBeforeStamp < MIN_AMOUNT_SUBJECT) {
    return 0;
  }

  let duty = 0;
  let remaining = amountTtcBeforeStamp;
  let previousLimit = 0;

  // If no brackets defined, fallback to simple 1% (should not happen if config is valid)
  if (!BRACKETS || BRACKETS.length === 0) {
     duty = Math.ceil(amountTtcBeforeStamp / 100) * 1.0;
  } else {
    for (const bracket of BRACKETS) {
        // Validate bracket structure
        if (typeof bracket.rate_per_100da !== 'number') {
            throw new Error("Invalid stamp duty bracket: missing rate");
        }

        // Determine the amount applicable in this bracket
        // The bracket.up_to is the cumulative upper limit.
        // The amount in this bracket is min(remaining, (bracket.up_to - previousLimit))
        // But simpler: we just take the chunk that fits in this bracket.
        
        let bracketCap = bracket.up_to === null ? Infinity : bracket.up_to;
        let amountInBracket = 0;
        
        // If we are past this bracket (shouldn't happen if we iterate correctly and subtract)
        // Actually, let's use the logic:
        // We need to slice the total amount into chunks defined by brackets.
        // Example: Brackets [30k, 100k, null]
        // Amount 150k.
        // Chunk 1: 0 to 30k -> 30k. Rate 1.
        // Chunk 2: 30k to 100k -> 70k. Rate 1.5.
        // Chunk 3: 100k to 150k -> 50k. Rate 2.
        
        // However, the prompt algorithm says:
        // applicable_amount = min(remaining, bracket.up_to or remaining) -- wait, bracket.up_to is usually cumulative total?
        // "up_to": 30000.0 usually means "for the portion of amount <= 30000".
        // If the prompt implies `up_to` is the *size* of the bracket, that's one thing.
        // But usually tax brackets are defined by cumulative thresholds.
        // Let's assume `up_to` is the cumulative threshold (e.g. 0-30000, 30001-100000).
        
        // Let's calculate the size of this bracket relative to the previous one.
        let bracketSize = bracketCap - previousLimit;
        
        let applicableAmount = Math.min(remaining, bracketSize);
        
        if (applicableAmount > 0) {
            let units_100da = Math.ceil(applicableAmount / 100);
            duty += units_100da * bracket.rate_per_100da;
            remaining -= applicableAmount;
            previousLimit = bracketCap;
        }
        
        if (remaining <= 0) break;
    }
  }

  if (duty < MIN_DUTY) duty = MIN_DUTY;
  if (MAX_DUTY !== null && duty > MAX_DUTY) duty = MAX_DUTY;

  return roundCurrency(duty);
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
  if (quantity < 0) throw new Error("Quantity cannot be negative");
  if (unitPrice < 0) throw new Error("Unit price cannot be negative");
  
  const priceAfterDiscount = unitPrice * (1 - (discountRate || 0) / 100);
  const lineTotalHt = priceAfterDiscount * quantity;
  const lineTva = lineTotalHt * (tvaRate / 100);
  const lineTotalTtc = lineTotalHt + lineTva;
  
  return { lineTotalHt, lineTva, lineTotalTtc };
}