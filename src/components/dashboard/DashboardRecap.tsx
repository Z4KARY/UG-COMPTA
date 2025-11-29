import { Card, CardContent } from "@/components/ui/card";
import { ArrowDownRight, Wallet, AlertCircle, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface DashboardRecapProps {
  stats: any;
  currency: string;
}

export default function DashboardRecap({ stats, currency }: DashboardRecapProps) {
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
              <DollarSign className="h-3 w-3" /> Global Revenue
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-3xl font-bold tracking-tight cursor-help">
                    {stats.totalTurnover?.toLocaleString() || stats.turnover.toLocaleString()} <span className="text-lg font-normal opacity-70">{currency}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total revenue including VAT and Stamp Duty (TTC)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs opacity-70">Total revenue all time</p>
          </CardContent>
        </Card>
      </motion.div>
      
      <motion.div variants={item}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-2">
              <Wallet className="h-3 w-3" /> Net Profit
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className={`text-3xl font-bold tracking-tight ${stats.netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'} cursor-help`}>
                    {stats.netProfit.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">{currency}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Revenue (HT) - Expenses (HT)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs text-muted-foreground">Earnings after expenses</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-2">
              <ArrowDownRight className="h-3 w-3" /> Expenses
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-3xl font-bold tracking-tight text-red-500 cursor-help">
                    {stats.expenses.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">{currency}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total expenses including VAT (TTC)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs text-muted-foreground">Total costs this month</p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div variants={item}>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex flex-col gap-2">
            <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider flex items-center gap-2">
              <AlertCircle className="h-3 w-3" /> Outstanding
            </span>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="text-3xl font-bold tracking-tight text-yellow-500 cursor-help">
                    {stats.outstandingAmount.toLocaleString()} <span className="text-lg font-normal text-muted-foreground">{currency}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Total unpaid invoices including VAT (TTC)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <p className="text-xs text-muted-foreground">Unpaid invoices</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}