import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BusinessFormData } from "./types";

interface IdentitySectionProps {
  formData: BusinessFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFormData: (data: any) => void;
}

export function IdentitySection({ formData, handleChange, setFormData }: IdentitySectionProps) {
  const { t } = useLanguage();

  return (
    <Card className="md:col-span-2 shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>{t("settings.identity.title")}</CardTitle>
            <CardDescription>
              {t("settings.identity.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="name">
            {formData.type === "societe" 
              ? t("settings.identity.name") 
              : t("settings.identity.fullName")}
          </Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={formData.type === "societe" ? t("settings.placeholders.companyName") : t("settings.placeholders.personName")}
            required
            className="bg-muted/30"
          />
          {formData.type !== "societe" && (
            <p className="text-[0.8rem] text-muted-foreground">
              {t("settings.identity.description")}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tradeName">{t("settings.identity.tradeName")}</Label>
          <Input
            id="tradeName"
            name="tradeName"
            value={formData.tradeName}
            onChange={handleChange}
            placeholder={formData.type === "societe" ? t("settings.placeholders.optional") : t("settings.placeholders.tradeName")}
            className="bg-muted/30"
          />
        </div>
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="address">{t("settings.identity.address")}</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder={t("settings.placeholders.address")}
              required
              className="pl-9 bg-muted/30"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="city">{t("settings.identity.city")}</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
        </div>
      </CardContent>
    </Card>
  );
}
