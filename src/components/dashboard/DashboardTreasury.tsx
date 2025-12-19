import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Wallet } from "lucide-react";

export function DashboardTreasury({ businessId }: { businessId: Id<"businesses"> }) {
  const stats = useQuery(api.reports.getTreasuryStats, { businessId });

  if (!stats) return <Skeleton className="h-[300px] w-full" />;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-DZ', { style: 'currency', currency: 'DZD', maximumFractionDigits: 0 }).format(amount).replace('DZD', 'DA');
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Treasury</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold text-primary">{formatCurrency(stats.totalBalance)}</div>
        </CardContent>
      </Card>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {stats.accounts.map((account) => (
          <Card key={account._id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{account.bankName}</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(account.balance)}</div>
              <p className="text-xs text-muted-foreground truncate">{account.iban || account.name}</p>
            </CardContent>
          </Card>
        ))}
        {stats.accounts.length === 0 && (
            <Card className="border-dashed">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">No Accounts</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Add bank accounts in settings to track treasury.</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}