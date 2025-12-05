import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, FileText, CreditCard, DollarSign, Info } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function DashboardRecap({ businessId }: { businessId: Id<"businesses"> }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  const prevDate = new Date(currentYear, currentMonth - 1, 1);
  const prevMonth = prevDate.getMonth();
  const prevYear = prevDate.getFullYear();

  const currentStats = useQuery(api.reports.getDashboardStats, { 
    businessId, 
    month: currentMonth, 
    year: currentYear 
  });

  const prevStats = useQuery(api.reports.getDashboardStats, { 
    businessId, 
    month: prevMonth, 
    year: prevYear 
  });

  if (!currentStats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium"><Skeleton className="h-4 w-20" /></CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const calculateChange = (current: number, prev: number) => {
    if (prev === 0) return current > 0 ? 100 : 0;
    return ((current - prev) / prev) * 100;
  };

  const revenueChange = calculateChange(currentStats.turnover, prevStats?.turnover || 0);
  const invoiceChange = calculateChange(currentStats.invoiceCount, prevStats?.invoiceCount || 0);
  const pendingChange = 0; 
  const customerChange = calculateChange(currentStats.customerCount, prevStats?.customerCount || 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(amount).replace('DZD', 'DA');
  };

  const stats = [
    {
      title: t("dashboard.recap.revenue"),
      value: formatCurrency(currentStats.turnover),
      change: `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}%`,
      icon: DollarSign,
      trend: revenueChange >= 0 ? "up" : "down",
      path: "/invoices",
      tooltip: "Total revenue (TTC) generated this month",
    },
    {
      title: t("dashboard.recap.invoices"),
      value: currentStats.invoiceCount.toString(),
      change: `${invoiceChange > 0 ? '+' : ''}${invoiceChange.toFixed(1)}%`,
      icon: FileText,
      trend: invoiceChange >= 0 ? "up" : "down",
      path: "/invoices",
      tooltip: "Number of invoices issued this month",
    },
    {
      title: t("dashboard.recap.pending"),
      value: formatCurrency(currentStats.outstandingAmount),
      change: "Total", // Global stat
      icon: CreditCard,
      trend: "neutral",
      path: "/invoices",
      tooltip: "Total outstanding amount from unpaid invoices",
    },
    {
      title: t("dashboard.recap.customers"),
      value: currentStats.customerCount.toString(),
      change: "Total", // Global stat
      icon: Users,
      trend: "neutral",
      path: "/customers",
      tooltip: "Total number of active customers",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card 
          key={stat.title}
          className="cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={() => navigate(stat.path)}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <Popover>
                <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                  <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                </PopoverTrigger>
                <PopoverContent className="w-auto max-w-[200px] p-2 text-xs">
                  <p>{stat.tooltip}</p>
                </PopoverContent>
              </Popover>
            </div>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              {stat.trend !== "neutral" && (
                 <span className={stat.trend === "up" ? "text-emerald-500" : "text-red-500"}>
                   {stat.change}
                 </span>
              )}
              {stat.trend === "neutral" && (
                  <span className="text-muted-foreground">{stat.change}</span>
              )}
              {stat.trend !== "neutral" && <span className="ml-1">{t("dashboard.recap.vsLastMonth")}</span>}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}