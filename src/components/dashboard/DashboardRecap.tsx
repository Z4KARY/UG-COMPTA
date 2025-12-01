import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, Users, FileText, CreditCard, DollarSign } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function DashboardRecap() {
  const { t } = useLanguage();

  const stats = [
    {
      title: t("dashboard.recap.revenue"),
      value: "2,350,000 DA",
      change: "+12.5%",
      icon: DollarSign,
      trend: "up",
    },
    {
      title: t("dashboard.recap.invoices"),
      value: "145",
      change: "+4.2%",
      icon: FileText,
      trend: "up",
    },
    {
      title: t("dashboard.recap.pending"),
      value: "450,000 DA",
      change: "-2.1%",
      icon: CreditCard,
      trend: "down",
    },
    {
      title: t("dashboard.recap.customers"),
      value: "48",
      change: "+8.4%",
      icon: Users,
      trend: "up",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {stat.title}
            </CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <span className={stat.trend === "up" ? "text-emerald-500" : "text-red-500"}>
                {stat.change}
              </span>
              <span className="ml-1">{t("dashboard.recap.vsLastMonth")}</span>
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}