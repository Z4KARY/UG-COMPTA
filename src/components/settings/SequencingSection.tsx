import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BusinessFormData } from "./types";

interface SequencingSectionProps {
  formData: BusinessFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SequencingSection({ formData, handleChange }: SequencingSectionProps) {
  const { t } = useLanguage();

  return (
    <Card className="shadow-sm h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <CardTitle>{t("settings.sequencing.title")}</CardTitle>
            <CardDescription>
              {t("settings.sequencing.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="invoicePrefix">{t("settings.sequencing.invoicePrefix")}</Label>
          <Input
            id="invoicePrefix"
            name="invoicePrefix"
            value={formData.invoicePrefix}
            onChange={handleChange}
            placeholder={t("settings.placeholders.prefixInv")}
          />
          <p className="text-xs text-muted-foreground">{t("settings.helpers.format")} {formData.invoicePrefix}YYYY-001</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="quotePrefix">{t("settings.sequencing.quotePrefix")}</Label>
          <Input
            id="quotePrefix"
            name="quotePrefix"
            value={formData.quotePrefix}
            onChange={handleChange}
            placeholder={t("settings.placeholders.prefixQuote")}
          />
          <p className="text-xs text-muted-foreground">{t("settings.helpers.format")} {formData.quotePrefix}YYYY-001</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="creditNotePrefix">{t("settings.sequencing.creditNotePrefix")}</Label>
          <Input
            id="creditNotePrefix"
            name="creditNotePrefix"
            value={formData.creditNotePrefix}
            onChange={handleChange}
            placeholder={t("settings.placeholders.prefixCredit")}
          />
          <p className="text-xs text-muted-foreground">{t("settings.helpers.format")} {formData.creditNotePrefix}YYYY-001</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="proFormaPrefix">{t("settings.sequencing.proFormaPrefix")}</Label>
          <Input
            id="proFormaPrefix"
            name="proFormaPrefix"
            value={formData.proFormaPrefix}
            onChange={handleChange}
            placeholder="PF-"
          />
          <p className="text-xs text-muted-foreground">{t("settings.helpers.format")} {formData.proFormaPrefix || "PF-"}YYYY-001</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="deliveryNotePrefix">{t("settings.sequencing.deliveryNotePrefix")}</Label>
          <Input
            id="deliveryNotePrefix"
            name="deliveryNotePrefix"
            value={formData.deliveryNotePrefix}
            onChange={handleChange}
            placeholder="BL-"
          />
          <p className="text-xs text-muted-foreground">{t("settings.helpers.format")} {formData.deliveryNotePrefix || "BL-"}YYYY-001</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="saleOrderPrefix">{t("settings.sequencing.saleOrderPrefix")}</Label>
          <Input
            id="saleOrderPrefix"
            name="saleOrderPrefix"
            value={formData.saleOrderPrefix}
            onChange={handleChange}
            placeholder="BC-"
          />
          <p className="text-xs text-muted-foreground">{t("settings.helpers.format")} {formData.saleOrderPrefix || "BC-"}YYYY-001</p>
        </div>
      </CardContent>
    </Card>
  );
}