import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { FileText, Printer, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { G50Declaration } from "@/components/G50Declaration";
import { useLanguage } from "@/contexts/LanguageContext";
import { SetupRequired } from "@/components/SetupRequired";
import { G12Section } from "@/components/declarations/G12Section";

export default function Declarations() {
  const { t } = useLanguage();
  const business = useQuery(api.businesses.getMyBusiness, {});
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());

  // IFU Forecast State
  const [forecastAmount, setForecastAmount] = useState("");
  const [ifuRate, setIfuRate] = useState("5"); // Default 5%

  const g50Data = useQuery(api.declarations.getG50Data, 
    business ? { 
        businessId: business._id, 
        month: parseInt(selectedMonth), 
        year: parseInt(selectedYear) 
    } : "skip"
  );

  const g12Data = useQuery(api.declarations.getG12Data,
    business ? {
        businessId: business._id,
        year: parseInt(selectedYear)
    } : "skip"
  );

  const g12IfuData = useQuery(api.declarations.getG12IFUData,
    business && (business.fiscalRegime === "IFU" || business.fiscalRegime === "forfaitaire" || business.fiscalRegime === "auto_entrepreneur") ? {
        businessId: business._id,
        year: parseInt(selectedYear)
    } : "skip"
  );

  const aeInvoicesData = useQuery(api.declarations.getAEInvoicesExportData,
    business && business.type === "auto_entrepreneur" ? {
        businessId: business._id,
        year: parseInt(selectedYear)
    } : "skip"
  );

  const saveForecast = useMutation(api.declarations.saveG12Forecast);

  const handleSaveForecast = async () => {
    if (!business || !forecastAmount || !ifuRate) return;
    try {
        await saveForecast({
            businessId: business._id,
            year: parseInt(selectedYear),
            forecastTurnover: parseFloat(forecastAmount),
            ifuRate: parseFloat(ifuRate),
        });
        toast.success(t("declarations.g12.saved"));
    } catch (error) {
        toast.error(t("settings.toast.failed"));
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (business === undefined) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (business === null || !business.type) {
    return <SetupRequired />;
  }

  // Logic Implementation Summary Check
  // SOCIÉTÉ: G50 ON, G12 OFF
  // PERSONNE PHYSIQUE (FORFAITAIRE): G50 OFF, G12 ON
  // PERSONNE PHYSIQUE (RÉEL SIMPLIFIÉ): G50 ON, G12 OPTIONAL (We show both)
  // AUTO-ENTREPRENEUR: G50 OFF, G12 ON

  const showG50 = business.type === "societe" || (business.type === "personne_physique" && (business.fiscalRegime === "reel" || business.fiscalRegime === "VAT"));
  const showG12 = business.type === "auto_entrepreneur" || (business.type === "personne_physique" && (business.fiscalRegime === "forfaitaire" || business.fiscalRegime === "IFU")) || (business.type === "personne_physique" && (business.fiscalRegime === "reel" || business.fiscalRegime === "VAT"));

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">{t("declarations.title")}</h1>
        <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> {t("declarations.print")}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 print:block print:space-y-6">
        {/* G50 Monthly Declaration */}
        {showG50 && (
        <Card className="print:shadow-none print:border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                {t("declarations.g50.title")}
            </CardTitle>
            <CardDescription>
              {t("declarations.g50.description")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 print:hidden">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder={t("common.month")} />
                    </SelectTrigger>
                    <SelectContent>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder={t("common.year")} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <div className="hidden print:block mb-4">
                <p className="font-bold">{t("declarations.g50.period")}: {new Date(0, parseInt(selectedMonth)).toLocaleString('default', { month: 'long' })} {selectedYear}</p>
                <p>{t("declarations.g50.business")}: {business.name} ({t("common.nif")}: {business.nif || "N/A"})</p>
            </div>

            {g50Data ? (
                <G50Declaration 
                    business={business} 
                    month={selectedMonth} 
                    year={selectedYear} 
                    data={g50Data} 
                />
            ) : (
                <div className="p-4 text-center text-muted-foreground">{t("declarations.loading")}</div>
            )}
          </CardContent>
        </Card>
        )}

        {/* G12 Annual Declaration */}
        {showG12 ? (
            <G12Section
                business={business}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                g12Data={g12Data}
                g12IfuData={g12IfuData}
                aeInvoicesData={aeInvoicesData}
                forecastAmount={forecastAmount}
                setForecastAmount={setForecastAmount}
                ifuRate={ifuRate}
                setIfuRate={setIfuRate}
                handleSaveForecast={handleSaveForecast}
            />
        ) : (
            <Card className="print:hidden bg-muted/10 border-dashed">
                <CardHeader>
                    <CardTitle className="text-muted-foreground text-lg">{t("declarations.notApplicable")}</CardTitle>
                    <CardDescription>
                        {t("declarations.notApplicableDesc")} ({business.type}).
                    </CardDescription>
                </CardHeader>
            </Card>
        )}
      </div>
    </DashboardLayout>
  );
}