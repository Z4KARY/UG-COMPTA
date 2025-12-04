import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardTopPerformers({ businessId }: { businessId: Id<"businesses"> }) {
  const { t } = useLanguage();
  const data = useQuery(api.reports.getTopPerformers, { businessId });

  if (!data) return <Skeleton className="h-[300px] w-full" />;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(amount).replace('DZD', 'DA');
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Top Customers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.customers.map((customer, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {i + 1}
                  </div>
                  <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]">{customer.name}</span>
                </div>
                <span className="text-muted-foreground font-mono text-sm">{formatCurrency(customer.amount)}</span>
              </div>
            ))}
            {data.customers.length === 0 && <p className="text-muted-foreground text-sm">No data available</p>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Top Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.products.map((product, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-xs">
                    {i + 1}
                  </div>
                  <span className="font-medium truncate max-w-[150px] sm:max-w-[200px]">{product.name}</span>
                </div>
                <span className="text-muted-foreground font-mono text-sm">{formatCurrency(product.amount)}</span>
              </div>
            ))}
            {data.products.length === 0 && <p className="text-muted-foreground text-sm">No data available</p>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
