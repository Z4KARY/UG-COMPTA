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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, Save } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { downloadG12CSV, downloadG12BisCSV, downloadAEInvoicesCSV } from "@/lib/declaration-utils";

interface G12SectionProps {
  business: any;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  g12Data: any;
  g12IfuData: any;
  aeInvoicesData: any;
  forecastAmount: string;
  setForecastAmount: (amount: string) => void;
  ifuRate: string;
  setIfuRate: (rate: string) => void;
  handleSaveForecast: () => void;
}

export function G12Section({
  business,
  selectedYear,
  setSelectedYear,
  g12Data,
  g12IfuData,
  aeInvoicesData,
  forecastAmount,
  setForecastAmount,
  ifuRate,
  setIfuRate,
  handleSaveForecast
}: G12SectionProps) {
  const { t } = useLanguage();

  return (
    <Card className="print:shadow-none print:border print:break-before-page">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {t("declarations.g12.title")}
        </CardTitle>
        <CardDescription>
          {t("declarations.g12.description")} {(business.fiscalRegime === "IFU" || business.fiscalRegime === "forfaitaire" || business.fiscalRegime === "auto_entrepreneur") ? "IFU (Simplified)" : "Real"} {t("declarations.g12.regime").toLowerCase()}.
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
                    <SelectValue placeholder={t("common.year")} />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <div className="hidden print:block mb-4">
            <p className="font-bold">{t("common.year")}: {selectedYear}</p>
            <p>{t("declarations.g12.regime")}: {business.fiscalRegime || "VAT"}</p>
        </div>

        {(business.fiscalRegime === "IFU" || business.fiscalRegime === "forfaitaire" || business.fiscalRegime === "auto_entrepreneur") ? (
            // IFU Specific View
            <div className="space-y-4">
                {g12IfuData ? (
                    <>
                        <div className="p-4 border rounded-md bg-blue-50/50 space-y-2">
                            <h3 className="font-semibold text-sm">{t("declarations.g12.forecast")}</h3>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t("declarations.g12.turnoverN1")}:</span>
                                <span>{g12IfuData.previousYearTurnover.toLocaleString()} {business.currency}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2 print:hidden">
                                <div className="space-y-1">
                                    <Label className="text-xs">{t("declarations.g12.forecastN")}</Label>
                                    <Input 
                                        type="number" 
                                        value={forecastAmount} 
                                        onChange={(e) => setForecastAmount(e.target.value)}
                                        placeholder={g12IfuData.forecast?.forecastTurnover.toString() || t("declarations.g12.enterForecast")}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">{t("declarations.g12.ifuRate")}</Label>
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
                                    <Save className="mr-2 h-3 w-3" /> {t("declarations.g12.save")}
                                </Button>
                            </div>
                            {g12IfuData.forecast && (
                                <div className="pt-2 border-t mt-2 text-sm">
                                    <div className="flex justify-between">
                                        <span>{t("declarations.g12.saved")}:</span>
                                        <span className="font-medium">{g12IfuData.forecast.forecastTurnover.toLocaleString()} {business.currency}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>{t("declarations.g12.initialTax")}:</span>
                                        <span className="font-medium">{g12IfuData.forecast.taxDueInitial.toLocaleString()} {business.currency}</span>
                                    </div>
                                    <div className="pt-2 print:hidden">
                                        <Button 
                                            variant="outline" 
                                            size="sm"
                                            className="w-full"
                                            onClick={() => downloadG12CSV(g12IfuData)}
                                        >
                                            <Download className="mr-2 h-4 w-4" /> {t("declarations.g12.export")}
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 border rounded-md bg-green-50/50 space-y-2">
                            <h3 className="font-semibold text-sm">{t("declarations.g12bis.title")}</h3>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{t("declarations.g12bis.realTurnover")}:</span>
                                <span className="font-bold">{g12IfuData.currentYearRealTurnover.toLocaleString()} {business.currency}</span>
                            </div>
                            {g12IfuData.forecast && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">{t("declarations.g12bis.difference")}:</span>
                                        <span className={g12IfuData.currentYearRealTurnover > g12IfuData.forecast.forecastTurnover ? "text-red-600" : "text-green-600"}>
                                            {(g12IfuData.currentYearRealTurnover - g12IfuData.forecast.forecastTurnover).toLocaleString()} {business.currency}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium pt-2 border-t">
                                        <span>{t("declarations.g12bis.adjustment")}:</span>
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
                                <Download className="mr-2 h-4 w-4" /> {t("declarations.g12bis.export")}
                            </Button>
                        </div>
                        
                        {/* AE Invoice Export Button */}
                        {business.type === "auto_entrepreneur" && aeInvoicesData && (
                            <div className="pt-4 border-t mt-4">
                                <h3 className="font-semibold text-sm mb-2">{t("declarations.ae.accountingExport")}</h3>
                                <Button 
                                    variant="secondary" 
                                    className="w-full"
                                    onClick={() => downloadAEInvoicesCSV(aeInvoicesData, selectedYear)}
                                >
                                    <Download className="mr-2 h-4 w-4" /> {t("declarations.ae.export")}
                                </Button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center text-muted-foreground">{t("declarations.g12.loadingIfu")}</div>
                )}
            </div>
        ) : (
            // Standard Real Regime View (Personne Physique Réel Simplifié)
            g12Data ? (
                <div className="space-y-2 border rounded-md p-4 bg-muted/20 print:bg-white print:border-gray-300">
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t("declarations.g12.regime")}:</span>
                        <span className="font-medium">{g12Data.fiscalRegime}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-sm text-muted-foreground">{t("declarations.g12.totalTurnover")}:</span>
                        <span className="font-bold">{g12Data.turnoverHt.toLocaleString()} {business.currency}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                        <span className="text-sm text-muted-foreground">{t("declarations.g12.goods")}:</span>
                        <span className="font-medium">{g12Data.turnoverGoods.toLocaleString()} {business.currency}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">{t("declarations.g12.services")}:</span>
                        <span className="font-medium">{g12Data.turnoverServices.toLocaleString()} {business.currency}</span>
                    </div>
                </div>
            ) : (
                <div className="p-4 text-center text-muted-foreground">{t("declarations.loading")}</div>
            )
        )}
      </CardContent>
    </Card>
  );
}
