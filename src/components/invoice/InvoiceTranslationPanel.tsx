import { useState } from "react";
import { useAction } from "convex/react";
import { Languages, Loader2, Copy } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/convex/_generated/api";
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
import { Textarea } from "@/components/ui/textarea";

const LANGUAGE_OPTIONS = [
  { value: "fr", label: "French" },
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
  { value: "tr", label: "Turkish" },
] as const;

interface InvoiceTranslationPanelProps {
  content: string;
  documentTitle: string;
  documentType: "sales" | "purchase";
}

export function InvoiceTranslationPanel({
  content,
  documentTitle,
  documentType,
}: InvoiceTranslationPanelProps) {
  const translateInvoice = useAction(api.translation.translateInvoice);
  const [targetLanguage, setTargetLanguage] = useState("fr");
  const [translatedText, setTranslatedText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTranslate = async () => {
    if (!content) {
      toast.error("No invoice content available to translate.");
      return;
    }

    try {
      setIsLoading(true);
      const result = await translateInvoice({
        invoiceText: content,
        targetLanguage,
        documentType,
        documentTitle,
      });
      setTranslatedText(result.translation);
      const languageLabel =
        LANGUAGE_OPTIONS.find((lang) => lang.value === targetLanguage)?.label ??
        targetLanguage;
      toast.success(`Translated to ${languageLabel}`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to translate invoice.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!translatedText) return;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(translatedText);
        toast.success("Translation copied to clipboard");
      } else {
        throw new Error("Clipboard unavailable");
      }
    } catch {
      toast.error("Unable to copy translation");
    }
  };

  return (
    <Card className="w-full border border-slate-200/60 bg-slate-50/60 shadow-none">
      <CardHeader className="space-y-1">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-slate-800">
          <Languages className="h-4 w-4 text-slate-500" />
          Translate Document
        </CardTitle>
        <p className="text-xs text-slate-500">
          Instantly generate a localized summary for customers or suppliers.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-[280px_auto]">
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-slate-500">
              Target Language
            </Label>
            <Select value={targetLanguage} onValueChange={setTargetLanguage}>
              <SelectTrigger className="bg-white text-sm">
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
          <div className="flex flex-wrap items-end gap-2">
            <Button
              className="flex-1 md:flex-none"
              onClick={handleTranslate}
              disabled={isLoading || !content}
            >
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Languages className="mr-2 h-4 w-4" />
              )}
              Translate
            </Button>
            <Button
              type="button"
              variant="outline"
              className="hidden md:flex"
              disabled={!translatedText}
              onClick={handleCopy}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        </div>

        {translatedText && (
          <div className="space-y-2">
            <Label className="text-xs uppercase tracking-wider text-slate-500">
              Translated Output
            </Label>
            <Textarea
              value={translatedText}
              readOnly
              className="min-h-[180px] resize-none bg-white text-sm"
            />
            <Button
              type="button"
              variant="outline"
              className="md:hidden w-full"
              disabled={!translatedText}
              onClick={handleCopy}
            >
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
