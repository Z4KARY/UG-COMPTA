import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { FileText } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { BusinessFormData } from "./types";

interface FiscalSectionProps {
  formData: BusinessFormData;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSelectChange: (name: string, value: string) => void;
}

export function FiscalSection({ formData, handleChange, handleSelectChange }: FiscalSectionProps) {
  const { t } = useLanguage();

  return (
    <Card className="shadow-sm h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <CardTitle>{t("settings.fiscal.title")}</CardTitle>
            <CardDescription>
              {t("settings.fiscal.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
            <Label htmlFor="type">{t("settings.fiscal.type")}</Label>
            <Select
              value={formData.type}
              onValueChange={(val) => handleSelectChange("type", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("settings.placeholders.selectType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="societe">{t("settings.options.societe")}</SelectItem>
                <SelectItem value="personne_physique">{t("settings.options.personnePhysique")}</SelectItem>
                <SelectItem value="auto_entrepreneur">{t("settings.options.autoEntrepreneur")}</SelectItem>
              </SelectContent>
            </Select>
        </div>

        {formData.type === "personne_physique" && (
            <div className="space-y-2">
              <Label htmlFor="fiscalRegime">{t("settings.fiscal.regime")}</Label>
              <Select
                  value={formData.fiscalRegime}
                  onValueChange={(val) => handleSelectChange("fiscalRegime", val)}
              >
                  <SelectTrigger>
                  <SelectValue placeholder={t("settings.placeholders.selectRegime")} />
                  </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="forfaitaire">{t("settings.options.regimeForfaitaire")}</SelectItem>
                  <SelectItem value="reel">{t("settings.options.regimeReel")}</SelectItem>
                  </SelectContent>
              </Select>
            </div>
        )}

        {formData.type === "societe" && (
            <div className="space-y-2">
              <Label htmlFor="legalForm">{t("settings.fiscal.legalForm")}</Label>
              <Select
                  value={formData.legalForm}
                  onValueChange={(val) => handleSelectChange("legalForm", val)}
              >
                  <SelectTrigger>
                  <SelectValue placeholder={t("settings.placeholders.selectForm")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t("settings.groups.commercial")}</SelectLabel>
                      <SelectItem value="EURL">EURL</SelectItem>
                      <SelectItem value="SARL">SARL</SelectItem>
                      <SelectItem value="SPA">SPA</SelectItem>
                      <SelectItem value="SPAS">SPAS (Startup)</SelectItem>
                      <SelectItem value="SPASU">SPASU (Startup)</SelectItem>
                      <SelectItem value="SNC">SNC</SelectItem>
                      <SelectItem value="SCS">SCS</SelectItem>
                      <SelectItem value="SCA">SCA</SelectItem>
                      <SelectItem value="SOCIETE_PARTICIPATION">Société de participation</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>{t("settings.groups.public")}</SelectLabel>
                      <SelectItem value="EPE">EPE</SelectItem>
                      <SelectItem value="EPIC">EPIC</SelectItem>
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>{t("settings.groups.other")}</SelectLabel>
                      <SelectItem value="ASSOCIATION">Association</SelectItem>
                      <SelectItem value="COOPERATIVE">Coopérative</SelectItem>
                      <SelectItem value="ONG">ONG</SelectItem>
                      <SelectItem value="OTHER">{t("settings.options.other")}</SelectItem>
                    </SelectGroup>
                  </SelectContent>
              </Select>
            </div>
        )}

        {formData.legalForm === "OTHER" && (
            <div className="space-y-2">
              <Label htmlFor="customLegalForm">{t("settings.fiscal.customForm")}</Label>
              <Input
                  id="customLegalForm"
                  name="customLegalForm"
                  value={formData.customLegalForm}
                  onChange={handleChange}
                  placeholder={t("settings.placeholders.customForm")}
                  required
              />
              <p className="text-[0.8rem] text-muted-foreground" dangerouslySetInnerHTML={{ __html: t("settings.helpers.customForm") }} />
            </div>
        )}

        <Separator className="my-2" />
        
        {formData.type === "auto_entrepreneur" ? (
            <div className="space-y-4 bg-blue-50/50 p-4 rounded-md border border-blue-100">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="autoEntrepreneurCardNumber">{t("settings.fiscal.aeCard")}</Label>
                      <Input
                          id="autoEntrepreneurCardNumber"
                          name="autoEntrepreneurCardNumber"
                          value={formData.autoEntrepreneurCardNumber}
                          onChange={handleChange}
                          placeholder={t("settings.placeholders.aeCard")}
                          required
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="nif">{t("settings.fiscal.nif")}</Label>
                      <Input
                          id="nif"
                          name="nif"
                          value={formData.nif}
                          onChange={handleChange}
                          placeholder={t("settings.placeholders.nif")}
                          required
                      />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activityCodes">{t("settings.fiscal.activityCodes")}</Label>
                  <Input
                      id="activityCodes"
                      name="activityCodes"
                      value={formData.activityCodes}
                      onChange={handleChange}
                      placeholder={t("settings.placeholders.activityCodes")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ssNumber">{t("settings.fiscal.casnos")}</Label>
                  <Input
                      id="ssNumber"
                      name="ssNumber"
                      value={formData.ssNumber}
                      onChange={handleChange}
                      placeholder={t("settings.placeholders.casnos")}
                  />
                </div>
            </div>
        ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                  <Label htmlFor="rc">{t("settings.fiscal.rc")}</Label>
                  <Input
                      id="rc"
                      name="rc"
                      value={formData.rc}
                      onChange={handleChange}
                      placeholder={t("settings.placeholders.rc")}
                  />
                  </div>
                  <div className="space-y-2">
                  <Label htmlFor="nif">{t("settings.fiscal.nif")}</Label>
                  <Input
                      id="nif"
                      name="nif"
                      value={formData.nif}
                      onChange={handleChange}
                      placeholder={t("settings.placeholders.nif")}
                  />
                  </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="ai">{t("settings.fiscal.ai")}</Label>
                      <Input
                      id="ai"
                      name="ai"
                      value={formData.ai}
                      onChange={handleChange}
                      placeholder={t("settings.placeholders.ai")}
                      />
                  </div>
                  <div className="space-y-2">
                      <Label htmlFor="nis">{t("settings.fiscal.nis")}</Label>
                      <Input
                      id="nis"
                      name="nis"
                      value={formData.nis}
                      onChange={handleChange}
                      placeholder={t("settings.placeholders.nis")}
                      />
                  </div>
              </div>
              {formData.type === "societe" && (
                  <div className="space-y-2">
                      <Label htmlFor="capital">{t("settings.fiscal.capital")}</Label>
                      <Input
                      id="capital"
                      name="capital"
                      type="number"
                      value={formData.capital}
                      onChange={handleChange}
                      placeholder={t("settings.placeholders.capital")}
                      />
                  </div>
              )}
            </>
        )}
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="currency">{t("settings.fiscal.currency")}</Label>
            <Input
              id="currency"
              name="currency"
              value={formData.currency}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tvaDefault">{t("settings.fiscal.tva")}</Label>
            <Input
              id="tvaDefault"
              name="tvaDefault"
              type="number"
              value={formData.tvaDefault}
              onChange={handleChange}
              required
              disabled={formData.fiscalRegime === "auto_entrepreneur" || formData.fiscalRegime === "forfaitaire"}
              className={formData.fiscalRegime === "auto_entrepreneur" || formData.fiscalRegime === "forfaitaire" ? "bg-muted text-muted-foreground" : ""}
            />
          </div>
        </div>

        <div className="space-y-2">
            <Label htmlFor="mainActivity">Main Activity (IBS Rate)</Label>
            <Select
              value={formData.mainActivity}
              onValueChange={(val) => handleSelectChange("mainActivity", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Main Activity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRODUCTION">Production (19%)</SelectItem>
                <SelectItem value="SERVICES">Services (23%)</SelectItem>
                <SelectItem value="DISTRIBUTION">Distribution / Achat-Revente (26%)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[0.8rem] text-muted-foreground">
                Determines your Corporate Tax (IBS) rate.
            </p>
        </div>
      </CardContent>
    </Card>
  );
}