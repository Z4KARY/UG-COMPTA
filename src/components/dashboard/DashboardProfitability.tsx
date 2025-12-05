import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, DollarSign, Percent, Building, Scale } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function DashboardProfitability({ businessId }: { businessId: Id<"businesses"> }) {
  const { t } = useLanguage();
  const now = new Date();
  const stats = useQuery(api.reports.getDashboardStats, { 
    businessId, 
    month: now.getMonth(), 
    year: now.getFullYear() 
  });

  if (!stats) return <Skeleton className="h-[300px] w-full" />;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(amount).replace('DZD', 'DA');
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit Margin</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.netMargin >= 20 ? 'text-emerald-600' : stats.netMargin > 0 ? 'text-primary' : 'text-red-600'}`}>
              {stats.netMargin.toFixed(1)}%
            </div>
            <Progress value={Math.max(0, Math.min(100, stats.netMargin))} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Target: &gt;20%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Cash Flow</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.cashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {stats.cashFlow >= 0 ? '+' : ''}{formatCurrency(stats.cashFlow)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Net Cash Movement</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Est. IBS (Corporate Tax)</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.ibsEstimate)}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated at 23% of Profit</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Est. TAP Liability</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{formatCurrency(stats.tapEstimate)}</div>
            <p className="text-xs text-muted-foreground mt-1">Estimated at 1.5% of Turnover</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
         <Card>
            <CardHeader>
                <CardTitle className="text-base">Growth Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">New Customers</span>
                    <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded">{stats.newCustomers}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Invoices Created</span>
                    <span className="text-sm font-bold">{stats.invoiceCount}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Avg. Invoice Value</span>
                    <span className="text-sm font-bold">{formatCurrency(stats.averageInvoiceValue)}</span>
                </div>
            </CardContent>
         </Card>

         <Card>
            <CardHeader>
                <CardTitle className="text-base">Operational Efficiency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Invoices Created Today</span>
                    <span className="text-sm font-bold">{stats.invoicesCreatedToday}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Expenses Logged Today</span>
                    <span className="text-sm font-bold">{stats.expensesLoggedToday}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Working Capital</span>
                    <span className={`text-sm font-bold ${stats.workingCapital > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(stats.workingCapital)}
                    </span>
                </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}