import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { Loader2, Printer, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReactToPrint } from "react-to-print";
import { useRef, useState } from "react";
import { toast } from "sonner";

export default function LegalDocumentView() {
  const data = useQuery(api.legalDocuments.getMyLegalDocument);
  const componentRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: data?.document?.title || "Document Juridique",
    onAfterPrint: () => console.log("Print finished"),
    onPrintError: (error) => {
      console.error("Print error:", error);
      toast.error("Erreur lors de l'impression");
    },
    pageStyle: `
      @page { size: auto; margin: 0mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
      }
    `,
  });

  const handleExportPdf = async () => {
    if (!componentRef.current) {
      console.error("Component ref is missing");
      return;
    }
    
    setIsExporting(true);
    console.log("Starting PDF export...");
    const element = componentRef.current;
    const opt = {
      margin: 0,
      filename: `${data?.document?.title || 'document-juridique'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0, logging: true, letterRendering: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    try {
      // @ts-ignore
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf().set(opt).from(element).save();
      console.log("PDF export successful");
      toast.success("PDF téléchargé avec succès");
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error("Erreur lors de l'export PDF. Vérifiez la console.");
    } finally {
      setIsExporting(false);
    }
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
      <div className="container mx-auto px-4">
        <div className="mb-6 flex justify-between items-center max-w-[210mm] mx-auto">
          <h1 className="text-2xl font-bold text-gray-900">{data.document.title}</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handlePrint()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
            <Button variant="outline" onClick={handleExportPdf} disabled={isExporting}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              PDF
            </Button>
          </div>
        </div>
        
        <div style={{ position: "absolute", left: "-9999px", top: 0, width: "210mm" }}>
          <div ref={componentRef}>
            <LegalDocument 
              business={data.business} 
              content={data.document.content} 
              title={data.document.title} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}