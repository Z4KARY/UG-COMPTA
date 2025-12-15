import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";

export default function LegalDocumentView() {
  const data = useQuery(api.legalDocuments.getMyLegalDocument);
  const componentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: data?.document?.title || "Document Juridique",
  });

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
      <div className="container mx-auto px-4">
        <div className="mb-6 flex justify-between items-center max-w-[210mm] mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">{data.document.title}</h1>
          <Button onClick={() => handlePrint()}>Imprimer / PDF</Button>
        </div>
        
        <div ref={componentRef}>
          <LegalDocument 
            business={data.business} 
            content={data.document.content} 
            title={data.document.title} 
          />
        </div>
      </div>
    </div>
  );
}