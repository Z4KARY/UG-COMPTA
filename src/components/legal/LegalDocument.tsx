import { Separator } from "@/components/ui/separator";

interface LegalDocumentProps {
  business: any;
  content: string;
  title?: string;
  titleSize?: string;
  titleWeight?: string;
}

export function LegalDocument({ business, content, title, titleSize, titleWeight }: LegalDocumentProps) {
  const primaryColor = business?.primaryColor || "#0f172a";
  const font = business?.font || "Inter";
  const fontFamily = font.includes(" ")
    ? `"${font}", Inter, sans-serif`
    : `${font}, Inter, sans-serif`;
  const logoUrl = business?.logoUrl;
  const signatureUrl = business?.signatureUrl;
  const stampUrl = business?.stampUrl;

  const isAE = business?.type === "auto_entrepreneur";

  // Defaults matching previous hardcoded values
  const sizeClass = titleSize || "text-3xl";
  const weightClass = titleWeight || "font-light";

  return (
    <div className="w-full mx-auto print:w-full print:max-w-none">
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 5mm; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; height: auto !important; }
          html { height: auto !important; }

          /* Explicit print styles for the header */
          .legal-document-header {
            display: flex !important;
            flex-direction: row !important;
            justify-content: space-between !important;
            align-items: flex-start !important;
          }
          .legal-document-header > div:first-child {
            width: 50% !important;
          }
          .legal-document-header > div:last-child {
            width: 50% !important;
            text-align: right !important;
          }
        `}
      </style>
      <div
        className="print-container bg-white shadow-xl rounded-xl overflow-hidden print:overflow-visible border border-gray-100 w-full max-w-[210mm] mx-auto min-h-[297mm] relative flex flex-col"
        style={{ fontFamily: fontFamily }}
      >
        {/* Top Accent Line */}
        <div className="h-2 w-full print:hidden" style={{ backgroundColor: primaryColor }}></div>

        <div className="p-8 md:p-12 print:p-0 flex-grow flex flex-col">
          {/* Header */}
          <div className="flex flex-col md:flex-row print:flex-row justify-between items-start gap-8 mb-12 print:mb-6">
            <div className="w-full md:w-1/2 print:w-1/2">
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt="Business Logo" 
                  className="h-20 object-contain mb-6 print:h-16 print:mb-4" 
                  crossOrigin="anonymous" 
                />
              ) : (
                <div className="h-20 flex items-center mb-6 print:h-16 print:mb-4">
                  <h2 className="text-2xl font-bold uppercase tracking-tight" style={{ color: primaryColor }}>
                    {business?.name}
                  </h2>
                </div>
              )}

              <div className="text-sm text-gray-600 space-y-1 print:text-xs">
                <p className="font-semibold text-gray-900 text-base mb-1 print:text-sm">{business?.name}</p>
                {business?.tradeName && <p>{business.tradeName}</p>}
                <p className="whitespace-pre-line">{business?.address}</p>
                <p>{business?.city}, Algeria</p>
                {business?.phone && <p>Tel: {business.phone}</p>}
                {business?.email && <p>Email: {business.email}</p>}
              </div>
            </div>

            <div className="w-full md:w-1/2 print:w-1/2 text-right">
              <h1 className={`${sizeClass} ${weightClass} tracking-tight mb-2 uppercase text-gray-900`}>
                {title || "DOCUMENT JURIDIQUE"}
              </h1>
              <p className="text-sm text-gray-500">
                Date: {new Date().toLocaleDateString("fr-FR")}
              </p>
            </div>
          </div>

          <Separator className="mb-8" />

          {/* Content Body */}
          <div 
            className="flex-grow mb-12 text-gray-800 leading-relaxed tiptap-content"
            dangerouslySetInnerHTML={{ __html: content || "<p>Aucun contenu disponible.</p>" }}
          />

          {/* Signature & Stamp Section */}
          <div className="flex justify-end mb-12 print:break-inside-avoid">
            <div className="w-[300px] text-center relative">
              <p className="text-sm font-semibold text-gray-900 mb-4">Signature et Cachet</p>
              
              <div className="h-48 w-full flex items-center justify-center relative overflow-hidden">
                {/* Stamp Layer */}
                {stampUrl && (
                  <img 
                    src={stampUrl} 
                    alt="Stamp" 
                    className="absolute right-0 top-0 w-40 h-40 object-contain opacity-80 rotate-[-12deg] mix-blend-multiply" 
                    crossOrigin="anonymous"
                  />
                )}
                
                {/* Signature Layer */}
                {signatureUrl && (
                  <img 
                    src={signatureUrl} 
                    alt="Signature" 
                    className="absolute inset-0 w-full h-full object-contain z-10" 
                    crossOrigin="anonymous"
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
          <div className="mt-auto pt-8 border-t border-gray-100 text-center text-xs text-gray-400 print:break-inside-avoid">
            <div className="space-y-1">
                {isAE ? (
                  <>
                    <span>Auto-Entrepreneur Card: {business?.autoEntrepreneurCardNumber || "N/A"}</span>
                    <span className="mx-2">|</span>
                    <span>NIF: {business?.nif || "N/A"}</span>
                    <span className="mx-2">|</span>
                    <span>NIS: {business?.nis || "N/A"}</span>
                  </>
                ) : (
                  <>
                    <span>RC: {business?.rc || "N/A"}</span>
                    <span className="mx-2">|</span>
                    <span>NIF: {business?.nif || "N/A"}</span>
                    <span className="mx-2">|</span>
                    <span>NIS: {business?.nis || "N/A"}</span>
                    <span className="mx-2">|</span>
                    <span>AI: {business?.ai || "N/A"}</span>
                  </>
                )}
            </div>
            <p className="mt-2">Document généré par UGCOMPTA</p>
          </div>
        </div>
      </div>
    </div>
  );
}