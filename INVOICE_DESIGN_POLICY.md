# Invoice Design Consistency Policy

## Purpose
This policy ensures that the layout and design of invoice documents (`InvoiceDocument.tsx` and `PurchaseInvoiceDocument.tsx`) remain consistent and professional. These documents are critical for business operations and legal compliance.

## Protected Components
The following components are subject to strict design consistency controls:
- `src/components/invoice/InvoiceDocument.tsx`
- `src/components/invoice/PurchaseInvoiceDocument.tsx`

## Modification Protocol

### 1. Approval Requirement
Any proposed change to the visual layout, styling, or structure of the protected components must receive explicit written approval from a Lead Developer or Product Owner.

### 2. Review Process
- **Pull Requests:** Any PR modifying these files must be labeled `invoice-design-change`.
- **Visual Regression Testing:** Changes must be verified against previous versions to ensure no unintended layout shifts occur.
- **Print Testing:** Changes must be tested in print preview mode across multiple browsers (Chrome, Firefox, Safari) to ensure A4 pagination and margins are preserved.

### 3. CI/CD Enforcement
Automated checks are in place to ensure the presence of the critical warning headers in these files. Removal of these headers will cause build failures.

## Contact
For questions regarding invoice design or to request a design change, please contact the product team.
