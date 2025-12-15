/*
 * -----------------------------------------------------------------------------
 * ⚠️ CRITICAL DESIGN CONSISTENCY WARNING ⚠️
 * -----------------------------------------------------------------------------
 * 1. Maintain the exact layout and design consistency for this component.
 * 2. Any proposed changes to the design or layout must undergo explicit approval
 *    from a lead developer or product owner.
 * 3. Strict code review processes are in place to enforce this consistency.
 * -----------------------------------------------------------------------------
 */

import { Separator } from "@/components/ui/separator";
import { numberToWords } from "@/lib/numberToWords";

interface PurchaseInvoiceDocumentProps {
  invoice: any;
  business: any;
  supplier: any;
}

export function PurchaseInvoiceDocument({ invoice, business, supplier }: PurchaseInvoiceDocumentProps) {
  const primaryColor = business?.primaryColor || "#0f172a";
  const font = business?.font || "Inter";

  return (
    <div className="w-full mx-auto print:w-full print:max-w-none">
      <div
        className="print-container bg-white shadow-xl rounded-xl overflow-hidden print:overflow-visible border border-gray-100 w-full max-w-[210mm] mx-auto min-h-[297mm] relative flex flex-col"
        style={{ fontFamily: font }}
      >
        {/* Top Accent Line */}
        <div className="h-2 w-full print:hidden" style={{ backgroundColor: primaryColor }}></div>

        <div className="p-8 md:p-12 print:p-0 flex-grow flex flex-col">
          {/* Header - Supplier Info (Issuer) */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 print:mb-6 print:gap-4">
            <div className="w-full md:w-1/2">
              <div className="h-20 flex items-center mb-6">
                <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">
                  {supplier?.name || "Unknown Supplier"}
                </h2>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-900 text-base mb-1">{supplier?.name}</p>
                <p className="whitespace-pre-line">{supplier?.address}</p>
                {supplier?.phone && <p>Tel: {supplier.phone}</p>}
                {supplier?.email && <p>Email: {supplier.email}</p>}
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  {supplier?.nif && <span>NIF: {supplier.nif}</span>}
                  {supplier?.rc && <span>RC: {supplier.rc}</span>}
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2 text-left md:text-right">
              <div className="inline-block text-left md:text-right">
                <h1 className="text-4xl font-light tracking-tight mb-2 uppercase text-gray-900">
                  Purchase Invoice
                </h1>
                <p className="text-lg font-medium text-gray-500 mb-6">#{invoice.invoiceNumber}</p>

                <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600 text-left">
                  <div className="text-gray-400">Invoice Date</div>
                  <div className="font-medium text-gray-900 text-right">
                    {new Date(invoice.invoiceDate).toLocaleDateString("en-GB")}
                  </div>

                  {invoice.paymentDate && (
                    <>
                      <div className="text-gray-400">Payment Date</div>
                      <div className="font-medium text-gray-900 text-right">
                        {new Date(invoice.paymentDate).toLocaleDateString("en-GB")}
                      </div>
                    </>
                  )}

                  {invoice.paymentMethod && (
                    <>
                      <div className="text-gray-400">Payment Method</div>
                      <div className="font-medium text-gray-900 text-right capitalize">
                        {invoice.paymentMethod.replace("_", " ").toLowerCase()}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bill To Section (My Business) */}
          <div className="flex flex-col md:flex-row gap-8 mb-12 print:mb-6">
            <div className="w-full md:w-1/2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h3>
              <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
                <h2 className="font-bold text-lg text-gray-900 mb-1">{business?.name}</h2>
                {business?.tradeName && (
                  <p className="text-sm text-gray-600 mb-2">{business.tradeName}</p>
                )}

                <div className="text-sm text-gray-600 space-y-1">
                  <p className="whitespace-pre-line">{business?.address}</p>
                  <p>{business?.city}, Algeria</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    {business?.nif && <span>NIF: {business.nif}</span>}
                    {business?.rc && <span>RC: {business.rc}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8 print:mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className="text-left py-3 pl-4 font-semibold text-gray-900 bg-gray-50/50 rounded-l-lg">
                    Description
                  </th>
                  <th className="text-right py-3 font-semibold text-gray-900 bg-gray-50/50 w-24">Qty</th>
                  <th className="text-right py-3 font-semibold text-gray-900 bg-gray-50/50 w-32">Price</th>
                  <th className="text-right py-3 font-semibold text-gray-900 bg-gray-50/50 w-24">VAT</th>
                  <th className="text-right py-3 pr-4 font-semibold text-gray-900 bg-gray-50/50 rounded-r-lg w-32">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoice.items?.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className="py-4 pl-4 text-gray-900 font-medium">{item.description}</td>
                    <td className="py-4 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-4 text-right text-gray-600">
                      {item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 text-right text-gray-600">{item.vatRate}%</td>
                    <td className="py-4 pr-4 text-right text-gray-900 font-medium">
                      {item.lineTotalTtc.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Notes */}
          <div className="flex flex-col md:flex-row gap-12 mb-12 print:mb-6 print:break-inside-avoid">
            <div className="flex-1">
              {invoice.description && (
                <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-4 text-sm text-gray-600">
                  <p className="font-semibold mb-1 text-gray-900">Description / Notes</p>
                  <p>{invoice.description}</p>
                </div>
              )}
            </div>

            <div className="w-full md:w-80">
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal HT</span>
                  <span className="font-medium text-gray-900">
                    {invoice.subtotalHt.toLocaleString("en-US", { minimumFractionDigits: 2 })} DZD
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>VAT Total</span>
                  <span className="font-medium text-gray-900">
                    {invoice.vatTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} DZD
                  </span>
                </div>

                <Separator className="my-2" />

                <div className="flex justify-between items-end">
                  <span className="font-bold text-lg text-gray-900">Total TTC</span>
                  <div className="text-right">
                    <span
                      className="block font-bold text-2xl text-gray-900"
                      style={{ color: primaryColor }}
                    >
                      {invoice.totalTtc.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                      <span className="text-sm font-medium text-gray-500">DZD</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="mb-12 print:mb-0 print:break-inside-avoid">
            <p className="text-sm text-gray-500 mb-1">Amount in words:</p>
            <p
              className="text-gray-900 font-medium italic border-l-4 pl-4 py-1"
              style={{ borderColor: primaryColor }}
            >
              "{numberToWords(invoice.totalTtc)}"
            </p>
          </div>

          {/* Signature & Stamp Section */}
          <div className="flex justify-end mb-12 print:break-inside-avoid">
            <div className="w-[500px] text-center relative">
              <p className="text-sm font-semibold text-gray-900 mb-4">Signature</p>
              
              <div className="h-96 w-full flex items-center justify-center relative overflow-hidden">
                {/* Stamp Layer */}
                {business?.stampUrl && (
                  <img 
                    src={business.stampUrl} 
                    alt="Stamp" 
                    className="absolute right-0 top-0 w-96 h-96 object-contain opacity-80 rotate-[-12deg] mix-blend-multiply" 
                  />
                )}
                
                {/* Signature Layer */}
                {business?.signatureUrl && (
                  <img 
                    src={business.signatureUrl} 
                    alt="Signature" 
                    className="absolute inset-0 w-full h-full object-contain z-10" 
                  />
                )}
                
                {/* Placeholder if neither exists */}
                {!business?.stampUrl && !business?.signatureUrl && (
                  <div className="w-full h-full border border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-300">Cachet et Signature</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}