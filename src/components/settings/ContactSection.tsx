import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BusinessFormData } from "./types";

interface ContactSectionProps {
  formData: BusinessFormData;
  setFormData: (data: any) => void;
}

export function ContactSection({ formData, setFormData }: ContactSectionProps) {
  const { t } = useLanguage();

  return (
    <Card className="md:col-span-2 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle>{t("settings.contact.title")}</CardTitle>
            <CardDescription>
              {t("settings.contact.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="phone">{t("settings.contact.phone")}</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder={t("settings.placeholders.phone")}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">{t("settings.contact.email")}</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t("settings.placeholders.email")}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
