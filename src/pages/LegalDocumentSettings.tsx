import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Save, Eye } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { LegalDocument } from "@/components/legal/LegalDocument";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export default function LegalDocumentSettings() {
  const data = useQuery(api.legalDocuments.getMyLegalDocument);
  const saveDocument = useMutation(api.legalDocuments.save);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (data?.document) {
      setTitle(data.document.title || "");
      setContent(data.document.content || "");
    }
  }, [data]);

  const handleSave = async () => {
    if (!data?.business) return;
    
    setIsSaving(true);
    try {
      await saveDocument({
        businessId: data.business._id,
        content,
        title,
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
              <div className="space-y-2">
                <Label htmlFor="content">Contenu</Label>
                <Textarea
                  id="content"
                  placeholder="Saisissez le contenu de votre document ici..."
                  className="min-h-[500px] font-mono text-sm"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Le contenu respectera les sauts de ligne.
                </p>
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
                      />
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
