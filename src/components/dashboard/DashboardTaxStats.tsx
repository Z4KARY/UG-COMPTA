import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { useLanguage } from "@/contexts/LanguageContext";
import { Info, Receipt, Calculator, Stamp, CalendarClock, Scale } from "lucide-react";
import { useNavigate } from "react-router";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardTaxStats({ businessId }: { businessId: Id<"businesses"> }) {
  // const { t } = useLanguage();
  const navigate = useNavigate();
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

  const handleClick = () => navigate("/declarations");

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5">
      <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleClick}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">TVA Collected</CardTitle>
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-[200px] p-2 text-xs">
                <p>Total VAT collected from sales this month</p>
              </PopoverContent>
            </Popover>
          </div>
          <Receipt className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.tva)}</div>
          <p className="text-xs text-muted-foreground mt-1">This Month</p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleClick}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">TVA Deductible</CardTitle>
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-[200px] p-2 text-xs">
                <p>Total VAT deductible from purchases this month</p>
              </PopoverContent>
            </Popover>
          </div>
          <Calculator className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.tvaDeductible)}</div>
          <p className="text-xs text-muted-foreground mt-1">This Month</p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleClick}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Net TVA Payable</CardTitle>
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-[200px] p-2 text-xs">
                <p>Net VAT to be paid (Collected - Deductible)</p>
              </PopoverContent>
            </Popover>
          </div>
          <Scale className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.tvaPayable > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
            {formatCurrency(stats.tvaPayable)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">This Month</p>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleClick}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Stamp Duty</CardTitle>
            <Popover>
              <PopoverTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Info className="h-3 w-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
              </PopoverTrigger>
              <PopoverContent className="w-auto max-w-[200px] p-2 text-xs">
                <p>Total stamp duty collected (Cash payments)</p>
              </PopoverContent>
            </Popover>
          </div>
          <Stamp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.stampDuty)}</div>
          <p className="text-xs text-muted-foreground mt-1">This Month</p>
        </CardContent>
      </Card>
      
      <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={handleClick}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Next G50 Due</CardTitle>
          </div>
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.daysToG50 <= 5 ? 'text-red-600' : 'text-primary'}`}>
            {stats.daysToG50} Days
          </div>
          <p className="text-xs text-muted-foreground mt-1">Deadline: 20th</p>
        </CardContent>
      </Card>
    </div>
  );
}