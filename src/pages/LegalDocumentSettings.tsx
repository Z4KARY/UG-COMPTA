import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Eye, Printer } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createPortal } from "react-dom";
import { Slider } from "@/components/ui/slider";

export default function LegalDocumentSettings() {
  const data = useQuery(api.legalDocuments.getMyLegalDocument);
  const saveDocument = useMutation(api.legalDocuments.save);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [titleSize, setTitleSize] = useState("text-3xl");
  const [titleWeight, setTitleWeight] = useState("font-light");
  const [displayRegistrationInHeader, setDisplayRegistrationInHeader] = useState(false);
  const [requiresClientSignature, setRequiresClientSignature] = useState(false);
  const [displayWatermark, setDisplayWatermark] = useState(false);
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.04);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<LegalTemplate | null>(null);

  const handlePrint = () => {
    window.print();
  };

  useEffect(() => {
    if (data?.document) {
      setTitle(data.document.title || "");
      setContent(data.document.content || "");
      if (data.document.titleSize) setTitleSize(data.document.titleSize);
      if (data.document.titleWeight) setTitleWeight(data.document.titleWeight);
      if (data.document.displayRegistrationInHeader !== undefined) {
        setDisplayRegistrationInHeader(data.document.displayRegistrationInHeader);
      }
      if (data.document.requiresClientSignature !== undefined) {
        setRequiresClientSignature(data.document.requiresClientSignature);
      }
      if (data.document.displayWatermark !== undefined) {
        setDisplayWatermark(data.document.displayWatermark);
      }
      if (data.document.watermarkOpacity !== undefined) {
        setWatermarkOpacity(data.document.watermarkOpacity);
      }
    }
  }, [data]);

  const handleTemplateSelect = (template: LegalTemplate) => {
    setTitle(template.title);
    setContent(template.content);
    if (template.displayRegistrationInHeader !== undefined) {
      setDisplayRegistrationInHeader(template.displayRegistrationInHeader);
    } else {
      setDisplayRegistrationInHeader(true);
    }
    if (template.requiresClientSignature !== undefined) {
      setRequiresClientSignature(template.requiresClientSignature);
    } else {
      setRequiresClientSignature(false);
    }
    toast.success("Modèle appliqué avec succès");
  };

  const handleSave = async () => {
    if (!data?.business) return;
    
    setIsSaving(true);
    try {
      await saveDocument({
        businessId: data.business._id,
        content,
        title,
        titleSize,
        titleWeight,
        displayRegistrationInHeader,
        requiresClientSignature,
        displayWatermark,
        watermarkOpacity,
      });
      toast.success("Document sauvegardé avec succès");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la sauvegarde");
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
            <h1 className="text-3xl font-bold tracking-tight">Document Juridique</h1>
            <p className="text-muted-foreground">
              Configurez votre document juridique personnalisé (CGV, Contrat, etc.)
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <FileText className="h-4 w-4" />
                  Modèles
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Choisir un modèle</DialogTitle>
                  <DialogDescription>
                    Sélectionnez un modèle de document pour commencer. Attention, cela remplacera le contenu actuel.
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
                    <Button variant="outline">Annuler</Button>
                  </DialogClose>
                  <DialogClose asChild>
                    <Button 
                      disabled={!selectedTemplate} 
                      onClick={() => selectedTemplate && handleTemplateSelect(selectedTemplate)}
                    >
                      Appliquer le modèle
                    </Button>
                  </DialogClose>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            
            <Button variant="outline" onClick={() => handlePrint()}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimer / PDF
            </Button>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Eye className="mr-2 h-4 w-4" />
                  Aperçu
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <LegalDocument 
                  business={data.business} 
                  content={content} 
                  title={title} 
                  titleSize={titleSize}
                  titleWeight={titleWeight}
                  displayRegistrationInHeader={displayRegistrationInHeader}
                  requiresClientSignature={requiresClientSignature}
                  displayWatermark={displayWatermark}
                  watermarkOpacity={watermarkOpacity}
                />
              </DialogContent>
            </Dialog>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Enregistrer
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle>Éditeur</CardTitle>
              <CardDescription>
                Rédigez le contenu de votre document.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Titre du document</Label>
                <Input
                  id="title"
                  placeholder="Ex: Conditions Générales de Vente"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Taille du titre</Label>
                  <Select value={titleSize} onValueChange={setTitleSize}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text-xl">Petit</SelectItem>
                      <SelectItem value="text-2xl">Moyen</SelectItem>
                      <SelectItem value="text-3xl">Grand</SelectItem>
                      <SelectItem value="text-4xl">Très Grand</SelectItem>
                      <SelectItem value="text-5xl">Géant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Style du titre</Label>
                  <Select value={titleWeight} onValueChange={setTitleWeight}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="font-light">Léger</SelectItem>
                      <SelectItem value="font-normal">Normal</SelectItem>
                      <SelectItem value="font-medium">Moyen</SelectItem>
                      <SelectItem value="font-semibold">Semi-Gras</SelectItem>
                      <SelectItem value="font-bold">Gras</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <input
                  type="checkbox"
                  id="displayRegistrationInHeader"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={displayRegistrationInHeader}
                  onChange={(e) => setDisplayRegistrationInHeader(e.target.checked)}
                />
                <Label htmlFor="displayRegistrationInHeader" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                  Afficher les infos légales dans l'en-tête (au lieu du pied de page)
                </Label>
              </div>

              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <input
                  type="checkbox"
                  id="requiresClientSignature"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={requiresClientSignature}
                  onChange={(e) => setRequiresClientSignature(e.target.checked)}
                />
                <Label htmlFor="requiresClientSignature" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                  Inclure un emplacement pour la signature du client
                </Label>
              </div>

              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <input
                  type="checkbox"
                  id="displayWatermark"
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  checked={displayWatermark}
                  onChange={(e) => setDisplayWatermark(e.target.checked)}
                />
                <Label htmlFor="displayWatermark" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                  Afficher le filigrane (logo en arrière-plan)
                </Label>
              </div>

              {displayWatermark && (
                <div className="space-y-2 border p-3 rounded-md">
                  <div className="flex justify-between">
                    <Label>Opacité du filigrane</Label>
                    <span className="text-sm text-muted-foreground">{Math.round(watermarkOpacity * 100)}%</span>
                  </div>
                  <Slider
                    value={[watermarkOpacity]}
                    min={0.01}
                    max={0.5}
                    step={0.01}
                    onValueChange={(value) => setWatermarkOpacity(value[0])}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="content">Contenu</Label>
                <RichTextEditor
                  value={content}
                  onChange={setContent}
                  placeholder="Saisissez le contenu de votre document ici..."
                />
              </div>
            </CardContent>
          </Card>

          <div className="hidden lg:block lg:col-span-1">
             <Card className="h-full">
                <CardHeader>
                  <CardTitle>Aperçu en direct</CardTitle>
                </CardHeader>
                <CardContent className="bg-gray-100/50 p-4 rounded-lg overflow-hidden">
                   <div className="scale-[0.65] origin-top-left w-[150%] h-[150%]">
                      <LegalDocument 
                        business={data.business} 
                        content={content} 
                        title={title}
                        titleSize={titleSize}
                        titleWeight={titleWeight}
                        displayRegistrationInHeader={displayRegistrationInHeader}
                        requiresClientSignature={requiresClientSignature}
                        displayWatermark={displayWatermark}
                        watermarkOpacity={watermarkOpacity}
                      />
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>

        {/* Portal for Print Component - Renders outside root to avoid layout issues */}
        {createPortal(
          <div id="print-area" className="hidden print:block">
            <LegalDocument 
              business={data.business} 
              content={content} 
              title={title}
              titleSize={titleSize}
              titleWeight={titleWeight}
              displayRegistrationInHeader={displayRegistrationInHeader}
              requiresClientSignature={requiresClientSignature}
              displayWatermark={displayWatermark}
              watermarkOpacity={watermarkOpacity}
            />
          </div>,
          document.body
        )}

        <style>
          {`
            @media print {
              @page { size: A4; margin: 0; }
              #root {
                display: none !important;
              }
              #print-area {
                display: block !important;
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: auto;
                z-index: 9999;
                background: white;
              }
            }
          `}
        </style>
      </div>
    </DashboardLayout>
  );
}