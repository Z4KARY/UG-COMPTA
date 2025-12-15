import { INVOICE_LABELS, InvoiceLanguage } from "@/lib/invoice-templates";
import { numberToWords } from "@/lib/numberToWords";
import { Separator } from "@/components/ui/separator";

interface InvoiceDocumentProps {
  invoice: any;
  business: any;
  items: any[];
  language?: string;
}

export function InvoiceDocument({ invoice, business, items, language = "fr" }: InvoiceDocumentProps) {
  const lang = (language in INVOICE_LABELS ? language : "fr") as InvoiceLanguage;
  const labels = INVOICE_LABELS[lang];
  const isRTL = lang === "ar";

  const primaryColor = business?.primaryColor || "#0f172a";
  const font = business?.font || "Inter";
  const invoiceFontFamily = font.includes(" ")
    ? `"${font}", Inter, sans-serif`
    : `${font}, Inter, sans-serif`;
  const logoUrl = business?.logoUrl;
  const signatureUrl = business?.signatureUrl;
  const stampUrl = business?.stampUrl;

  const isAE = business?.type === "auto_entrepreneur";
  const stampDuty = invoice?.stampDutyAmount ?? (invoice?.timbre ? 10 : 0);
  const subtotalHt = invoice?.subtotalHt ?? invoice?.totalHt ?? 0;

  return (
    <div className="w-full mx-auto print:w-full print:max-w-none">
      <div
        className="print-container bg-white shadow-xl rounded-xl overflow-hidden print:overflow-visible border border-gray-100 w-full max-w-[210mm] mx-auto min-h-[297mm] relative flex flex-col"
        style={{ fontFamily: invoiceFontFamily, direction: isRTL ? "rtl" : "ltr" }}
      >
        {/* Top Accent Line */}
        <div className="h-2 w-full print:hidden" style={{ backgroundColor: primaryColor }}></div>

        <div className="p-8 md:p-12 print:p-0 flex-grow flex flex-col">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
            <div className="w-full md:w-1/2">
              {logoUrl ? (
                <img src={logoUrl} alt="Business Logo" className="h-20 object-contain mb-6" />
              ) : (
                <div className="h-20 flex items-center mb-6">
                  <h2 className="text-2xl font-bold uppercase tracking-tight" style={{ color: primaryColor }}>
                    {business?.name}
                  </h2>
                </div>
              )}

              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-900 text-base mb-1">{business?.name}</p>
                {business?.tradeName && <p>{business.tradeName}</p>}
                <p className="whitespace-pre-line">{business?.address}</p>
                <p>{business?.city}, Algeria</p>
                {business?.phone && <p>{labels.tel}: {business.phone}</p>}
                {business?.email && <p>{labels.email}: {business.email}</p>}
              </div>
            </div>

            <div className={`w-full md:w-1/2 ${isRTL ? "md:text-left" : "md:text-right"}`}>
              <div className={`inline-block ${isRTL ? "text-right md:text-left" : "text-left md:text-right"}`}>
                <h1 className="text-4xl font-light tracking-tight mb-2 uppercase text-gray-900">
                  {invoice.type === "quote" ? labels.quote : invoice.type === "credit_note" ? labels.credit_note : labels.invoice}
                </h1>
                <p className="text-lg font-medium text-gray-500 mb-6">#{invoice.invoiceNumber}</p>

                <div className={`grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600 ${isRTL ? "text-right" : "text-left"}`}>
                  <div className="text-gray-400">{labels.issueDate}</div>
                  <div className={`font-medium text-gray-900 ${isRTL ? "text-left" : "text-right"}`}>
                    {new Date(invoice.issueDate).toLocaleDateString("en-GB")}
                  </div>

                  <div className="text-gray-400">{labels.dueDate}</div>
                  <div className={`font-medium text-gray-900 ${isRTL ? "text-left" : "text-right"}`}>
                    {new Date(invoice.dueDate).toLocaleDateString("en-GB")}
                  </div>

                  {invoice.paymentMethod && (
                    <>
                      <div className="text-gray-400">{labels.paymentMethod}</div>
                      <div className={`font-medium text-gray-900 ${isRTL ? "text-left" : "text-right"} capitalize`}>
                        {invoice.paymentMethod.replace("_", " ").toLowerCase()}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Bill To Section */}
          <div className="flex flex-col md:flex-row gap-8 mb-12">
            <div className="w-full md:w-1/2">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">{labels.billTo}</h3>
              <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
                <h2 className="font-bold text-lg text-gray-900 mb-1">{invoice.customer?.name}</h2>
                {invoice.customer?.contactPerson && (
                  <p className="text-sm text-gray-600 mb-2">Attn: {invoice.customer.contactPerson}</p>
                )}

                <div className="text-sm text-gray-600 space-y-1">
                  <p className="whitespace-pre-line">{invoice.customer?.address}</p>
                  <div className="flex gap-4 mt-2 text-xs text-gray-500">
                    {invoice.customer?.taxId && <span>{labels.sellerNif}: {invoice.customer.taxId}</span>}
                    {invoice.customer?.rc && <span>{labels.sellerRc}: {invoice.customer.rc}</span>}
                  </div>
                </div>
              </div>
            </div>

            {/* Business Legal IDs (Compact) */}
            <div className={`w-full md:w-1/2 flex flex-col justify-end ${isRTL ? "md:text-left" : "md:text-right"}`}>
              <div className="text-xs text-gray-400 space-y-1">
                {isAE ? (
                  <>
                    <p>Auto-Entrepreneur Card: {business?.autoEntrepreneurCardNumber || "N/A"}</p>
                    <p>{labels.sellerNif}: {business?.nif || "N/A"} | {labels.sellerNis}: {business?.nis || "N/A"}</p>
                    <p>CASNOS: {business?.ssNumber || "N/A"}</p>
                  </>
                ) : (
                  <>
                    <p>{labels.sellerRc}: {business?.rc || "N/A"}</p>
                    <p>{labels.sellerNif}: {business?.nif || "N/A"} | {labels.sellerNis}: {business?.nis || "N/A"}</p>
                    <p>{labels.sellerAi}: {business?.ai || "N/A"}</p>
                    {business?.capital && (
                      <p>{labels.sellerCapital}: {business.capital.toLocaleString()} {business.currency}</p>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-100">
                  <th className={`text-left py-3 ${isRTL ? "pr-4 rounded-r-lg" : "pl-4 rounded-l-lg"} font-semibold text-gray-900 bg-gray-50/50`}>
                    {labels.description}
                  </th>
                  <th className="text-right py-3 font-semibold text-gray-900 bg-gray-50/50 w-24">{labels.qty}</th>
                  <th className="text-right py-3 font-semibold text-gray-900 bg-gray-50/50 w-32">{labels.price}</th>
                  {!isAE && <th className="text-right py-3 font-semibold text-gray-900 bg-gray-50/50 w-24">{labels.vat}</th>}
                  <th className={`text-right py-3 ${isRTL ? "pl-4 rounded-l-lg" : "pr-4 rounded-r-lg"} font-semibold text-gray-900 bg-gray-50/50 w-32`}>
                    {labels.total}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items?.map((item, index) => (
                  <tr key={index}>
                    <td className={`py-4 ${isRTL ? "pr-4" : "pl-4"} text-gray-900 font-medium`}>{item.description}</td>
                    <td className="py-4 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-4 text-right text-gray-600">
                      {item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    {!isAE && <td className="py-4 text-right text-gray-600">{item.tvaRate}%</td>}
                    <td className={`py-4 ${isRTL ? "pl-4" : "pr-4"} text-right text-gray-900 font-medium`}>
                      {item.lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Notes */}
          <div className="flex flex-col md:flex-row gap-12 mb-12 print:break-inside-avoid">
            <div className="flex-1">
              {invoice.notes && (
                <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-4 text-sm text-yellow-800">
                  <p className="font-semibold mb-1 text-yellow-900">{labels.notes}</p>
                  <p>{invoice.notes}</p>
                </div>
              )}
            </div>

            <div className="w-full md:w-80">
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{labels.subtotal}</span>
                  <span className="font-medium text-gray-900">
                    {subtotalHt.toLocaleString("en-US", { minimumFractionDigits: 2 })} {invoice.currency}
                  </span>
                </div>
                {!isAE && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{labels.vatTotal}</span>
                    <span className="font-medium text-gray-900">
                      {invoice.totalTva.toLocaleString("en-US", { minimumFractionDigits: 2 })} {invoice.currency}
                    </span>
                  </div>
                )}
                {stampDuty > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>{labels.stampDuty}</span>
                    <span className="font-medium text-gray-900">
                      {stampDuty.toLocaleString("en-US", { minimumFractionDigits: 2 })} {invoice.currency}
                    </span>
                  </div>
                )}

                <Separator className="my-2" />

                <div className="flex justify-between items-end">
                  <span className="font-bold text-lg text-gray-900">{labels.grandTotal}</span>
                  <div className="text-right">
                    <span className="block font-bold text-2xl text-gray-900" style={{ color: primaryColor }}>
                      {invoice.totalTtc.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                      <span className="text-sm font-medium text-gray-500">{invoice.currency}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className="mb-12 print:break-inside-avoid">
            <p className="text-sm text-gray-500 mb-1">{labels.amountInWords}:</p>
            <p className={`text-gray-900 font-medium italic ${isRTL ? "border-r-4 pr-4" : "border-l-4 pl-4"} py-1`} style={{ borderColor: primaryColor }}>
              "{numberToWords(invoice.totalTtc, lang)}"
            </p>
          </div>

          {/* Signature & Stamp Section */}
          <div className="flex justify-end mb-12 print:break-inside-avoid">
            <div className="w-64 text-center relative">
              <p className="text-sm font-semibold text-gray-900 mb-4">{labels.signature}</p>
              
              <div className="h-32 w-full border border-dashed border-gray-200 rounded-lg flex items-center justify-center relative overflow-hidden">
                {/* Stamp Layer */}
                {stampUrl && (
                  <img 
                    src={stampUrl} 
                    alt="Stamp" 
                    className="absolute right-4 top-2 w-24 h-24 object-contain opacity-80 rotate-[-12deg] mix-blend-multiply" 
                  />
                )}
                
                {/* Signature Layer */}
                {signatureUrl && (
                  <img 
                    src={signatureUrl} 
                    alt="Signature" 
                    className="absolute inset-0 w-full h-full object-contain p-2 z-10" 
                  />
                )}
                
                {/* Placeholder if neither exists */}
                {!stampUrl && !signatureUrl && (
                  <span className="text-xs text-gray-300">Cachet et Signature</span>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto pt-8 border-t border-gray-100 text-center text-xs text-gray-400 print:break-inside-avoid">
            <p className="mb-1">{labels.legalFooter}</p>
            {isAE ? (
              <p>{labels.autoEntrepreneur}</p>
            ) : business?.fiscalRegime === "IFU" || business?.fiscalRegime === "forfaitaire" ? (
              <p>{labels.flatRate}</p>
            ) : null}
            <p className="mt-2">{labels.thankYou}</p>
          </div>
        </div>
      </div>
    </div>
  );
}