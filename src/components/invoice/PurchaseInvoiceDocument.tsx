import { INVOICE_LABELS, InvoiceLanguage } from "@/lib/invoice-templates";
import { numberToWords } from "@/lib/numberToWords";
import { Separator } from "@/components/ui/separator";

interface PurchaseInvoiceDocumentProps {
  invoice: any;
  business: any;
  supplier: any;
  language?: string;
}

export function PurchaseInvoiceDocument({ invoice, business, supplier, language = "fr" }: PurchaseInvoiceDocumentProps) {
  const lang = (language in INVOICE_LABELS ? language : "fr") as InvoiceLanguage;
  const labels = INVOICE_LABELS[lang];
  const isRTL = lang === "ar";

  const primaryColor = business?.primaryColor || "#0f172a";
  const font = business?.font || "Inter";
  const invoiceFontFamily = font.includes(" ")
    ? `"${font}", Inter, sans-serif`
    : `${font}, Inter, sans-serif`;

  // For purchase invoices, we don't usually have a digital stamp/signature of the supplier stored in the same way
  // But we can display the business's stamp if it's an internal document, or leave it blank.
  // The requirement is to match the layout. 
  
  return (
    <div className="w-full mx-auto print:w-full print:max-w-none">
      <div
        className="print-container bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100 w-full max-w-[210mm] mx-auto relative flex flex-col print:shadow-none print:border-none print:m-0 print:w-full print:max-w-none"
        style={{ fontFamily: invoiceFontFamily, direction: isRTL ? "rtl" : "ltr" }}
      >
        {/* Top Accent Line */}
        <div className="h-2 w-full" style={{ backgroundColor: primaryColor }}></div>

        <div className="p-8 md:p-12 flex-grow flex flex-col">
          
          {/* COMPACT HEADER GRID: Left (Supplier/Issuer) | Right (Invoice + Business/Bill To) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            
            {/* LEFT COLUMN: Supplier Info (Issuer) */}
            <div className="flex flex-col items-start">
              <div className="h-20 flex items-center mb-4">
                <h2 className="text-2xl font-bold uppercase tracking-tight" style={{ color: primaryColor }}>
                  {supplier?.name || "Unknown Supplier"}
                </h2>
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-900 text-base mb-1">{supplier?.name}</p>
                <p className="whitespace-pre-line">{supplier?.address}</p>
                {supplier?.phone && <p>{labels.tel}: {supplier.phone}</p>}
                {supplier?.email && <p>{labels.email}: {supplier.email}</p>}

                <div className="mt-4 pt-2 text-xs text-gray-500 space-y-0.5 border-t border-gray-100">
                   {supplier?.nif && <p>{labels.sellerNif}: {supplier.nif}</p>}
                   {supplier?.rc && <p>{labels.sellerRc}: {supplier.rc}</p>}
                   {supplier?.nis && <p>{labels.sellerNis}: {supplier.nis}</p>}
                   {supplier?.ai && <p>{labels.sellerAi}: {supplier.ai}</p>}
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Invoice Details & Business (Bill To) */}
            <div className={`flex flex-col ${isRTL ? "items-start text-right" : "items-end text-right"}`}>
              {/* Invoice Title & Number */}
              <div className="mb-6 w-full">
                <h1 className="text-4xl font-light tracking-tight mb-1 uppercase text-gray-900">
                  {labels.invoice}
                </h1>
                <p className="text-lg font-medium text-gray-500 mb-4">#{invoice.invoiceNumber}</p>

                <div className={`grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 ${isRTL ? "text-right" : "text-right"}`}>
                  <div className="text-gray-400">{labels.issueDate}</div>
                  <div className="font-medium text-gray-900">
                    {new Date(invoice.invoiceDate).toLocaleDateString("en-GB")}
                  </div>

                  {invoice.paymentDate && (
                    <>
                      <div className="text-gray-400">{labels.paymentMethod}</div>
                      <div className="font-medium text-gray-900">
                        {new Date(invoice.paymentDate).toLocaleDateString("en-GB")}
                      </div>
                    </>
                  )}

                  {invoice.paymentMethod && (
                    <>
                      <div className="text-gray-400">{labels.paymentMethod}</div>
                      <div className="font-medium text-gray-900 capitalize">
                        {invoice.paymentMethod.replace("_", " ").toLowerCase()}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Business Info (Bill To) */}
              <div className={`w-full bg-gray-50/50 rounded-lg p-4 border border-gray-100 text-left ${isRTL ? "text-right" : "text-left"}`}>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{labels.billTo}</h3>
                <h2 className="font-bold text-lg text-gray-900 mb-1">{business?.name}</h2>
                {business?.tradeName && (
                  <p className="text-sm text-gray-600 mb-1">{business.tradeName}</p>
                )}

                <div className="text-sm text-gray-600 space-y-1">
                  <p className="whitespace-pre-line">{business?.address}</p>
                  <p>{business?.city}, Algeria</p>
                  <div className="grid grid-cols-1 gap-y-0.5 mt-2 text-xs text-gray-500 border-t border-gray-200 pt-2">
                    {business?.nif && <span>{labels.sellerNif}: {business.nif}</span>}
                    {business?.rc && <span>{labels.sellerRc}: {business.rc}</span>}
                    {business?.ai && <span>{labels.sellerAi}: {business.ai}</span>}
                    {business?.nis && <span>{labels.sellerNis}: {business.nis}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8 mt-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className={`text-left py-3 ${isRTL ? "pr-2" : "pl-2"} font-semibold text-gray-900 bg-gray-50/50`}>
                    {labels.description}
                  </th>
                  <th className="text-right py-3 font-semibold text-gray-900 bg-gray-50/50 w-16">{labels.qty}</th>
                  <th className="text-right py-3 font-semibold text-gray-900 bg-gray-50/50 w-24">{labels.price}</th>
                  <th className="text-right py-3 font-semibold text-gray-900 bg-gray-50/50 w-16">{labels.vat}</th>
                  <th className={`text-right py-3 ${isRTL ? "pl-2" : "pr-2"} font-semibold text-gray-900 bg-gray-50/50 w-24`}>
                    {labels.total}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoice.items?.map((item: any, index: number) => (
                  <tr key={index}>
                    <td className={`py-3 ${isRTL ? "pr-2" : "pl-2"} text-gray-900 font-medium`}>{item.description}</td>
                    <td className="py-3 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-3 text-right text-gray-600">
                      {item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-3 text-right text-gray-600">{item.vatRate}%</td>
                    <td className={`py-3 ${isRTL ? "pl-2" : "pr-2"} text-right text-gray-900 font-medium`}>
                      {item.lineTotalTtc.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Notes */}
          <div className="flex flex-col md:flex-row gap-8 mb-8 break-inside-avoid">
            <div className="flex-1">
              {invoice.description && (
                <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-3 text-sm text-gray-600">
                  <p className="font-semibold mb-1 text-gray-900">{labels.notes}</p>
                  <p>{invoice.description}</p>
                </div>
              )}
            </div>

            <div className="w-full md:w-72 ml-auto">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{labels.subtotal}</span>
                  <span className="font-medium text-gray-900">
                    {invoice.subtotalHt.toLocaleString("en-US", { minimumFractionDigits: 2 })} DZD
                  </span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{labels.vatTotal}</span>
                  <span className="font-medium text-gray-900">
                    {invoice.vatTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })} DZD
                  </span>
                </div>

                <Separator className="my-2" />

                <div className="flex justify-between items-end">
                  <span className="font-bold text-lg text-gray-900">{labels.grandTotal}</span>
                  <div className="text-right">
                    <span className="block font-bold text-xl text-gray-900" style={{ color: primaryColor }}>
                      {invoice.totalTtc.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                      <span className="text-sm font-medium text-gray-500">DZD</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className={`mb-8 break-inside-avoid flex flex-col ${isRTL ? "items-end text-right" : "items-start text-left"}`}>
            <p className="text-sm text-gray-500 mb-1">{labels.amountInWords}:</p>
            <p className={`text-gray-900 font-medium italic ${isRTL ? "border-r-4 pr-4" : "border-l-4 pl-4"} py-1`} style={{ borderColor: primaryColor }}>
              "{numberToWords(invoice.totalTtc, lang)}"
            </p>
          </div>

          {/* Signature & Stamp Section */}
          <div className="flex justify-end mb-8 break-inside-avoid">
            <div className="w-[400px] text-center relative">
              <p className="text-sm font-semibold text-gray-900 mb-4">{labels.signature}</p>
              
              <div className="h-64 w-full flex items-center justify-center relative overflow-hidden">
                 {/* Placeholder for supplier signature since we don't have it */}
                  <div className="w-full h-full border border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-300">{labels.signature}</span>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}