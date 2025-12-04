import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Landmark, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BusinessFormData } from "./types";

interface BankingSectionProps {
  formData: BusinessFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function BankingSection({ formData, handleChange }: BankingSectionProps) {
  const { t } = useLanguage();

  return (
    <Card className="shadow-sm h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Landmark className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <CardTitle>{t("settings.banking.title")}</CardTitle>
            <CardDescription>
              {t("settings.banking.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bankName">{t("settings.banking.bankName")}</Label>
          <div className="relative">
            <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="bankName"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              placeholder={t("settings.placeholders.bankName")}
              className="pl-9"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bankIban">{t("settings.banking.iban")}</Label>
          <div className="relative">
            <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="bankIban"
              name="bankIban"
              value={formData.bankIban}
              onChange={handleChange}
              placeholder={t("settings.placeholders.iban")}
              className="pl-9 font-mono"
            />
          </div>
        </div>
        <div className="rounded-md bg-muted p-4 mt-6">
          <p className="text-sm text-muted-foreground">
            {t("settings.banking.helper")}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
