import { useState } from "react";
import { useAction, useMutation } from "convex/react";
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
import { Checkbox } from "@/components/ui/checkbox";

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
  items,
  notes,
}: InvoiceTranslationPanelProps) {
  const translateContent = useAction(api.translation.translateInvoiceContent);
  const updateInvoice = useMutation(api.invoices.update);
  
  const [targetLanguage, setTargetLanguage] = useState(currentLanguage);
  const [translateItems, setTranslateItems] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleTranslate = async () => {
    try {
      setIsLoading(true);
      
      let updatedItems = undefined;
      let updatedNotes = undefined;

      if (translateItems) {
        const result = await translateContent({
          items: items.map(i => ({ description: i.description })),
          notes: notes === null ? undefined : notes,
          targetLanguage,
        });
        
        // Merge translated descriptions back into items
        updatedItems = items.map((item, index) => ({
          ...item,
          description: result.items[index].description,
        }));
        updatedNotes = result.notes;
      }

      // Sanitize items to match mutation validator (remove system fields like _id, _creationTime)
      // Also handle null values which are not accepted by v.optional()
      const sanitizedItems = (updatedItems || items).map(item => ({
        productId: item.productId === null ? undefined : item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountRate: item.discountRate === null ? undefined : item.discountRate,
        tvaRate: item.tvaRate ?? 0,
        lineTotal: item.lineTotal ?? 0,
        lineTotalHt: item.lineTotalHt === null ? undefined : item.lineTotalHt,
        lineTotalTtc: item.lineTotalTtc === null ? undefined : item.lineTotalTtc,
        productType: item.productType === null ? undefined : item.productType,
      }));

      await updateInvoice({
        id: invoiceId,
        language: targetLanguage,
        items: sanitizedItems,
        notes: updatedNotes, // Pass updatedNotes directly (can be null, string, or undefined)
        userAgent: navigator.userAgent,
      });

      toast.success(`Invoice translated to ${LANGUAGE_OPTIONS.find(l => l.value === targetLanguage)?.label}`);
    } catch (error: any) {
      console.error("Translation error:", error);
      toast.error(error.message || "Failed to translate invoice");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full border border-slate-200/60 bg-slate-50/60 shadow-none mb-8 print:hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <Languages className="h-4 w-4 text-slate-500" />
          Invoice Language & Translation
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
          </div>

          <div className="flex items-center space-x-2 pb-2.5">
            <Checkbox 
              id="translate-content" 
              checked={translateItems}
              onCheckedChange={(c) => setTranslateItems(!!c)}
            />
            <label
              htmlFor="translate-content"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Translate descriptions & notes
            </label>
          </div>

          <Button
            onClick={handleTranslate}
            disabled={isLoading || (targetLanguage === currentLanguage && !translateItems)}
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