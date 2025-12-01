import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

export function DashboardBalanceCards() {
  const { t } = useLanguage();

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="bg-primary text-primary-foreground">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-80">{t("dashboard.balance.total")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">1,850,000 DA</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.balance.income")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">+ 2,350,000 DA</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.balance.expenses")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">- 500,000 DA</div>
        </CardContent>
      </Card>
    </div>
  );
}