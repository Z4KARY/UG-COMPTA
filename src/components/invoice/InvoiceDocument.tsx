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

import { INVOICE_LABELS, InvoiceLanguage } from "@/lib/invoice-templates";
import { numberToWords } from "@/lib/numberToWords";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

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
  const template = business?.template || "modern";
  const isClassic = template === "classic";
  const isMinimal = template === "minimal";

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
    <div className="w-full mx-auto print:w-full print:max-w-none print:h-auto print:overflow-visible">
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 5mm; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; height: auto !important; }
          html { height: auto !important; }
        `}
      </style>
      <div
        className={cn(
          "print-container bg-white shadow-xl rounded-xl overflow-hidden print:overflow-visible border border-gray-100 w-full max-w-[210mm] mx-auto min-h-[297mm] print:min-h-0 print:h-auto relative flex flex-col print:block print:shadow-none print:border-none",
          isClassic && "border-2 border-gray-900 rounded-none"
        )}
        style={{ fontFamily: invoiceFontFamily, direction: isRTL ? "rtl" : "ltr" }}
      >
        {/* Top Accent Line */}
        {!isMinimal && (
          <div 
            className={cn("w-full print:hidden", isClassic ? "h-1 border-b-4 border-double" : "h-2")} 
            style={{ 
              backgroundColor: isClassic ? "transparent" : primaryColor,
              borderColor: isClassic ? primaryColor : undefined
            }}
          ></div>
        )}

        <div className="p-8 md:p-12 print:p-2 flex-grow print:flex-grow-0 flex flex-col">
          
          {/* COMPACT HEADER GRID: Left (Business) | Right (Invoice + Customer) */}
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 print:gap-1 mb-8 print:mb-1">
            
            {/* LEFT COLUMN: Business Info */}
            <div className="flex flex-col items-start">
              {logoUrl ? (
                <img src={logoUrl} alt="Business Logo" className="h-40 object-contain mb-4 print:h-20 print:mb-1" />
              ) : (
                <div className="h-20 flex items-center mb-4 print:mb-1 print:h-12">
                  <h2 className="text-2xl font-bold uppercase tracking-tight" style={{ color: primaryColor }}>
                    {business?.name}
                  </h2>
                </div>
              )}

              <div className="text-sm text-gray-600 space-y-1 print:text-[10px] print:leading-tight print:space-y-0">
                <p className="font-semibold text-gray-900 text-base print:text-xs mb-1 print:mb-0">{business?.name}</p>
                {business?.tradeName && <p>{business.tradeName}</p>}
                <p className="whitespace-pre-line">{business?.address}</p>
                <p>{business?.city}, Algeria</p>
                {business?.phone && <p>{labels.tel}: {business.phone}</p>}
                {business?.email && <p>{labels.email}: {business.email}</p>}

                <div className="mt-4 pt-2 text-xs text-gray-500 space-y-0.5 border-t border-gray-100 print:mt-1 print:pt-1 print:border-gray-200">
                  {isAE ? (
                    <>
                      <p>Auto-Entrepreneur: {business?.autoEntrepreneurCardNumber || "N/A"}</p>
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

            {/* RIGHT COLUMN: Invoice Details & Customer */}
            <div className={`flex flex-col ${isRTL ? "items-start text-right" : "items-end text-right"}`}>
              {/* Invoice Title & Number */}
              <div className="mb-6 print:mb-1 w-full">
                <h1 className={cn(
                  "text-4xl tracking-tight mb-1 uppercase text-gray-900 print:text-5xl print:mb-0",
                  isClassic ? "font-serif font-bold" : "font-light",
                  isMinimal ? "text-3xl font-normal" : ""
                )}>
                  {invoice.type === "quote" ? labels.quote : invoice.type === "credit_note" ? labels.credit_note : labels.invoice}
                </h1>
                <p className="text-lg font-medium text-gray-500 mb-4 print:mb-1 print:text-sm">#{invoice.invoiceNumber}</p>

                <div className={`grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-600 print:text-[10px] print:leading-tight ${isRTL ? "text-right" : "text-right"}`}>
                  <div className="text-gray-400">{labels.issueDate}</div>
                  <div className="font-medium text-gray-900">
                    {new Date(invoice.issueDate).toLocaleDateString("en-GB")}
                  </div>

                  <div className="text-gray-400">{labels.dueDate}</div>
                  <div className="font-medium text-gray-900">
                    {new Date(invoice.dueDate).toLocaleDateString("en-GB")}
                  </div>

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

              {/* Customer Info (Bill To) */}
              <div className={cn(
                "w-full p-4 text-left",
                isRTL ? "text-right" : "text-left",
                // Template styles
                isMinimal ? "bg-transparent border-none p-0" : 
                isClassic ? "bg-white border-2 border-gray-100 rounded-none" :
                "bg-gray-50/50 rounded-lg border border-gray-100", // Modern (default)
                "print:p-1 print:bg-transparent print:border-gray-200"
              )}>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 print:mb-0.5">{labels.billTo}</h3>
                <h2 className="font-bold text-lg text-gray-900 mb-1 print:text-sm print:mb-0">{invoice.customer?.name}</h2>
                {invoice.customer?.contactPerson && (
                  <p className="text-sm text-gray-600 mb-1 print:text-[10px] print:mb-0">Attn: {invoice.customer.contactPerson}</p>
                )}

                <div className="text-sm text-gray-600 space-y-1 print:text-[10px] print:leading-tight print:space-y-0">
                  <p className="whitespace-pre-line">{invoice.customer?.address}</p>
                  <div className={cn(
                    "grid grid-cols-1 gap-y-0.5 mt-2 text-xs text-gray-500 pt-2 print:mt-1 print:pt-1 print:text-[9px]",
                    !isMinimal && "border-t border-gray-200"
                  )}>
                    {invoice.customer?.taxId && <span>{labels.sellerNif}: {invoice.customer.taxId}</span>}
                    {invoice.customer?.rc && <span>{labels.sellerRc}: {invoice.customer.rc}</span>}
                    {invoice.customer?.ai && <span>{labels.sellerAi}: {invoice.customer.ai}</span>}
                    {invoice.customer?.nis && <span>{labels.sellerNis}: {invoice.customer.nis}</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8 mt-8 print:mb-1 print:mt-4">
            <table className="w-full text-sm print:text-[10px]">
              <thead>
                <tr className={cn(
                  "border-b-2 border-gray-100",
                  isClassic && "border-gray-900 border-t-2",
                  isMinimal && "border-gray-200"
                )}>
                  <th className={cn(
                    "text-left py-3 print:py-1 font-semibold text-gray-900",
                    isRTL ? "pr-2" : "pl-2",
                    // Template styles
                    isMinimal ? "bg-transparent" :
                    isClassic ? "bg-transparent uppercase tracking-widest" :
                    "bg-gray-50/50", // Modern
                    "print:bg-gray-50"
                  )}>
                    {labels.description}
                  </th>
                  <th className={cn(
                    "text-right py-3 print:py-1 font-semibold text-gray-900 w-16",
                    // Template styles
                    isMinimal ? "bg-transparent" :
                    isClassic ? "bg-transparent uppercase tracking-widest" :
                    "bg-gray-50/50", // Modern
                    "print:bg-gray-50"
                  )}>{labels.qty}</th>
                  <th className={cn(
                    "text-right py-3 print:py-1 font-semibold text-gray-900 w-24",
                    // Template styles
                    isMinimal ? "bg-transparent" :
                    isClassic ? "bg-transparent uppercase tracking-widest" :
                    "bg-gray-50/50", // Modern
                    "print:bg-gray-50"
                  )}>{labels.price}</th>
                  {!isAE && <th className={cn(
                    "text-right py-3 print:py-1 font-semibold text-gray-900 w-16",
                    // Template styles
                    isMinimal ? "bg-transparent" :
                    isClassic ? "bg-transparent uppercase tracking-widest" :
                    "bg-gray-50/50", // Modern
                    "print:bg-gray-50"
                  )}>{labels.vat}</th>}
                  <th className={cn(
                    "text-right py-3 print:py-1 font-semibold text-gray-900 w-24",
                    isRTL ? "pl-2" : "pr-2",
                    // Template styles
                    isMinimal ? "bg-transparent" :
                    isClassic ? "bg-transparent uppercase tracking-widest" :
                    "bg-gray-50/50", // Modern
                    "print:bg-gray-50"
                  )}>
                    {labels.total}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items?.map((item, index) => (
                  <tr key={index}>
                    <td className={`py-3 print:py-0.5 ${isRTL ? "pr-2" : "pl-2"} text-gray-900 font-medium`}>{item.description}</td>
                    <td className="py-3 print:py-0.5 text-right text-gray-600">{item.quantity}</td>
                    <td className="py-3 print:py-0.5 text-right text-gray-600">
                      {item.unitPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                    {!isAE && <td className="py-3 print:py-0.5 text-right text-gray-600">{item.tvaRate}%</td>}
                    <td className={`py-3 print:py-0.5 ${isRTL ? "pl-2" : "pr-2"} text-right text-gray-900 font-medium`}>
                      {item.lineTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Notes */}
          <div className="flex flex-col md:flex-row print:flex-row gap-8 print:gap-2 mb-8 print:mb-1 print:break-inside-avoid">
            <div className="flex-1">
              {invoice.notes && (
                <div className={cn(
                  "text-sm p-3",
                  // Template styles
                  isMinimal ? "bg-transparent border-l-2 border-gray-200 rounded-none pl-4 text-gray-600" :
                  isClassic ? "bg-white border border-gray-300 rounded-none text-gray-800" :
                  "bg-yellow-50/50 border border-yellow-100 rounded-lg text-yellow-800", // Modern
                  "print:bg-transparent print:border-gray-200 print:text-gray-800 print:p-1 print:text-[10px]"
                )}>
                  <p className={cn(
                    "font-semibold mb-1",
                    isMinimal ? "text-gray-900" :
                    isClassic ? "text-gray-900 uppercase" :
                    "text-yellow-900",
                    "print:text-gray-900"
                  )}>{labels.notes}</p>
                  <p>{invoice.notes}</p>
                </div>
              )}
            </div>

            <div className="w-full md:w-72 print:w-64 print:ml-auto">
              <div className="space-y-2 print:space-y-0.5">
                <div className="flex justify-between text-sm text-gray-600 print:text-[10px]">
                  <span>{labels.subtotal}</span>
                  <span className="font-medium text-gray-900">
                    {subtotalHt.toLocaleString("en-US", { minimumFractionDigits: 2 })} {invoice.currency}
                  </span>
                </div>
                {!isAE && (
                  <div className="flex justify-between text-sm text-gray-600 print:text-[10px]">
                    <span>{labels.vatTotal}</span>
                    <span className="font-medium text-gray-900">
                      {invoice.totalTva.toLocaleString("en-US", { minimumFractionDigits: 2 })} {invoice.currency}
                    </span>
                  </div>
                )}
                {stampDuty > 0 && (
                  <div className="flex justify-between text-sm text-gray-600 print:text-[10px]">
                    <span>{labels.stampDuty}</span>
                    <span className="font-medium text-gray-900">
                      {stampDuty.toLocaleString("en-US", { minimumFractionDigits: 2 })} {invoice.currency}
                    </span>
                  </div>
                )}

                <Separator className="my-2 print:my-1" />

                <div className="flex justify-between items-end">
                  <span className="font-bold text-lg text-gray-900 print:text-sm">{labels.grandTotal}</span>
                  <div className="text-right">
                    <span className="block font-bold text-xl text-gray-900 print:text-lg" style={{ color: primaryColor }}>
                      {invoice.totalTtc.toLocaleString("en-US", { minimumFractionDigits: 2 })}{" "}
                      <span className="text-sm font-medium text-gray-500 print:text-[10px]">{invoice.currency}</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Amount in Words */}
          <div className={`mb-8 print:mb-2 print:break-inside-avoid flex flex-col ${isRTL ? "items-end text-right" : "items-start text-left"}`}>
            <p className="text-sm text-gray-500 mb-1 print:text-[10px]">{labels.amountInWords}:</p>
            <p className={`text-gray-900 font-medium italic ${isRTL ? "border-r-4 pr-4" : "border-l-4 pl-4"} py-1 print:text-xs`} style={{ borderColor: primaryColor }}>
              "{numberToWords(invoice.totalTtc, lang)}"
            </p>
          </div>

          {/* Signature & Stamp Section */}
          <div className="flex justify-end mb-8 print:mb-0 print:break-inside-avoid">
            <div className="w-[400px] print:w-[600px] text-center relative">
              <p className="text-sm font-semibold text-gray-900 mb-4 print:mb-1 print:text-xs">{labels.signature}</p>
              
              {/* Increased height for print as requested (2x scaling) */}
              <div className="h-48 print:h-80 w-full flex items-center justify-center relative">
                {/* Stamp Layer */}
                {stampUrl && (
                  <img 
                    src={stampUrl} 
                    alt="Stamp" 
                    className="absolute right-0 top-0 w-48 h-48 print:w-96 print:h-96 object-contain opacity-80 rotate-[-12deg] mix-blend-multiply" 
                  />
                )}
                
                {/* Signature Layer */}
                {signatureUrl && (
                  <img 
                    src={signatureUrl} 
                    alt="Signature" 
                    className="absolute inset-0 w-full h-full object-contain z-10" 
                  />
                )}
                
                {/* Placeholder if neither exists */}
                {!stampUrl && !signatureUrl && (
                  <div className="w-full h-full border border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-xs text-gray-300">Cachet et Signature</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-auto print:mt-1 pt-6 print:pt-1 border-t border-gray-100 text-center text-xs text-gray-400 print:text-[9px] print:break-inside-avoid">
            <p className="mb-1 print:mb-0">{labels.legalFooter}</p>
            {isAE ? (
              <p>{labels.autoEntrepreneur}</p>
            ) : business?.fiscalRegime === "IFU" || business?.fiscalRegime === "forfaitaire" ? (
              <p>{labels.flatRate}</p>
            ) : null}
            <p className="mt-2 print:mt-0.5">{labels.thankYou}</p>
          </div>
        </div>
      </div>
    </div>
  );
}