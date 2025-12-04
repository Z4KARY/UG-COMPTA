import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Lock, Unlock } from "lucide-react";
import { format } from "date-fns";
import { useLanguage } from "@/contexts/LanguageContext";

interface PeriodsSectionProps {
  periods: any[] | undefined;
  closureData: { month: number; year: number };
  setClosureData: (data: { month: number; year: number }) => void;
  handleClosePeriod: () => void;
  periodToReopen: any;
  setPeriodToReopen: (id: any) => void;
  confirmReopenPeriod: () => void;
}

export function PeriodsSection({
  periods,
  closureData,
  setClosureData,
  handleClosePeriod,
  periodToReopen,
  setPeriodToReopen,
  confirmReopenPeriod
}: PeriodsSectionProps) {
  const { t } = useLanguage();

  return (
    <>
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
