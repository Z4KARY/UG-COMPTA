const UNITS = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
const TEENS = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const TENS = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

function convertGroup(n: number): string {
  if (n === 0) return "";
  if (n === 100) return "cent";
  
  let str = "";
  
  // Hundreds
  if (n >= 100) {
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    if (hundreds > 1) {
      str += UNITS[hundreds] + " cent";
      if (remainder === 0) str += "s";
    } else {
      str += "cent";
    }
    if (remainder > 0) str += " ";
    n = remainder;
  }
  
  // Tens and Units
  if (n > 0) {
    if (n < 10) {
      str += UNITS[n];
    } else if (n < 20) {
      str += TEENS[n - 10];
    } else {
      const tens = Math.floor(n / 10);
      const units = n % 10;
      
      if (tens === 7 || tens === 9) {
        str += TENS[tens - 1]; // soixante or quatre-vingt
        str += "-";
        str += TEENS[units]; // dix, onze, etc.
      } else {
        str += TENS[tens];
        if (units > 0) {
          if (units === 1 && tens !== 8) str += "-et-un";
          else str += "-" + UNITS[units];
        }
      }
      
      // Fix for quatre-vingts (80)
      if (tens === 8 && units === 0) str += "s";
    }
  }
  
  return str;
}

export function numberToWords(amount: number): string {
  if (amount === 0) return "zéro dinars algériens";
  
  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);
  
  let words = "";
  
  if (integerPart === 0) {
    words = "zéro";
  } else {
    const billions = Math.floor(integerPart / 1000000000);
    const millions = Math.floor((integerPart % 1000000000) / 1000000);
    const thousands = Math.floor((integerPart % 1000000) / 1000);
    const remainder = integerPart % 1000;
    
    if (billions > 0) {
      words += convertGroup(billions) + " milliard" + (billions > 1 ? "s" : "") + " ";
    }
    if (millions > 0) {
      words += convertGroup(millions) + " million" + (millions > 1 ? "s" : "") + " ";
    }
    if (thousands > 0) {
      if (thousands === 1) words += "mille ";
      else words += convertGroup(thousands) + " mille ";
    }
    if (remainder > 0) {
      words += convertGroup(remainder);
    }
  }
  
  words = words.trim() + " dinars algériens";
  
  if (decimalPart > 0) {
    words += " et " + convertGroup(decimalPart) + " centimes";
  }
  
  return words + " TTC";
}
