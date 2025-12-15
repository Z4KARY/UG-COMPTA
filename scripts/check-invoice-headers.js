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

console.log('🔍 Checking invoice design consistency headers...');

FILES_TO_CHECK.forEach(filePath => {
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
    console.error(`❌ Missing or modified design consistency header in: ${filePath}`);
    console.error('   Please restore the critical warning header exactly as defined in INVOICE_DESIGN_POLICY.md');
    hasError = true;
  } else {
    console.log(`✅ Verified: ${filePath}`);
  }
});

if (hasError) {
  console.error('\n💥 Invoice design consistency check failed!');
  process.exit(1);
} else {
  console.log('\n✨ All invoice documents passed design consistency check.');
  process.exit(0);
}
