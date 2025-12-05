import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";
import { Activity, Wallet, TrendingUp, AlertCircle } from "lucide-react";

export function DashboardKPIGrid({ businessId }: { businessId: Id<"businesses"> }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const now = new Date();
  const currentStats = useQuery(api.reports.getDashboardStats, { 
    businessId, 
    month: now.getMonth(), 
    year: now.getFullYear() 
  });

  if (!currentStats) {
    return (
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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

  const totalTurnover = currentStats.totalTurnover || 0;
  const outstanding = currentStats.outstandingAmount || 0;
  const collected = totalTurnover - outstanding;
  const collectionRate = totalTurnover > 0 ? (collected / totalTurnover) * 100 : 0;

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      {/* Row 1: Core Financials */}
      <Card className="cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => navigate("/invoices")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-[200px] p-2 text-xs">
                <p>Total Revenue (HT) minus Total Expenses (HT)</p>
              </PopoverContent>
            </Popover>
          </div>
          <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/20">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold tracking-tight ${currentStats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(currentStats.netProfit)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Margin: {currentStats.netMargin.toFixed(1)}%</p>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">EBITDA (Est.)</CardTitle>
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-[200px] p-2 text-xs">
                <p>Earnings Before Interest, Taxes, Depreciation, and Amortization</p>
              </PopoverContent>
            </Popover>
          </div>
          <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/20">
            <Activity className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{formatCurrency(currentStats.ebitda)}</div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Operational Performance</p>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Working Capital</CardTitle>
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-[200px] p-2 text-xs">
                <p>Current Assets - Current Liabilities</p>
              </PopoverContent>
            </Popover>
          </div>
          <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/20">
            <Wallet className="h-4 w-4 text-purple-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{formatCurrency(currentStats.workingCapital)}</div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Liquidity Indicator</p>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cash Runway</CardTitle>
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3.5 w-3.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors" />
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-[200px] p-2 text-xs">
                <p>Months until cash runs out at current burn rate</p>
              </PopoverContent>
            </Popover>
          </div>
          <div className={`p-2 rounded-full ${currentStats.cashRunway < 3 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-emerald-100 dark:bg-emerald-900/20'}`}>
            <Activity className={`h-4 w-4 ${currentStats.cashRunway < 3 ? 'text-red-600' : 'text-emerald-600'}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold tracking-tight ${currentStats.cashRunway < 3 ? 'text-red-600' : 'text-emerald-600'}`}>
            {currentStats.cashRunway.toFixed(1)} Months
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Based on avg expenses</p>
        </CardContent>
      </Card>

      {/* Row 2: Operational & Risk */}
      <Card className="cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => navigate("/invoices")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.kpi.avgInvoice")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{formatCurrency(currentStats.averageInvoiceValue)}</div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => navigate("/invoices")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.kpi.collectionRate")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight">{collectionRate.toFixed(1)}%</div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => navigate("/invoices")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Invoices</CardTitle>
          </div>
          <div className={`p-2 rounded-full ${currentStats.overdueCount > 0 ? 'bg-red-100 dark:bg-red-900/20' : 'bg-emerald-100 dark:bg-emerald-900/20'}`}>
            <AlertCircle className={`h-4 w-4 ${currentStats.overdueCount > 0 ? 'text-red-600' : 'text-emerald-600'}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold tracking-tight ${currentStats.overdueCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {currentStats.overdueCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Action Required</p>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md transition-all duration-200" onClick={() => navigate("/purchases")}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accounts Payable</CardTitle>
          </div>
          <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20">
            <Wallet className="h-4 w-4 text-orange-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold tracking-tight text-orange-600">
            {formatCurrency(currentStats.accountsPayable)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 font-medium">Unpaid Bills</p>
        </CardContent>
      </Card>
    </div>
  );
}