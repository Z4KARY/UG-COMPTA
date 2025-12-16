import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { Loader2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LegalDocumentView() {
  const data = useQuery(api.legalDocuments.getMyLegalDocument);

  const handlePrint = () => {
    window.print();
  };

  if (data === undefined) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (data === null || !data.document) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <h2 className="text-xl font-semibold">Document non trouvé</h2>
        <p className="text-muted-foreground">Ce document n'a pas encore été configuré.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <style>
        {`
          @media print {
            @page { size: A4; margin: 0; }
            body { 
              visibility: hidden; 
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              -webkit-print-color-adjust: exact;
            }
            .print-container { 
              visibility: visible;
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
            }
            .print-container * {
              visibility: visible;
            }
            /* Ensure no other elements interfere */
            nav, header, aside, .no-print { display: none !important; }
          }
        `}
      </style>
      <div className="container mx-auto px-4">
        <div className="mb-6 flex justify-between items-center max-w-[210mm] mx-auto print:hidden">
          <h1 className="text-2xl font-bold text-gray-900">{data.document.title}</h1>
          <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" />
            Print / PDF
          </Button>
        </div>
        
        <div className="flex justify-center">
          <LegalDocument 
            business={data.business} 
            content={data.document.content} 
            title={data.document.title}
            titleSize={data.document.titleSize}
            titleWeight={data.document.titleWeight}
          />
        </div>
      </div>
    </div>
  );
}