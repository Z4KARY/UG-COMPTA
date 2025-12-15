import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Eye, Printer, Download } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { RichTextEditor } from "@/components/RichTextEditor";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { LEGAL_TEMPLATES, LegalTemplate } from "@/lib/legal-templates";
import { FileText, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useReactToPrint } from "react-to-print";
import { useRef } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
// @ts-ignore
import html2pdf from "html2pdf.js";

export default function LegalDocumentSettings() {
  const { t } = useLanguage();
  const data = useQuery(api.legalDocuments.getMyLegalDocument);
  const saveDocument = useMutation(api.legalDocuments.save);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LegalTemplate | null>(null);

  const printRef = useRef<HTMLDivElement>(null);
  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: title || t("legal.title"),
    onAfterPrint: () => console.log("Print finished"),
    onPrintError: (error) => {
      console.error("Print error:", error);
      toast.error(t("legal.toast.printError"));
    },
    pageStyle: `
      @page { size: auto; margin: 0mm; }
      @media print {
        body { -webkit-print-color-adjust: exact; }
      }
    `,
  });

  const handleExportPdf = async () => {
    if (!printRef.current) {
      console.error("Print ref is missing");
      return;
    }
    
    setIsExporting(true);
    console.log("Starting PDF export...");
    const element = printRef.current;
    const opt = {
      margin: 0,
      filename: `${title || 'document-juridique'}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, scrollY: 0, logging: true, letterRendering: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'portrait' as const }
    };

    try {
      // @ts-ignore
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf().set(opt).from(element).save();
      console.log("PDF export successful");
      toast.success(t("legal.toast.pdfSuccess"));
    } catch (error) {
      console.error("PDF Export Error:", error);
      toast.error(t("legal.toast.pdfError"));
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (data?.document) {
      setTitle(data.document.title || "");
      setContent(data.document.content || "");
    }
  }, [data]);

  const handleTemplateSelect = (template: LegalTemplate) => {
    setTitle(template.title);
    setContent(template.content);
    toast.success(t("legal.toast.templateApplied"));
  };

  const handleSave = async () => {
    if (!data?.business) return;
    
    setIsSaving(true);
    try {
      await saveDocument({
        businessId: data.business._id,
        content,
        title,
      });
      toast.success(t("legal.toast.saveSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(t("legal.toast.saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  if (data === undefined) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (data === null) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center">
          <h2 className="text-xl font-semibold">Aucune entreprise trouvée</h2>
          <p className="text-muted-foreground">Veuillez d'abord configurer votre entreprise.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("legal.title")}</h1>
            <p className="text-muted-foreground">
              {t("legal.subtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  {t("legal.templates")}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>{t("legal.chooseTemplate")}</DialogTitle>
                  <DialogDescription>
                    {t("legal.templateWarning")}
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[400px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                    {LEGAL_TEMPLATES.map((template) => (
                      <div 
                        key={template.id} 
                        className="border rounded-lg p-4 hover:border-primary cursor-pointer transition-all hover:bg-muted/50 flex flex-col gap-3"
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="flex justify-between items-start">
                          <Badge variant="secondary" className="capitalize">{template.category}</Badge>
                          {selectedTemplate?.id === template.id && (
                            <div className="bg-primary text-primary-foreground rounded-full p-1">
                              <Check className="h-3 w-3" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">{template.title}</h3>
                          <p className="text-sm text-muted-foreground line-clamp-2">{template.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">{t("common.cancel") || "Annuler"}</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button 
                      disabled={!selectedTemplate} 
                      onClick={() => selectedTemplate && handleTemplateSelect(selectedTemplate)}
                    >
                      {t("legal.applyTemplate")}
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={() => handlePrint()}>
              <Printer className="mr-2 h-4 w-4" />
              {t("declarations.print") || "Imprimer"}
            </Button>

            <Button variant="outline" onClick={handleExportPdf} disabled={isExporting}>
              {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              PDF
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  {t("invoices.view") || "Aperçu"}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <LegalDocument 
                  business={data.business} 
                  content={content} 
                  title={title} 
                />
              </DialogContent>
            </Dialog>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              {t("settings.save") || "Enregistrer"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>{t("legal.editor")}</CardTitle>
              <CardDescription>
                {t("legal.editorDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">{t("legal.documentTitle")}</Label>
                <Input
                  id="title"
                  placeholder={t("legal.titlePlaceholder")}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">{t("legal.content")}</Label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder={t("legal.contentPlaceholder")}
                />
              </div>
            </CardContent>
          </Card>

          <div className="hidden lg:block lg:col-span-1">
             <Card className="h-full">
                <CardHeader>
                  <CardTitle>{t("legal.livePreview")}</CardTitle>
                </CardHeader>
                <CardContent className="bg-gray-100/50 p-4 rounded-lg overflow-hidden">
                   <div className="scale-[0.65] origin-top-left w-[150%] h-[150%]">
                      <LegalDocument 
                        business={data.business} 
                        content={content} 
                        title={title} 
                      />
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>

        {/* Hidden Print Component */}
        <div style={{ position: "absolute", left: "-9999px", top: 0, width: "210mm" }}>
            <div ref={printRef}>
                <LegalDocument 
                  business={data.business} 
                  content={content} 
                  title={title} 
                />
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}