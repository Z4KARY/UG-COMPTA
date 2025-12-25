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
    MIN_AMOUNT_SUBJECT: 300,
    MIN_DUTY: 5,
    MAX_DUTY: 10000,
    BRACKETS: [
      { up_to: 30000, rate_per_100da: 1.0 },
      { up_to: 100000, rate_per_100da: 1.5 },
      { up_to: null, rate_per_100da: 2.0 }
    ]
  } as StampDutyConfig,
  VAT_RATES: [0, 9, 19],
  IBS_RATES: {
    PRODUCTION: 19,
    SERVICES: 23,
    DISTRIBUTION: 26
  },
  TAP_RATE: 0, // Abrogated (LF 2024/2025)
  IFU_RATES: {
    GOODS: 5, // 5% for production and sales of goods
    SERVICES: 12, // 12% for services and other activities
  },
  AE_RATE: 0.5, // 0.5% for Auto-Entrepreneur
  MINIMUM_TAX: {
    IFU: 10000, // 10,000 DA minimum annual tax for IFU
    AE: 10000, // 10,000 DA minimum annual tax for Auto-Entrepreneur
  }
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
 * Calculates the IFU tax based on turnover breakdown.
 * Rate: 5% for goods, 12% for services.
 * Minimum: 10,000 DA.
 */
export function calculateIFUTax(turnoverGoods: number, turnoverServices: number): number {
  if (turnoverGoods < 0 || turnoverServices < 0) throw new Error("Turnover cannot be negative");
  
  const taxGoods = turnoverGoods * (FISCAL_CONSTANTS.IFU_RATES.GOODS / 100);
  const taxServices = turnoverServices * (FISCAL_CONSTANTS.IFU_RATES.SERVICES / 100);
  const totalCalculated = taxGoods + taxServices;
  
  return Math.max(totalCalculated, FISCAL_CONSTANTS.MINIMUM_TAX.IFU);
}

/**
 * Calculates the Auto-Entrepreneur tax.
 * Rate: 0.5% of turnover.
 * Minimum: 10,000 DA.
 */
export function calculateAETax(turnover: number): number {
  if (turnover < 0) throw new Error("Turnover cannot be negative");
  
  const tax = turnover * (FISCAL_CONSTANTS.AE_RATE / 100);
  return Math.max(tax, FISCAL_CONSTANTS.MINIMUM_TAX.AE);
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

  // If no brackets defined, fallback to simple 1% (should not happen if config is valid)
  if (!BRACKETS || BRACKETS.length === 0) {
     duty = Math.ceil(amountTtcBeforeStamp / 100) * 1.0;
  } else {
    // Find the applicable rate based on the total amount (Tiered System)
    // The rate applies to the ENTIRE amount, not just the portion in the bracket.
    let applicableRate = 0;
    
    // Find the first bracket that covers the amount
    const bracket = BRACKETS.find(b => b.up_to === null || amountTtcBeforeStamp <= b.up_to);
    
    if (bracket) {
        applicableRate = bracket.rate_per_100da;
    } else {
        // Fallback if no bracket matches (e.g. if last bracket is not null/infinity)
        // Should use the rate of the last bracket
        applicableRate = BRACKETS[BRACKETS.length - 1].rate_per_100da;
    }

    // Calculate duty: 1 DA per 100 DA or fraction thereof
    const units_100da = Math.ceil(amountTtcBeforeStamp / 100);
    duty = units_100da * applicableRate;
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