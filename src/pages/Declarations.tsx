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
import { FileText, Download, Printer, Save } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function Declarations() {
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
    business && (business.fiscalRegime === "IFU" || business.fiscalRegime === "forfaitaire") ? {
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
        toast.success("G12 Forecast saved successfully");
    } catch (error) {
        toast.error("Failed to save forecast");
    }
  };

  const downloadG50CSV = (data: any) => {
    if (!data) return;
    
    // G50 Format Mapping
    const headers = ["Rubrique", "Base Imposable (HT)", "Taux", "Montant Droits/Taxes"];
    const rows = [
        ["Chiffre d'affaires Global (HT)", data.turnoverHt.toFixed(2), "-", "-"],
        ["TVA Collectée", data.turnoverHt.toFixed(2), "Variable", data.tvaCollected.toFixed(2)],
        ["Droits de Timbre (Sur paiement espèces)", "-", "-", data.stampDutyTotal.toFixed(2)],
    ];

    const csvContent = "data:text/csv;charset=utf-8," 
        + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `G50_${parseInt(selectedMonth)+1}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadG12CSV = (data: any) => {
    if (!data) return;

    const headers = ["Rubrique", "Montant Annuel (HT)"];
    const rows = [
        ["Chiffre d'affaires Global", data.turnoverHt.toFixed(2)],
        ["Vente de marchandises (Biens)", data.turnoverGoods.toFixed(2)],
        ["Prestations de services", data.turnoverServices.toFixed(2)],
    ];

    const csvContent = "\uFEFF" + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `G12_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadG12BisCSV = (data: any) => {
    if (!data) return;
    
    const forecast = data.forecast?.forecastTurnover || 0;
    const real = data.currentYearRealTurnover || 0;
    const rate = data.forecast?.ifuRate || 0;
    const taxInitial = data.forecast?.taxDueInitial || 0;
    const taxFinal = real * (rate / 100);
    const adjustment = taxFinal - taxInitial;

    const headers = ["Rubrique", "Montant"];
    const rows = [
        ["Année", data.year],
        ["Chiffre d'affaires Prévisionnel (G12)", forecast.toFixed(2)],
        ["Chiffre d'affaires Réel (G12bis)", real.toFixed(2)],
        ["Taux IFU (%)", rate.toString()],
        ["Impôt Dû (Initial)", taxInitial.toFixed(2)],
        ["Impôt Dû (Final)", taxFinal.toFixed(2)],
        ["Régularisation (A payer/Avoir)", adjustment.toFixed(2)],
    ];

    const csvContent = "\uFEFF" + headers.join(",") + "\n" 
        + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `G12bis_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!business) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Please set up your business profile first.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <h1 className="text-3xl font-bold tracking-tight">Declarations</h1>
        <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Summary
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 print:block print:space-y-6">
        {/* G50 Monthly Declaration */}
        <Card className="print:shadow-none print:border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                G50 Monthly Declaration
            </CardTitle>
            <CardDescription>
              Monthly declaration of taxes (TVA, Stamp Duty).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4 print:hidden">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Month" />
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
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
            <div className="hidden print:block mb-4">
                <p className="font-bold">Period: {new Date(0, parseInt(selectedMonth)).toLocaleString('default', { month: 'long' })} {selectedYear}</p>
                <p>Business: {business.name} (NIF: {business.nif || "N/A"})</p>
            </div>

            {g50Data ? (
                <div className="space-y-2 border rounded-md p-4 bg-muted/20 print:bg-white print:border-gray-300">
                    <div className="flex justify-between items-center border-b pb-2 mb-2">
                        <span className="font-semibold">Designation</span>
                        <span className="font-semibold">Amount</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Turnover (HT):</span>
                        <span className="font-medium">{g50Data.turnoverHt.toLocaleString()} {business.currency}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">TVA Collected:</span>
                        <span className="font-medium">{g50Data.tvaCollected.toLocaleString()} {business.currency}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Stamp Duty (Cash):</span>
                        <span className="font-medium">{g50Data.stampDutyTotal.toLocaleString()} {business.currency}</span>
                    </div>
                    <div className="pt-4 mt-2 print:hidden">
                        <Button 
                            variant="outline" 
                            className="w-full"
                            onClick={() => downloadG50CSV(g50Data)}
                        >
                            <Download className="mr-2 h-4 w-4" /> Export G50 CSV
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="p-4 text-center text-muted-foreground">Loading data...</div>
            )}
          </CardContent>
        </Card>

        {/* G12 Annual Declaration */}
        {business.legalForm === "PERSONNE_PHYSIQUE" ? (
        <Card className="print:shadow-none print:border print:break-before-page">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                G12 / G12bis Annual
            </CardTitle>
            <CardDescription>
              Annual turnover declaration for {(business.fiscalRegime === "IFU" || business.fiscalRegime === "forfaitaire") ? "IFU (Simplified)" : "Real"} regime.
              <br/>
              <span className="text-xs text-muted-foreground">Only for Personnes Physiques (Entreprises Individuelles)</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex gap-4 print:hidden">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="hidden print:block mb-4">
                <p className="font-bold">Year: {selectedYear}</p>
                <p>Regime: {business.fiscalRegime || "VAT"}</p>
            </div>

            {(business.fiscalRegime === "IFU" || business.fiscalRegime === "forfaitaire") ? (
                // IFU Specific View
                <div className="space-y-4">
                    {g12IfuData ? (
                        <>
                            <div className="p-4 border rounded-md bg-blue-50/50 space-y-2">
                                <h3 className="font-semibold text-sm">G12 Forecast (Prévisionnel)</h3>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Turnover N-1 (Ref):</span>
                                    <span>{g12IfuData.previousYearTurnover.toLocaleString()} {business.currency}</span>
                                </div>
                                <div className="grid grid-cols-2 gap-4 pt-2 print:hidden">
                                    <div className="space-y-1">
                                        <Label className="text-xs">Forecast N</Label>
                                        <Input 
                                            type="number" 
                                            value={forecastAmount} 
                                            onChange={(e) => setForecastAmount(e.target.value)}
                                            placeholder={g12IfuData.forecast?.forecastTurnover.toString() || "Enter forecast"}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-xs">IFU Rate (%)</Label>
                                        <Input 
                                            type="number" 
                                            value={ifuRate} 
                                            onChange={(e) => setIfuRate(e.target.value)}
                                            placeholder={g12IfuData.forecast?.ifuRate.toString() || "5"}
                                        />
                                    </div>
                                </div>
                                <div className="pt-2 print:hidden">
                                    <Button size="sm" onClick={handleSaveForecast} className="w-full">
                                        <Save className="mr-2 h-3 w-3" /> Save Forecast
                                    </Button>
                                </div>
                                {g12IfuData.forecast && (
                                    <div className="pt-2 border-t mt-2 text-sm">
                                        <div className="flex justify-between">
                                            <span>Saved Forecast:</span>
                                            <span className="font-medium">{g12IfuData.forecast.forecastTurnover.toLocaleString()} {business.currency}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Initial Tax Due:</span>
                                            <span className="font-medium">{g12IfuData.forecast.taxDueInitial.toLocaleString()} {business.currency}</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 border rounded-md bg-green-50/50 space-y-2">
                                <h3 className="font-semibold text-sm">G12bis Definitive (Régularisation)</h3>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Real Turnover N:</span>
                                    <span className="font-bold">{g12IfuData.currentYearRealTurnover.toLocaleString()} {business.currency}</span>
                                </div>
                                {g12IfuData.forecast && (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">Difference:</span>
                                            <span className={g12IfuData.currentYearRealTurnover > g12IfuData.forecast.forecastTurnover ? "text-red-600" : "text-green-600"}>
                                                {(g12IfuData.currentYearRealTurnover - g12IfuData.forecast.forecastTurnover).toLocaleString()} {business.currency}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm font-medium pt-2 border-t">
                                            <span>Adjustment (Regularisation):</span>
                                            <span>
                                                {((g12IfuData.currentYearRealTurnover * (g12IfuData.forecast.ifuRate/100)) - g12IfuData.forecast.taxDueInitial).toLocaleString()} {business.currency}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="pt-2 print:hidden">
                                <Button 
                                    variant="outline" 
                                    className="w-full"
                                    onClick={() => downloadG12BisCSV(g12IfuData)}
                                >
                                    <Download className="mr-2 h-4 w-4" /> Export G12bis CSV
                                </Button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center text-muted-foreground">Loading IFU data...</div>
                    )}
                </div>
            ) : (
                // Standard Real Regime View
                g12Data ? (
                    <div className="space-y-2 border rounded-md p-4 bg-muted/20 print:bg-white print:border-gray-300">
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Fiscal Regime:</span>
                            <span className="font-medium">{g12Data.fiscalRegime}</span>
                        </div>
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-sm text-muted-foreground">Total Annual Turnover (HT):</span>
                            <span className="font-bold">{g12Data.turnoverHt.toLocaleString()} {business.currency}</span>
                        </div>
                        <div className="flex justify-between pt-2">
                            <span className="text-sm text-muted-foreground">Goods (Vente de marchandises):</span>
                            <span className="font-medium">{g12Data.turnoverGoods.toLocaleString()} {business.currency}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">Services (Prestations):</span>
                            <span className="font-medium">{g12Data.turnoverServices.toLocaleString()} {business.currency}</span>
                        </div>
                        <div className="pt-4 mt-2 print:hidden">
                            <Button 
                                variant="outline" 
                                className="w-full"
                                onClick={() => downloadG12CSV(g12Data)}
                            >
                                <Download className="mr-2 h-4 w-4" /> Export G12 CSV
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 text-center text-muted-foreground">Loading data...</div>
                )
            )}
          </CardContent>
        </Card>
        ) : (
            <Card className="print:hidden bg-muted/10 border-dashed">
                <CardHeader>
                    <CardTitle className="text-muted-foreground text-lg">G12 / G12bis Not Applicable</CardTitle>
                    <CardDescription>
                        These declarations are only for "Personnes Physiques" (Entreprises Individuelles).
                        <br />
                        Your business is registered as: <span className="font-semibold text-foreground">{business.legalForm || "Unknown"}</span>.
                    </CardDescription>
                </CardHeader>
            </Card>
        )}
      </div>
    </DashboardLayout>
  );
}