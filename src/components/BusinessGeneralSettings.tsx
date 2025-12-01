import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery, useAction } from "convex/react";
import {
  Building2,
  CreditCard,
  FileText,
  Landmark,
  MapPin,
  Save,
  Archive,
  Lock,
  Unlock,
  Calendar,
  Download,
  Wallet,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface BusinessGeneralSettingsProps {
  business: any;
}

export function BusinessGeneralSettings({ business }: BusinessGeneralSettingsProps) {
  const { t } = useLanguage();
  const createBusiness = useMutation(api.businesses.create);
  const updateBusiness = useMutation(api.businesses.update);
  
  // Period Closures
  const periods = useQuery(api.periods.list, business ? { businessId: business._id } : "skip");
  const closePeriod = useMutation(api.periods.close);
  const openPeriod = useMutation(api.periods.remove);
  
  // Export Action
  const generateZip = useAction(api.exportActions.generateZip);
  const [isExporting, setIsExporting] = useState(false);
  const [periodToReopen, setPeriodToReopen] = useState<any>(null);

  const [closureData, setClosureData] = useState({
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
  });

  // For export functionality
  const exportData = useQuery(api.businesses.exportData, business ? { businessId: business._id } : "skip");

  const [formData, setFormData] = useState({
    name: "",
    tradeName: "",
    address: "",
    city: "",
    phone: "",
    email: "",
    rc: "",
    nif: "",
    ai: "",
    nis: "",
    capital: "",
    currency: "DZD",
    tvaDefault: 19,
    type: "societe",
    fiscalRegime: "reel",
    legalForm: "SARL",
    customLegalForm: "",
    bankName: "",
    bankIban: "",
    autoEntrepreneurCardNumber: "",
    ssNumber: "",
    activityCodes: "",
    // Sequencing
    invoicePrefix: "INV-",
    quotePrefix: "DEV-",
    creditNotePrefix: "AV-",
  });

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name || "",
        tradeName: business.tradeName || "",
        address: business.address || "",
        city: business.city || "",
        phone: business.phone || "",
        email: business.email || "",
        rc: business.rc || "",
        nif: business.nif || "",
        ai: business.ai || "",
        nis: business.nis || "",
        capital: business.capital?.toString() || "",
        currency: business.currency,
        tvaDefault: business.tvaDefault,
        type: business.type || "societe",
        fiscalRegime: business.fiscalRegime || "reel",
        legalForm: business.legalForm || "SARL",
        customLegalForm: business.customLegalForm || "",
        bankName: business.bankName || "",
        bankIban: business.bankIban || "",
        autoEntrepreneurCardNumber: business.autoEntrepreneurCardNumber || "",
        ssNumber: business.ssNumber || "",
        activityCodes: business.activityCodes?.join(", ") || "",
        invoicePrefix: business.invoicePrefix || "INV-",
        quotePrefix: business.quotePrefix || "DEV-",
        creditNotePrefix: business.creditNotePrefix || "AV-",
      });
    }
  }, [business]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "tvaDefault" || name === "capital" ? parseFloat(value) || (name === "capital" ? "" : 0) : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
        const newData = { ...prev, [name]: value };
        
        // Logic Binding
        if (name === "type") {
            if (value === "societe") {
                newData.fiscalRegime = "reel";
                newData.tvaDefault = 19;
                newData.legalForm = "SARL"; // Default
                newData.customLegalForm = "";
            } else if (value === "auto_entrepreneur") {
                newData.fiscalRegime = "auto_entrepreneur";
                newData.tvaDefault = 0;
                newData.legalForm = "AUTO_ENTREPRENEUR"; 
                newData.rc = ""; // Clear RC
                newData.ai = ""; // Clear AI
                newData.nis = ""; // Clear NIS
                newData.customLegalForm = "";
            } else if (value === "personne_physique") {
                newData.fiscalRegime = "forfaitaire"; // Default to IFU
                newData.tvaDefault = 0;
                newData.legalForm = "PERSONNE_PHYSIQUE";
                newData.customLegalForm = "";
            }
        }
        
        if (name === "fiscalRegime") {
            if (value === "forfaitaire" || value === "auto_entrepreneur") {
                newData.tvaDefault = 0;
            } else if (value === "reel") {
                newData.tvaDefault = 19;
            }
        }

        return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
          ...formData,
          type: formData.type as "societe" | "personne_physique" | "auto_entrepreneur",
          fiscalRegime: formData.fiscalRegime as "reel" | "forfaitaire" | "auto_entrepreneur",
          legalForm: formData.legalForm as any,
          activityCodes: formData.activityCodes.split(",").map(s => s.trim()).filter(s => s !== ""),
          capital: formData.capital ? parseFloat(formData.capital.toString()) : undefined,
      };

      if (business) {
        await updateBusiness({
          id: business._id,
          ...payload,
        });
        toast.success(t("settings.toast.updated"));
      } else {
        await createBusiness(payload);
        toast.success(t("settings.toast.created"));
      }
    } catch (error) {
      toast.error(t("settings.toast.failed"));
      console.error(error);
    }
  };

  const handleExport = () => {
    if (!exportData) {
        toast.error(t("settings.toast.exportNotReady"));
        return;
    }
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoiceflow_backup_${business?.name || "data"}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(t("settings.toast.backupSuccess"));
  };

  const handleFullExport = async () => {
    if (!business || !business.userId) return;
    
    setIsExporting(true);
    try {
        const zipBuffer = await generateZip({
            businessId: business._id,
            userId: business.userId,
            includePdfs: true
        });
        
        const blob = new Blob([zipBuffer], { type: "application/zip" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoiceflow_full_backup_${business.name}_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(t("settings.toast.archiveSuccess"));
    } catch (error) {
        toast.error(t("settings.toast.archiveFailed"));
        console.error(error);
    } finally {
        setIsExporting(false);
    }
  };

  const handleClosePeriod = async () => {
      if (!business) return;
      
      // Calculate start and end of month
      const startDate = new Date(closureData.year, closureData.month, 1).getTime();
      const endDate = new Date(closureData.year, closureData.month + 1, 0, 23, 59, 59).getTime();
      
      try {
          await closePeriod({
              businessId: business._id,
              periodType: "MONTH",
              startDate,
              endDate,
              notes: `Closed ${closureData.month + 1}/${closureData.year}`,
          });
          toast.success(t("settings.toast.periodClosed"));
      } catch (error) {
          toast.error(t("settings.toast.periodCloseFailed"));
          console.error(error);
      }
  };

  const confirmReopenPeriod = async () => {
      if (!periodToReopen) return;
      try {
          await openPeriod({ id: periodToReopen });
          toast.success(t("settings.toast.periodReopened"));
          setPeriodToReopen(null);
      } catch (error) {
          toast.error(t("settings.toast.periodReopenFailed"));
      }
  };

  return (
    <>
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
      {/* Company Identity Section */}
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

      {/* Contact Information Section */}
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

      {/* Fiscal Information Section */}
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
        </CardContent>
      </Card>

      {/* Banking Information Section */}
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

      {/* Sequencing Section */}
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
        </CardContent>
      </Card>

      {/* Data Management / Archiving Section */}
      <Card className="md:col-span-2 shadow-sm border-dashed">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <CardTitle>{t("settings.archiving.title")}</CardTitle>
              <CardDescription>
                {t("settings.archiving.description")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-4">
                <div className="space-y-1">
                    <p className="text-sm font-medium">{t("settings.archiving.jsonTitle")}</p>
                    <p className="text-xs text-muted-foreground">
                        {t("settings.archiving.jsonDesc")}
                    </p>
                </div>
                <Button type="button" variant="outline" onClick={handleExport}>
                    <Download className="mr-2 h-4 w-4" />
                    {t("settings.archiving.exportJson")}
                </Button>
            </div>
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <p className="text-sm font-medium">{t("settings.archiving.zipTitle")}</p>
                    <p className="text-xs text-muted-foreground">
                        {t("settings.archiving.zipDesc")}
                    </p>
                </div>
                <Button type="button" variant="default" onClick={handleFullExport} disabled={isExporting}>
                    {isExporting ? (
                        <span className="animate-spin mr-2">⏳</span>
                    ) : (
                        <Archive className="mr-2 h-4 w-4" />
                    )}
                    {isExporting ? t("settings.archiving.generating") : t("settings.archiving.downloadZip")}
                </Button>
            </div>
        </CardContent>
      </Card>

      {/* Accounting Periods Section */}
      <Card className="md:col-span-2 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <CardTitle>{t("settings.periods.title")}</CardTitle>
              <CardDescription>
                {t("settings.periods.description")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="flex items-end gap-4 border-b pb-6">
                <div className="space-y-2">
                    <Label>{t("settings.periods.month")}</Label>
                    <Select 
                        value={closureData.month.toString()} 
                        onValueChange={(v) => setClosureData({...closureData, month: parseInt(v)})}
                    >
                        <SelectTrigger className="w-[180px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {Array.from({ length: 12 }).map((_, i) => (
                                <SelectItem key={i} value={i.toString()}>
                                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label>{t("settings.periods.year")}</Label>
                    <Input 
                        type="number" 
                        value={closureData.year} 
                        onChange={(e) => setClosureData({...closureData, year: parseInt(e.target.value)})}
                        className="w-[100px]"
                    />
                </div>
                <Button type="button" onClick={handleClosePeriod}>
                    <Lock className="mr-2 h-4 w-4" />
                    {t("settings.periods.close")}
                </Button>
            </div>

            <div className="space-y-4">
                <h3 className="text-sm font-medium text-muted-foreground">{t("settings.periods.closedList")}</h3>
                {periods?.length === 0 && (
                    <p className="text-sm text-muted-foreground italic">{t("settings.periods.noClosed")}</p>
                )}
                <div className="grid gap-2">
                    {periods?.map((period) => (
                        <div key={period._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium">
                                    {format(period.startDate, "MMM yyyy")}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    ({format(period.startDate, "dd/MM/yyyy")} - {format(period.endDate, "dd/MM/yyyy")})
                                </span>
                            </div>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 text-destructive hover:text-destructive"
                                onClick={() => setPeriodToReopen(period._id)}
                            >
                                <Unlock className="mr-2 h-3 w-3" />
                                {t("settings.periods.reopen")}
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </CardContent>
      </Card>

      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" size="lg" className="shadow-sm">
            <Save className="mr-2 h-4 w-4" />
            {t("settings.save")}
        </Button>
      </div>
    </form>

    {/* Reopen Period Dialog */}
    {periodToReopen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="bg-card border p-6 rounded-lg shadow-lg max-w-md w-full space-y-4">
                <h3 className="text-lg font-semibold">{t("settings.periods.reopenTitle")}</h3>
                <p className="text-sm text-muted-foreground">{t("settings.periods.reopenDesc")}</p>
                <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setPeriodToReopen(null)}>{t("settings.periods.cancel")}</Button>
                    <Button variant="destructive" onClick={confirmReopenPeriod}>{t("settings.periods.confirmReopen")}</Button>
                </div>
            </div>
        </div>
    )}
    </>
  );
}