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
import { FileText, Download, Printer, Save, Settings } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Link } from "react-router";
import { G50Declaration } from "@/components/G50Declaration";

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
        toast.success("G12 Forecast saved successfully");
    } catch (error) {
        toast.error("Failed to save forecast");
    }
  };

  const downloadG12CSV = (data: any) => {
    if (!data) return;

    // G12 CSV EXPORT FORMAT (Forecast Declaration)
    // AE Spec: year,business_name,auto_entrepreneur_card_number,nif,activity_label,forecast_turnover,ifu_rate,estimated_tax_due,created_at

    const forecast = data.forecast?.forecastTurnover || 0;
    const rate = data.forecast?.ifuRate || 0;
    const taxDue = data.forecast?.taxDueInitial || 0;

    const headers = [
        "year",
        "business_name",
        "auto_entrepreneur_card_number",
        "nif",
        "activity_label",
        "forecast_turnover",
        "ifu_rate",
        "estimated_tax_due",
        "created_at"
    ];

    const row = [
        data.year,
        `"${data.businessName}"`,
        `"${data.autoEntrepreneurCardNumber || ""}"`,
        `"${data.nif}"`,
        `"${data.activityLabel || ""}"`,
        forecast.toFixed(2),
        rate.toString(),
        taxDue.toFixed(2),
        new Date(data.createdAt).toISOString()
    ];

    const csvContent = "\uFEFF" + headers.join(",") + "\n" 
        + row.join(",");

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AE_G12_${data.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadG12BisCSV = (data: any) => {
    if (!data) return;
    
    // G12bis CSV EXPORT FORMAT (Final Declaration)
    // AE Spec: year,business_name,auto_entrepreneur_card_number,nif,forecast_turnover,real_turnover,difference,ifu_rate,tax_forecast,tax_real,tax_difference,created_at
    
    const forecast = data.forecast?.forecastTurnover || 0;
    const real = data.currentYearRealTurnover || 0;
    const diff = real - forecast;
    const rate = data.forecast?.ifuRate || 0;
    const taxForecast = data.forecast?.taxDueInitial || 0;
    const taxReal = real * (rate / 100);
    const taxDiff = taxReal - taxForecast;

    const headers = [
        "year",
        "business_name",
        "auto_entrepreneur_card_number",
        "nif",
        "forecast_turnover",
        "real_turnover",
        "difference",
        "ifu_rate",
        "tax_forecast",
        "tax_real",
        "tax_difference",
        "created_at"
    ];

    const row = [
        data.year,
        `"${data.businessName}"`,
        `"${data.autoEntrepreneurCardNumber || ""}"`,
        `"${data.nif}"`,
        forecast.toFixed(2),
        real.toFixed(2),
        diff.toFixed(2),
        rate.toString(),
        taxForecast.toFixed(2),
        taxReal.toFixed(2),
        taxDiff.toFixed(2),
        new Date(data.createdAt).toISOString()
    ];

    const csvContent = "\uFEFF" + headers.join(",") + "\n" 
        + row.join(",");

    const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `AE_G12Bis_${data.year}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAEInvoicesCSV = (data: any[]) => {
      if (!data || data.length === 0) return;

      // AE Invoice Export
      // Columns: invoice_number,invoice_date,customer_name,customer_address,description,amount_ttc,payment_status,payment_method,auto_entrepreneur_card_number,nif,business_activity_code

      const headers = [
          "invoice_number",
          "invoice_date",
          "customer_name",
          "customer_address",
          "description",
          "amount_ttc",
          "payment_status",
          "payment_method",
          "auto_entrepreneur_card_number",
          "nif",
          "business_activity_code"
      ];

      const rows = data.map(row => [
          row.invoiceNumber,
          new Date(row.invoiceDate).toISOString().split('T')[0],
          `"${row.customerName}"`,
          `"${row.customerAddress}"`,
          `"${row.description}"`,
          row.amountTtc.toFixed(2),
          row.paymentStatus,
          row.paymentMethod,
          `"${row.autoEntrepreneurCardNumber || ""}"`,
          `"${row.nif}"`,
          `"${row.businessActivityCode}"`
      ].join(","));

      const csvContent = "\uFEFF" + headers.join(",") + "\n" + rows.join("\n");
      const encodedUri = encodeURI("data:text/csv;charset=utf-8," + csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `AE_INVOICES_${selectedYear}.csv`);
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

  if (!business.type) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-6">
            <div className="p-4 rounded-full bg-muted/30">
                <Settings className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="text-center space-y-2 max-w-md">
                <h2 className="text-2xl font-bold tracking-tight">Business Configuration Required</h2>
                <p className="text-muted-foreground">
                    We need to know your business type (Société, Personne Physique, or Auto-Entrepreneur) to show the correct tax declarations.
                </p>
            </div>
            <Button asChild size="lg">
                <Link to="/settings">Configure Business Type</Link>
            </Button>
        </div>
      </DashboardLayout>
    );
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
        <h1 className="text-3xl font-bold tracking-tight">Declarations</h1>
        <Button variant="outline" onClick={handlePrint}>
            <Printer className="mr-2 h-4 w-4" /> Print Summary
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 print:block print:space-y-6">
        {/* G50 Monthly Declaration */}
        {showG50 && (
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
                <G50Declaration 
                    business={business} 
                    month={selectedMonth} 
                    year={selectedYear} 
                    data={g50Data} 
                />
            ) : (
                <div className="p-4 text-center text-muted-foreground">Loading data...</div>
            )}
          </CardContent>
        </Card>
        )}

        {/* G12 Annual Declaration */}
        {showG12 ? (
        <Card className="print:shadow-none print:border print:break-before-page">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                G12 / G12bis Annual
            </CardTitle>
            <CardDescription>
              Annual turnover declaration for {(business.fiscalRegime === "IFU" || business.fiscalRegime === "forfaitaire" || business.fiscalRegime === "auto_entrepreneur") ? "IFU (Simplified)" : "Real"} regime.
              <br/>
              <span className="text-xs text-muted-foreground">
                  {business.type === "auto_entrepreneur" ? "Auto-Entrepreneur" : "Personne Physique (Entreprise Individuelle)"}
              </span>
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

            {(business.fiscalRegime === "IFU" || business.fiscalRegime === "forfaitaire" || business.fiscalRegime === "auto_entrepreneur") ? (
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
                                        <div className="pt-2 print:hidden">
                                            <Button 
                                                variant="outline" 
                                                size="sm"
                                                className="w-full"
                                                onClick={() => downloadG12CSV(g12IfuData)}
                                            >
                                                <Download className="mr-2 h-4 w-4" /> Export G12 CSV
                                            </Button>
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
                            
                            {/* AE Invoice Export Button */}
                            {business.type === "auto_entrepreneur" && aeInvoicesData && (
                                <div className="pt-4 border-t mt-4">
                                    <h3 className="font-semibold text-sm mb-2">Accounting Export</h3>
                                    <Button 
                                        variant="secondary" 
                                        className="w-full"
                                        onClick={() => downloadAEInvoicesCSV(aeInvoicesData)}
                                    >
                                        <Download className="mr-2 h-4 w-4" /> Export Annual Invoices (AE)
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-center text-muted-foreground">Loading IFU data...</div>
                    )}
                </div>
            ) : (
                // Standard Real Regime View (Personne Physique Réel Simplifié)
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
                        {/* Note: G12/G12bis CSVs for Réel Simplifié might differ or be less relevant if they don't do forecast, but we leave the option if needed or just show summary */}
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
                        These declarations are not applicable for your business type ({business.type}).
                    </CardDescription>
                </CardHeader>
            </Card>
        )}
      </div>
    </DashboardLayout>
  );
}