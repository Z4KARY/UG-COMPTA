const UNITS = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
const TEENS = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const TENS = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

function convertGroup(n: number): string {
  if (n === 0) return "";
  
  let str = "";
  
  // Hundreds
  if (n >= 100) {
    const hundreds = Math.floor(n / 100);
    const remainder = n % 100;
    str += UNITS[hundreds] + " hundred";
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
      
      str += TENS[tens];
      if (units > 0) {
        str += "-" + UNITS[units];
      }
    }
  }
  
  return str;
}

export function numberToWords(amount: number): string {
  if (amount === 0) return "zero Algerian Dinars";
  
  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);
  
  let words = "";
  
  if (integerPart === 0) {
    words = "zero";
  } else {
    const billions = Math.floor(integerPart / 1000000000);
    const millions = Math.floor((integerPart % 1000000000) / 1000000);
    const thousands = Math.floor((integerPart % 1000000) / 1000);
    const remainder = integerPart % 1000;
    
    if (billions > 0) {
      words += convertGroup(billions) + " billion" + (billions > 1 ? "s" : "") + " ";
    }
    if (millions > 0) {
      words += convertGroup(millions) + " million" + (millions > 1 ? "s" : "") + " ";
    }
    if (thousands > 0) {
      words += convertGroup(thousands) + " thousand ";
    }
    if (remainder > 0) {
      words += convertGroup(remainder);
    }
  }
  
  words = words.trim() + " Algerian Dinars";
  
  if (decimalPart > 0) {
    words += " and " + convertGroup(decimalPart) + " centimes";
  }
  
  return words + " (Incl. Tax)";
}