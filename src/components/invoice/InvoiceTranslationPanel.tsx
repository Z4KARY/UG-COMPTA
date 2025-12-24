import { useState } from "react";
import { useMutation } from "convex/react";
import { Languages, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const LANGUAGE_OPTIONS = [
  { value: "fr", label: "French" },
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
] as const;

interface InvoiceTranslationPanelProps {
  invoiceId: Id<"invoices">;
  currentLanguage: string;
  items: any[];
  notes?: string | null;
}

export function InvoiceTranslationPanel({
  invoiceId,
  currentLanguage,
}: InvoiceTranslationPanelProps) {
  const updateInvoice = useMutation(api.invoices.update);
  
  const [targetLanguage, setTargetLanguage] = useState(currentLanguage);
  const [isLoading, setIsLoading] = useState(false);

  const handleUpdateLanguage = async () => {
    try {
      setIsLoading(true);
      
      // Only update the language field. 
      // We do not send items or notes to avoid unnecessary processing/validation on the backend
      // since we are not translating the content anymore (No API Key mode).
      await updateInvoice({
        id: invoiceId,
        language: targetLanguage,
        userAgent: navigator.userAgent,
      });

      toast.success(`Invoice language changed to ${LANGUAGE_OPTIONS.find(l => l.value === targetLanguage)?.label}`);
    } catch (error: any) {
      console.error("Language update error:", error);
      // Ensure we show the backend error message if available
      const errorMessage = error.message || error.toString();
      toast.error(errorMessage.includes("Failed to update invoice") ? errorMessage : "Failed to update invoice language");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border border-slate-200/60 bg-slate-50/60 shadow-none mb-8 print:hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <Languages className="h-4 w-4 text-slate-500" />
          Invoice Language
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="space-y-2 flex-1">
            <Label className="text-xs uppercase tracking-wider text-slate-500">
              Display Language
            </Label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {LANGUAGE_OPTIONS.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-slate-500 pt-1">
              This will update the invoice labels (headers, totals, etc.) to the selected language.
            </p>
          </div>

          <Button
            onClick={handleUpdateLanguage}
            disabled={isLoading || targetLanguage === currentLanguage}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Check className="mr-2 h-4 w-4" />
            )}
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}