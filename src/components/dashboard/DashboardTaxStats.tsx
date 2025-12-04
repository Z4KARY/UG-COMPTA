import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Calculator, Receipt, Scale, Stamp } from "lucide-react";

export function DashboardTaxStats({ businessId }: { businessId: Id<"businesses"> }) {
  const { t } = useLanguage();
  const now = new Date();
  const stats = useQuery(api.reports.getDashboardStats, { 
    businessId, 
    month: now.getMonth(), 
    year: now.getFullYear() 
  });

  if (!stats) return <Skeleton className="h-32 w-full" />;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(amount).replace('DZD', 'DA');
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">TVA Collected</CardTitle>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.tva)}</div>
          <p className="text-xs text-muted-foreground mt-1">This Month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">TVA Deductible</CardTitle>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.tvaDeductible)}</div>
          <p className="text-xs text-muted-foreground mt-1">This Month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Net TVA Payable</CardTitle>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.tvaPayable > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {formatCurrency(stats.tvaPayable)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">This Month</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Stamp Duty</CardTitle>
          <Stamp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.stampDuty)}</div>
          <p className="text-xs text-muted-foreground mt-1">This Month</p>
        </CardContent>
      </Card>
    </div>
  );
}
