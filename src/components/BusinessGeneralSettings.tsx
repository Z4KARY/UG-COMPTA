import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery, useAction } from "convex/react";
import { Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { IdentitySection } from "./settings/IdentitySection";
import { ContactSection } from "./settings/ContactSection";
import { FiscalSection } from "./settings/FiscalSection";
import { BankingSection } from "./settings/BankingSection";
import { SequencingSection } from "./settings/SequencingSection";
import { ArchivingSection } from "./settings/ArchivingSection";
import { PeriodsSection } from "./settings/PeriodsSection";
import { BusinessFormData } from "./settings/types";

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

  const [formData, setFormData] = useState<BusinessFormData>({
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
      console.error(error);
      toast.error(error instanceof Error ? error.message : t("settings.toast.failed"));
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
    <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
      <IdentitySection 
        formData={formData} 
        handleChange={handleChange} 
        setFormData={setFormData} 
      />

      <ContactSection 
        formData={formData} 
        setFormData={setFormData} 
      />

      <FiscalSection 
        formData={formData} 
        handleChange={handleChange} 
        handleSelectChange={handleSelectChange} 
      />

      <BankingSection 
        formData={formData} 
        handleChange={handleChange} 
      />

      <SequencingSection 
        formData={formData} 
        handleChange={handleChange} 
      />

      <ArchivingSection 
        handleExport={handleExport} 
        handleFullExport={handleFullExport} 
        isExporting={isExporting} 
      />

      <PeriodsSection 
        periods={periods}
        closureData={closureData}
        setClosureData={setClosureData}
        handleClosePeriod={handleClosePeriod}
        periodToReopen={periodToReopen}
        setPeriodToReopen={setPeriodToReopen}
        confirmReopenPeriod={confirmReopenPeriod}
      />

      <div className="md:col-span-2 flex justify-end">
        <Button type="submit" size="lg" className="shadow-sm">
            <Save className="mr-2 h-4 w-4" />
            {t("settings.save")}
        </Button>
      </div>
    </form>
  );
}