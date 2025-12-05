import { Doc } from "./_generated/dataModel";

export type TaxModule = "G50" | "G12" | "G12bis" | "IBS" | "VAT" | "WITHHOLDINGS" | "STAMP";

export interface TaxConfiguration {
  modules: {
    [key in TaxModule]: boolean;
  };
  invoiceFooter: string;
  legalMentions: string[];
}

/**
 * Configures tax modules and invoice footers based on the taxpayer's legal nature and tax regime.
 * 
 * Logic based on Algerian Tax Code:
 * - Companies (Société): Subject to IBS, VAT, G50 (Monthly).
 * - Individuals (Reel): Subject to IRG, VAT, G50 (Monthly).
 * - Individuals (IFU): Subject to IFU (G12/G12bis), Exempt from VAT.
 * - Auto-Entrepreneurs: Subject to IFU (Simplified), Exempt from VAT.
 */
export function configureTaxModules(business: Doc<"businesses">): TaxConfiguration {
  const config: TaxConfiguration = {
    modules: {
      G50: false,
      G12: false,
      G12bis: false,
      IBS: false,
      VAT: false,
      WITHHOLDINGS: false,
      STAMP: true, // Default to true, specific exemptions handled in fiscal.ts
    },
    invoiceFooter: "",
    legalMentions: [],
  };

  const { type, fiscalRegime, legalForm, capital, rc, nif, ai, nis, autoEntrepreneurCardNumber } = business;

  // 1. Determine Modules based on Regime and Type (Rules from Technical File)
  
  // Case A: Company (Personne Morale, real regime)
  if (type === "societe") {
    config.modules.G50 = true;
    config.modules.IBS = true; // Annual declaration E n°6
    config.modules.VAT = true;
    config.modules.WITHHOLDINGS = true;
    config.modules.STAMP = true;
    // Standard VAT rules apply, no specific footer text required by default
  } 
  // Case C: Auto-Entrepreneur (Specific Case of PP under IFU)
  else if (type === "auto_entrepreneur" || (type === "personne_physique" && fiscalRegime === "auto_entrepreneur")) {
    config.modules.G12 = true;
    config.modules.G12bis = true;
    config.modules.STAMP = true;
    config.modules.VAT = false;
    
    const footerText = "VAT not applicable – IFU auto-entrepreneur flat-tax regime (0.5%)";
    config.invoiceFooter = footerText;
    config.legalMentions.push(footerText);
  }
  // Case B: Individual PP under IFU (Non-AE)
  else if (type === "personne_physique" && (fiscalRegime === "forfaitaire" || fiscalRegime === "IFU")) {
    config.modules.G12 = true;
    config.modules.G12bis = true;
    config.modules.STAMP = true;
    config.modules.VAT = false;
    
    const footerText = "VAT not applicable – IFU flat-tax regime";
    config.invoiceFooter = footerText;
    config.legalMentions.push(footerText);
  }
  // Case D: Individual PP under Real / Real Simplified
  else if (type === "personne_physique" && (fiscalRegime === "reel" || fiscalRegime === "VAT")) {
    config.modules.G50 = true;
    config.modules.IBS = true; // Subject to IBS (profit tax) as per technical file
    config.modules.VAT = true;
    config.modules.WITHHOLDINGS = true;
    config.modules.STAMP = true;
    // Standard VAT rules apply
  }

  // 2. Construct Invoice Footer (Append Business Details)
  const parts: string[] = [];
  
  // Add the tax regime footer if set
  if (config.invoiceFooter) {
      parts.push(config.invoiceFooter);
  }

  if (type === "societe") {
    if (legalForm) parts.push(legalForm);
    if (capital) parts.push(`au capital de ${capital.toLocaleString("fr-DZ")} DA`);
  } else if (type === "auto_entrepreneur" || (type === "personne_physique" && fiscalRegime === "auto_entrepreneur")) {
    parts.push("Auto-Entrepreneur");
    if (autoEntrepreneurCardNumber) parts.push(`Carte N° ${autoEntrepreneurCardNumber}`);
  } else {
    // Personne Physique
    parts.push("Entreprise Individuelle");
  }

  // Common Identifiers
  if (rc) parts.push(`RC: ${rc}`);
  if (nif) parts.push(`NIF: ${nif}`);
  if (ai) parts.push(`AI: ${ai}`);
  if (nis) parts.push(`NIS: ${nis}`);

  config.invoiceFooter = parts.join(" - ");

  return config;
}

/**
 * Returns the applicable tax rates for a business based on its regime.
 * Useful for frontend calculations and display.
 */
export function getApplicableTaxRates(business: Doc<"businesses">) {
  if (business.type === "auto_entrepreneur" || (business.type === "personne_physique" && business.fiscalRegime === "auto_entrepreneur")) {
    return {
      type: "auto_entrepreneur",
      rate: 0.5,
      minTax: 10000
    };
  } else if (business.fiscalRegime === "forfaitaire" || business.fiscalRegime === "IFU") {
    return {
      type: "ifu",
      rates: {
        goods: 5,
        services: 12
      },
      minTax: 10000
    };
  } else {
    return {
      type: "reel",
      rates: {
        ibs: 26, // Default to Distribution (26%)
        tap: 0, // Abrogated
        vat: [9, 19]
      }
    };
  }
}