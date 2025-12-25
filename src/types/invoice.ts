export interface InvoiceItem {
  productId?: string;
  description: string;
  quantity: number | string;
  unitPrice: number | string;
  discountRate: number | string;
  tvaRate: number | string;
  lineTotal: number;
  productType?: "goods" | "service";
}