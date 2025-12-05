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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Row 1: Core Financials */}
      <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/invoices")}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-[200px] p-2 text-xs">
                <p>Total Revenue (HT) minus Total Expenses (HT)</p>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${currentStats.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {formatCurrency(currentStats.netProfit)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Margin: {currentStats.netMargin.toFixed(1)}%</p>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">EBITDA (Est.)</CardTitle>
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-[200px] p-2 text-xs">
                <p>Earnings Before Interest, Taxes, Depreciation, and Amortization</p>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(currentStats.ebitda)}</div>
          <p className="text-xs text-muted-foreground mt-1">Operational Performance</p>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Working Capital</CardTitle>
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-[200px] p-2 text-xs">
                <p>Current Assets - Current Liabilities</p>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(currentStats.workingCapital)}</div>
          <p className="text-xs text-muted-foreground mt-1">Liquidity Indicator</p>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:bg-muted/50 transition-colors">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Cash Runway</CardTitle>
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-[200px] p-2 text-xs">
                <p>Months until cash runs out at current burn rate</p>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${currentStats.cashRunway < 3 ? 'text-red-600' : 'text-emerald-600'}`}>
            {currentStats.cashRunway.toFixed(1)} Months
          </div>
          <p className="text-xs text-muted-foreground mt-1">Based on avg expenses</p>
        </CardContent>
      </Card>

      {/* Row 2: Operational & Risk */}
      <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/invoices")}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.kpi.avgInvoice")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(currentStats.averageInvoiceValue)}</div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/invoices")}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.kpi.collectionRate")}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{collectionRate.toFixed(1)}%</div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/invoices")}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Invoices</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${currentStats.overdueCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {currentStats.overdueCount}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Action Required</p>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => navigate("/purchases")}>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accounts Payable</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(currentStats.accountsPayable)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">Unpaid Bills</p>
        </CardContent>
      </Card>
    </div>
  );
}