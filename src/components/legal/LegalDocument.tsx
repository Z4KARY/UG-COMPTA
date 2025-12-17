import { Separator } from "@/components/ui/separator";

interface LegalDocumentProps {
  business: any;
  content: string;
  title?: string;
  titleSize?: string;
  titleWeight?: string;
  displayRegistrationInHeader?: boolean;
  clientSignatureImageUrl?: string;
  requiresClientSignature?: boolean;
}

export function LegalDocument({ 
  business, 
  content, 
  title, 
  titleSize, 
  titleWeight,
  displayRegistrationInHeader = false,
  clientSignatureImageUrl,
  requiresClientSignature = false
}: LegalDocumentProps) {
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

  const RegistrationDetails = () => (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
      {isAE ? (
        <>
          <span>Auto-Entrepreneur Card: {business?.autoEntrepreneurCardNumber || "N/A"}</span>
          <span>NIF: {business?.nif || "N/A"}</span>
          <span>NIS: {business?.nis || "N/A"}</span>
        </>
      ) : (
        <>
          <span>RC: {business?.rc || "N/A"}</span>
          <span>NIF: {business?.nif || "N/A"}</span>
          <span>NIS: {business?.nis || "N/A"}</span>
          <span>AI: {business?.ai || "N/A"}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="w-full mx-auto print:w-full print:max-w-none">
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 0; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          a { text-decoration: none !important; color: inherit !important; }
          a[href]:after { content: none !important; }
          /* Hide Vly branding in print */
          [class*="vly"], [id*="vly"] { display: none !important; }
        `}
      </style>
      
      {/* Fixed Footer for Print - Ensures positioning at the absolute bottom of the page */}
      {!displayRegistrationInHeader && (
        <div className="hidden print:block fixed bottom-0 left-0 w-full z-50 bg-white">
          <div className="h-[20mm] flex items-end justify-center pb-2">
            <div className="text-center text-xs text-gray-400 w-full px-8">
              <RegistrationDetails />
            </div>
          </div>
        </div>
      )}

      <div
        className="print-container bg-white shadow-xl rounded-xl overflow-hidden print:overflow-visible border border-gray-100 w-full max-w-[210mm] mx-auto min-h-[297mm] print:min-h-[297mm] relative flex flex-col print:block print:shadow-none print:border-none"
        style={{ fontFamily: fontFamily }}
      >
        {/* Screen-only Footer - Absolute positioning within the container */}
        {!displayRegistrationInHeader && (
          <div className="absolute bottom-0 left-0 w-full print:hidden">
            <div className="h-[20mm] flex items-end justify-center pb-4">
              <div className="text-center text-xs text-gray-400 w-full px-8">
                <RegistrationDetails />
              </div>
            </div>
          </div>
        )}

        {/* Top Accent Line - Hide in print as we use table spacers */}
        <div className="h-2 w-full print:hidden" style={{ backgroundColor: primaryColor }}></div>

        {/* Table wrapper for print margins */}
        <table className="w-full print:w-full h-full">
          <thead className="hidden print:table-header-group">
            <tr><td><div className="h-[35mm]"></div></td></tr>
          </thead>
          <tfoot className="table-footer-group">
            <tr>
              <td className="align-bottom">
                {/* Spacer to reserve space for the fixed footer if needed */}
                {!displayRegistrationInHeader && <div className="h-[20mm]"></div>}
              </td>
            </tr>
          </tfoot>
          <tbody>
            <tr>
              <td className="print:px-[25mm] print:align-top w-full align-top">
                <div className="p-8 md:p-12 print:p-0 flex flex-col h-full min-h-full">
                  {/* Header */}
                  <div className="legal-document-header flex flex-col md:flex-row print:flex-row justify-between items-start gap-8 mb-12 print:mb-8">
                    <div className="w-full md:w-1/2 print:flex-1">
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt="Business Logo" 
                          className="h-20 object-contain mb-6 print:h-20 print:mb-4" 
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
                        
                        {displayRegistrationInHeader && (
                          <div className="mt-4 pt-2 border-t border-gray-100 text-xs text-gray-500">
                             <div className="flex flex-col gap-0.5">
                                {isAE ? (
                                  <>
                                    <span>Auto-Entrepreneur Card: {business?.autoEntrepreneurCardNumber || "N/A"}</span>
                                    <span>NIF: {business?.nif || "N/A"}</span>
                                    <span>NIS: {business?.nis || "N/A"}</span>
                                  </>
                                ) : (
                                  <>
                                    <span>RC: {business?.rc || "N/A"}</span>
                                    <span>NIF: {business?.nif || "N/A"}</span>
                                    <span>NIS: {business?.nis || "N/A"}</span>
                                    <span>AI: {business?.ai || "N/A"}</span>
                                  </>
                                )}
                             </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="w-full md:w-1/2 print:flex-1 text-right">
                      <h1 className={`${sizeClass} ${weightClass} tracking-tight mb-2 uppercase text-gray-900 break-words`}>
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
                    className="mb-0 text-gray-800 leading-relaxed tiptap-content text-justify flex-grow"
                    dangerouslySetInnerHTML={{ __html: content || "<p>Aucun contenu disponible.</p>" }}
                  />

                  {/* Signatures Section */}
                  <div className="flex justify-between items-end mb-0 print:break-inside-avoid mt-8">
                    {/* Client Signature (Left) */}
                    <div className="flex-1">
                      {(requiresClientSignature || clientSignatureImageUrl) && (
                        <div className="flex flex-col items-start">
                          <p className="text-sm font-semibold text-gray-900 mb-0 ml-2">Lu et approuvé</p>
                          <div className="ml-2 mt-[-10px]">
                            {clientSignatureImageUrl ? (
                              <img 
                                src={clientSignatureImageUrl} 
                                alt="Client Signature" 
                                className="h-[240px] w-auto max-w-full object-contain" 
                                crossOrigin="anonymous"
                              />
                            ) : (
                              <div className="w-64 h-32 border border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                <span className="text-xs text-gray-400">Signature du Client</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Business Signature & Stamp (Right) */}
                    <div className="flex-1 flex flex-col items-end">
                      <div className="text-right relative flex flex-col items-end">
                        <p className="text-sm font-semibold text-gray-900 mb-0 mr-2 text-right">Signature et Cachet</p>
                        
                        <div className="grid grid-cols-1 grid-rows-1 items-center justify-items-end mr-2 mt-[-10px]">
                          {/* Stamp Layer */}
                          {stampUrl && (
                            <img 
                              src={stampUrl} 
                              alt="Stamp" 
                              className="col-start-1 row-start-1 h-[240px] w-auto max-w-full object-contain opacity-80 rotate-[-12deg] mix-blend-multiply z-0" 
                              crossOrigin="anonymous"
                            />
                          )}
                          
                          {/* Signature Layer */}
                          {signatureUrl && (
                            <img 
                              src={signatureUrl} 
                              alt="Signature" 
                              className="col-start-1 row-start-1 h-[240px] w-auto max-w-full object-contain z-10" 
                              crossOrigin="anonymous"
                            />
                          )}
                          
                          {/* Placeholder if neither exists */}
                          {!stampUrl && !signatureUrl && (
                            <div className="col-start-1 row-start-1 w-64 h-32 border border-dashed border-gray-200 rounded-lg flex items-center justify-center">
                              <span className="text-xs text-gray-300">Cachet et Signature</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}