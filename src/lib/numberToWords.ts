const UNITS_EN = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const TEENS_EN = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS_EN = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

const UNITS_FR = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
const TEENS_FR = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
const TENS_FR = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingt", "quatre-vingt-dix"];

const UNITS_AR = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة"];
const TEENS_AR = ["عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const TENS_AR = ["", "عشرة", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];

function convertGroup(n: number, lang: "en" | "fr" | "ar"): string {
  if (n === 0) return "";
  
  let str = "";
  
  if (lang === "en") {
    // Hundreds
    if (n >= 100) {
      const hundreds = Math.floor(n / 100);
      const remainder = n % 100;
      str += UNITS_EN[hundreds] + " hundred";
      if (remainder > 0) str += " ";
      n = remainder;
    }
    
    // Tens and Units
    if (n > 0) {
      if (n < 10) {
        str += UNITS_EN[n];
      } else if (n < 20) {
        str += TEENS_EN[n - 10];
      } else {
        const tens = Math.floor(n / 10);
        const units = n % 10;
        str += TENS_EN[tens];
        if (units > 0) str += "-" + UNITS_EN[units];
      }
    }
  } else if (lang === "fr") {
    // Hundreds
    if (n >= 100) {
      const hundreds = Math.floor(n / 100);
      const remainder = n % 100;
      if (hundreds > 1) str += UNITS_FR[hundreds] + " ";
      str += "cent";
      if (hundreds > 1 && remainder === 0) str += "s";
      if (remainder > 0) str += " ";
      n = remainder;
    }

    // Tens and Units
    if (n > 0) {
      if (n < 10) {
        str += UNITS_FR[n];
      } else if (n < 20) {
        str += TEENS_FR[n - 10];
      } else {
        let tens = Math.floor(n / 10);
        let units = n % 10;
        
        // Handle 70-79 and 90-99
        if (tens === 7 || tens === 9) {
          tens -= 1;
          units += 10;
        }

        str += TENS_FR[tens];
        
        if (units > 0) {
           if (units === 1 && tens !== 8) str += "-et";
           str += "-" + (units < 10 ? UNITS_FR[units] : TEENS_FR[units - 10]);
        }
      }
    }
  } else if (lang === "ar") {
     // Simplified Arabic implementation
     if (n >= 100) {
        const hundreds = Math.floor(n / 100);
        const remainder = n % 100;
        if (hundreds === 1) str += "مائة";
        else if (hundreds === 2) str += "مائتان";
        else str += UNITS_AR[hundreds] + " مائة";
        
        if (remainder > 0) str += " و ";
        n = remainder;
     }
     
     if (n > 0) {
        if (n < 10) str += UNITS_AR[n];
        else if (n < 20) str += TEENS_AR[n - 10];
        else {
           const tens = Math.floor(n / 10);
           const units = n % 10;
           if (units > 0) str += UNITS_AR[units] + " و ";
           str += TENS_AR[tens];
        }
     }
  }
  
  return str;
}

export function numberToWords(amount: number, lang: "en" | "fr" | "ar" = "en"): string {
  if (amount === 0) {
      if (lang === "fr") return "zéro Dinars Algériens";
      if (lang === "ar") return "صفر دينار جزائري";
      return "zero Algerian Dinars";
  }
  
  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);
  
  let words = "";
  
  if (integerPart === 0) {
    words = lang === "fr" ? "zéro" : lang === "ar" ? "صفر" : "zero";
  } else {
    const billions = Math.floor(integerPart / 1000000000);
    const millions = Math.floor((integerPart % 1000000000) / 1000000);
    const thousands = Math.floor((integerPart % 1000000) / 1000);
    const remainder = integerPart % 1000;
    
    if (lang === "en") {
        if (billions > 0) words += convertGroup(billions, lang) + " billion" + (billions > 1 ? "s" : "") + " ";
        if (millions > 0) words += convertGroup(millions, lang) + " million" + (millions > 1 ? "s" : "") + " ";
        if (thousands > 0) words += convertGroup(thousands, lang) + " thousand ";
        if (remainder > 0) words += convertGroup(remainder, lang);
    } else if (lang === "fr") {
        if (billions > 0) words += convertGroup(billions, lang) + " milliard" + (billions > 1 ? "s" : "") + " ";
        if (millions > 0) words += convertGroup(millions, lang) + " million" + (millions > 1 ? "s" : "") + " ";
        if (thousands > 0) {
            if (thousands === 1) words += "mille ";
            else words += convertGroup(thousands, lang) + " mille ";
        }
        if (remainder > 0) words += convertGroup(remainder, lang);
    } else if (lang === "ar") {
        if (billions > 0) words += convertGroup(billions, lang) + " مليار ";
        if (millions > 0) words += convertGroup(millions, lang) + " مليون ";
        if (thousands > 0) words += convertGroup(thousands, lang) + " ألف ";
        if (remainder > 0) words += convertGroup(remainder, lang);
    }
  }
  
  words = words.trim();
  
  if (lang === "fr") words += " Dinars Algériens";
  else if (lang === "ar") words += " دينار جزائري";
  else words += " Algerian Dinars";
  
  if (decimalPart > 0) {
    if (lang === "fr") words += " et " + convertGroup(decimalPart, lang) + " centimes";
    else if (lang === "ar") words += " و " + convertGroup(decimalPart, lang) + " سنتيم";
    else words += " and " + convertGroup(decimalPart, lang) + " centimes";
  }
  
  return words + (lang === "fr" ? " (TTC)" : lang === "ar" ? " (مع احتساب الرسوم)" : " (Incl. Tax)");
}