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

  // 1. Determine Modules based on Regime and Type
  if (type === "societe") {
    // Companies are always under Reel regime (mostly)
    config.modules.G50 = true;
    config.modules.IBS = true;
    config.modules.VAT = true;
    config.modules.WITHHOLDINGS = true;
    config.modules.STAMP = true;
  } else if (type === "personne_physique") {
    if (fiscalRegime === "reel") {
      // Physical Person under Real Regime
      config.modules.G50 = true;
      config.modules.VAT = true;
      config.modules.WITHHOLDINGS = true;
      config.modules.STAMP = true;
      // No IBS, they pay IRG (handled in G50)
    } else {
      // IFU (Forfaitaire)
      config.modules.G12 = true; // Annual declaration
      config.modules.G12bis = true; // Often used for IFU
      config.modules.VAT = false; // Exempt
      config.modules.STAMP = true;
      config.legalMentions.push("TVA non applicable, art. 282 ter du Code des Impôts Directs");
    }
  } else if (type === "auto_entrepreneur") {
    // Auto Entrepreneur
    config.modules.G12 = true; // Simplified declaration
    config.modules.VAT = false; // Exempt
    config.modules.STAMP = false; // Often exempt or simplified
    config.legalMentions.push("Exonéré de TVA et de TAP (Auto-Entrepreneur)");
  }

  // 2. Construct Invoice Footer
  const parts: string[] = [];

  if (type === "societe") {
    if (legalForm) parts.push(legalForm);
    if (capital) parts.push(`au capital de ${capital.toLocaleString("fr-DZ")} DA`);
  } else if (type === "auto_entrepreneur") {
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
