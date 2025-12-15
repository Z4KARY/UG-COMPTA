import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatCurrency } from "@/lib/utils";
import { Percent, DollarSign, Building, Scale } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export function DashboardProfitability({ data }: { data: any }) {
  const { language } = useLanguage();

  if (!data) return null;

  return (
    <div className="space-y-4">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit Margin</CardTitle>
            <div className="p-2 rounded-full bg-primary/10">
              <Percent className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tracking-tight ${data.netMargin >= 20 ? 'text-emerald-600' : data.netMargin > 0 ? 'text-primary' : 'text-red-600'}`}>
              {data.netMargin.toFixed(1)}%
            </div>
            <Progress value={Math.max(0, Math.min(100, data.netMargin))} className="h-2 mt-2" />
            <p className="text-xs text-muted-foreground mt-2 font-medium">Target: &gt;20%</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Cash Flow</CardTitle>
            <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/20">
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold tracking-tight ${data.cashFlow >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {data.cashFlow >= 0 ? '+' : ''}{formatCurrency(data.cashFlow)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Net Cash Movement</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Est. IBS (Corporate Tax)</CardTitle>
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20">
              <Building className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-orange-600">{formatCurrency(data.ibsEstimate)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Estimated at {data.ibsRate}% of Profit</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Est. TAP Liability</CardTitle>
            <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/20">
              <Scale className="h-4 w-4 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold tracking-tight text-orange-600">{formatCurrency(data.tapEstimate)}</div>
            <p className="text-xs text-muted-foreground mt-1 font-medium">Estimated at 0% of Turnover</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
         <Card className="hover:shadow-md transition-all duration-200">
            <CardHeader>
                <CardTitle className="text-base">Growth Metrics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">New Customers</span>
                    <span className="text-sm font-bold bg-primary/10 text-primary px-2 py-1 rounded">{data.newCustomers}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">Invoices Created</span>
                    <span className="text-sm font-bold">{data.invoiceCount}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">Avg. Invoice Value</span>
                    <span className="text-sm font-bold">{formatCurrency(data.averageInvoiceValue)}</span>
                </div>
            </CardContent>
         </Card>

         <Card className="hover:shadow-md transition-all duration-200">
            <CardHeader>
                <CardTitle className="text-base">Operational Efficiency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">Invoices Created Today</span>
                    <span className="text-sm font-bold">{data.invoicesCreatedToday}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">Expenses Logged Today</span>
                    <span className="text-sm font-bold">{data.expensesLoggedToday}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <span className="text-sm font-medium">Working Capital</span>
                    <span className={`text-sm font-bold ${data.workingCapital > 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(data.workingCapital)}
                    </span>
                </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
}