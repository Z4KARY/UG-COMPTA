import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Info } from "lucide-react";

export function DashboardBalanceCards({ businessId }: { businessId: Id<"businesses"> }) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const balance = useQuery(api.reports.getFinancialBalance, { businessId });

  if (!balance) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-80"><Skeleton className="h-4 w-24" /></CardTitle>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD' }).format(amount).replace('DZD', 'DA');
  };
  
  const { revenue, expenses, balance: netBalance } = balance.monthly;

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card 
        className="bg-primary text-primary-foreground cursor-pointer hover:opacity-90 transition-opacity"
        onClick={() => navigate("/invoices")}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium opacity-80">{t("dashboard.balance.total")}</CardTitle>
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3 w-3 opacity-50 hover:opacity-100 transition-opacity" />
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-[200px] p-2 text-xs text-primary">
                <p>Current financial balance (Revenue - Expenses)</p>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{formatCurrency(netBalance)}</div>
          <p className="text-xs opacity-80 mt-1">This Month</p>
        </CardContent>
      </Card>
      <Card 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => navigate("/invoices")}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.balance.income")}</CardTitle>
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-[200px] p-2 text-xs">
                <p>Total income recorded this month</p>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-600">+ {formatCurrency(revenue)}</div>
          <p className="text-xs text-muted-foreground mt-1">This Month</p>
        </CardContent>
      </Card>
      <Card 
        className="cursor-pointer hover:bg-muted/50 transition-colors"
        onClick={() => navigate("/purchases")}
      >
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("dashboard.balance.expenses")}</CardTitle>
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-[200px] p-2 text-xs">
                <p>Total expenses recorded this month</p>
              </PopoverContent>
            </Popover>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">- {formatCurrency(expenses)}</div>
          <p className="text-xs text-muted-foreground mt-1">This Month</p>
        </CardContent>
      </Card>
    </div>
  );
}