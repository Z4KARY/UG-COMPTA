import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { InvoiceDocument } from "./InvoiceDocument";
import { PurchaseInvoiceDocument } from "./PurchaseInvoiceDocument";

// Mock data for testing
const mockBusiness = {
  name: "Test Business",
  address: "123 Test St",
  city: "Test City",
  phone: "123456789",
  email: "test@business.com",
  nif: "123456789012345",
  rc: "12/3456789",
  ai: "123456789",
  nis: "123456789",
  primaryColor: "#000000",
  font: "Inter",
};

const mockInvoice = {
  invoiceNumber: "INV-001",
  issueDate: 1704067200000, // 2024-01-01
  dueDate: 1706745600000, // 2024-02-01
  type: "invoice",
  currency: "DZD",
  status: "issued",
  subtotalHt: 1000,
  totalTva: 190,
  totalTtc: 1190,
  customer: {
    name: "Test Customer",
    address: "456 Customer Ave",
    taxId: "987654321",
  },
};

const mockItems = [
  {
    description: "Test Item",
    quantity: 1,
    unitPrice: 1000,
    tvaRate: 19,
    lineTotal: 1190,
  },
];

const mockPurchaseInvoice = {
  invoiceNumber: "PINV-001",
  invoiceDate: 1704067200000,
  subtotalHt: 1000,
  vatTotal: 190,
  totalTtc: 1190,
  items: [
    {
      description: "Purchase Item",
      quantity: 1,
      unitPrice: 1000,
      vatRate: 19,
      lineTotalTtc: 1190,
    },
  ],
};

const mockSupplier = {
  name: "Test Supplier",
  address: "789 Supplier Blvd",
  nif: "111222333",
};

describe("Invoice Design Consistency (Snapshot Tests)", () => {
  it("InvoiceDocument matches snapshot", () => {
    const { container } = render(
      <InvoiceDocument
        invoice={mockInvoice}
        business={mockBusiness}
        items={mockItems}
      />
    );
    expect(container).toMatchSnapshot();
  });

  it("PurchaseInvoiceDocument matches snapshot", () => {
    const { container } = render(
      <PurchaseInvoiceDocument
        invoice={mockPurchaseInvoice}
        business={mockBusiness}
        supplier={mockSupplier}
      />
    );
    expect(container).toMatchSnapshot();
  });
});