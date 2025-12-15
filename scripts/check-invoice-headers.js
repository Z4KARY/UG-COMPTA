const fs = require('fs');
const path = require('path');

const FILES_TO_CHECK = [
  'src/components/invoice/InvoiceDocument.tsx',
  'src/components/invoice/PurchaseInvoiceDocument.tsx'
];

const REQUIRED_HEADER = `/*
 * -----------------------------------------------------------------------------
 * ⚠️ CRITICAL DESIGN CONSISTENCY WARNING ⚠️
 * -----------------------------------------------------------------------------
 * 1. Maintain the exact layout and design consistency for this component.
 * 2. Any proposed changes to the design or layout must undergo explicit approval
 *    from a lead developer or product owner.
 * 3. Strict code review processes are in place to enforce this consistency.
 * -----------------------------------------------------------------------------
 */`;

let hasError = false;

console.log('🔍 Verifying Invoice Design Consistency Headers...');

FILES_TO_CHECK.forEach(filePath => {
  try {
    const fullPath = path.join(process.cwd(), filePath);
    if (!fs.existsSync(fullPath)) {
      console.error(`❌ File not found: ${filePath}`);
      hasError = true;
      return;
    }

    const content = fs.readFileSync(fullPath, 'utf8');
    // Normalize line endings for comparison
    const normalizedContent = content.replace(/\r\n/g, '\n');
    const normalizedHeader = REQUIRED_HEADER.replace(/\r\n/g, '\n');

    if (!normalizedContent.includes(normalizedHeader)) {
      console.error(`❌ Missing Critical Design Warning in: ${filePath}`);
      hasError = true;
    } else {
      console.log(`✅ Verified: ${filePath}`);
    }
  } catch (err) {
    console.error(`❌ Error checking ${filePath}:`, err.message);
    hasError = true;
  }
});

if (hasError) {
  console.error('\nFAILED: One or more invoice components are missing the required design consistency warning.');
  process.exit(1);
} else {
  console.log('\nSUCCESS: All invoice components have the required design consistency warning.');
  process.exit(0);
}
