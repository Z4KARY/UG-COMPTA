import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardKPIGrid({ businessId }: { businessId: Id<"businesses"> }) {
  const { t } = useLanguage();
  
  const now = new Date();
  const currentStats = useQuery(api.reports.getDashboardStats, { 
    businessId, 
    month: now.getMonth(), 
    year: now.getFullYear() 
  });

  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevStats = useQuery(api.reports.getDashboardStats, { 
    businessId, 
    month: prevDate.getMonth(), 
    year: prevDate.getFullYear() 
  });

  if (!currentStats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground"><Skeleton className="h-4 w-24" /></CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(amount).replace('DZD', 'DA');
  };

  // Calculate Collection Rate
  // Collection Rate = (Total Revenue - Outstanding) / Total Revenue * 100
  // Note: turnover in stats is for the period. outstandingAmount is global.
  // This might be skewed if we mix period and global.
  // Let's try to estimate based on global turnover if available, or just use period data if we had paid amount.
  // getDashboardStats returns `turnover` (TTC) and `outstandingAmount` (Global).
  // We also have `totalTurnover` (Global) in the updated reports.ts
  
  const totalTurnover = currentStats.totalTurnover || 0;
  const outstanding = currentStats.outstandingAmount || 0;
  const collected = totalTurnover - outstanding;
  const collectionRate = totalTurnover > 0 ? (collected / totalTurnover) * 100 : 0;

  // Growth
  const currentRevenue = currentStats.turnover;
  const prevRevenue = prevStats?.turnover || 0;
  const growth = prevRevenue === 0 ? (currentRevenue > 0 ? 100 : 0) : ((currentRevenue - prevRevenue) / prevRevenue) * 100;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.kpi.avgInvoice")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(currentStats.averageInvoiceValue)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.kpi.collectionRate")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{collectionRate.toFixed(1)}%</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.kpi.outstanding")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{formatCurrency(outstanding)}</div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.kpi.growth")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${growth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
          </div>
        </CardContent>
      </Card>
    </div>
  );
}