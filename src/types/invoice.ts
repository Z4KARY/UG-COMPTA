export interface InvoiceItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  tvaRate: number;
  lineTotal: number;
  productType?: "goods" | "service";
}
