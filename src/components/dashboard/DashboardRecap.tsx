import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, Wallet, AlertCircle, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguage } from "@/contexts/LanguageContext";

interface DashboardRecapProps {
  stats: any;
  currency: string;
}

export default function DashboardRecap({ stats, currency }: DashboardRecapProps) {
  const { t } = useLanguage();
  if (!stats) return null;

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
      <motion.div variants={item}>
        <Card className="bg-primary text-primary-foreground shadow-lg shadow-primary/20 border-none">
          <CardContent className="p-6 flex flex-col gap-2 items-center text-center">
            <span className="text-xs opacity-80 font-medium uppercase tracking-wider flex items-center justify-center gap-2">
              <DollarSign className="h-3 w-3" /> {t("recap.globalRevenue")}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-3xl font-bold tracking-tight cursor-help">
                    {stats.totalTurnover?.toLocaleString() || stats.turnover.toLocaleString()} <span className="text-lg font-normal opacity-70">{currency}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("recap.tooltip.revenue")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs opacity-70">{t("recap.totalRevenueAllTime")}</p>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={item}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-2">
              <Wallet className="h-3 w-3" /> {t("recap.netProfit")}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`text-3xl font-bold tracking-tight ${stats.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'} cursor-help`}>
                    {stats.netProfit.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">{currency}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("recap.tooltip.profit")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs text-muted-foreground">{t("recap.earningsAfterExpenses")}</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-2">
              <ArrowDownRight className="h-3 w-3" /> {t("recap.expenses")}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-3xl font-bold tracking-tight text-red-500 cursor-help">
                    {stats.expenses.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">{currency}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("recap.tooltip.expenses")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs text-muted-foreground">{t("recap.totalCostsThisMonth")}</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="h-3 w-3" /> {t("recap.outstanding")}
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-3xl font-bold tracking-tight text-yellow-500 cursor-help">
                    {stats.outstandingAmount.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">{currency}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{t("recap.tooltip.outstanding")}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs text-muted-foreground">{t("recap.unpaidInvoices")}</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}