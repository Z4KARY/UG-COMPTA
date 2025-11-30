import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, TrendingDown } from "lucide-react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

interface BalanceData {
  revenue: number;
  revenueCash: number;
  revenueCredit: number;
  expenses: number;
  balance: number;
}

interface DashboardBalanceCardsProps {
  balanceStats: {
    daily: BalanceData;
    weekly: BalanceData;
    monthly: BalanceData;
    distribution?: { cash: number; credit: number };
  } | undefined | null;
  currency: string;
}

export default function DashboardBalanceCards({ balanceStats, currency }: DashboardBalanceCardsProps) {
  const { t } = useLanguage();
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const renderCard = (titleKey: string, data: BalanceData | undefined) => {
    const isPositive = (data?.balance || 0) >= 0;
    const balanceColor = isPositive ? "text-emerald-500" : "text-red-500";

    return (
    <motion.div variants={item}>
      <Card className="bg-gradient-to-br from-background to-muted/50 h-full">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">{t(titleKey as any)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            <span className={balanceColor}>{data?.balance.toLocaleString()}</span> <span className="text-sm font-normal text-muted-foreground">{currency}</span>
          </div>
          <div className="flex flex-col gap-1 mt-2 text-xs text-muted-foreground">
            <div className="flex items-center justify-between">
                <span className="text-emerald-500 flex items-center"><ArrowUpRight className="h-3 w-3 mr-1"/> {t("balance.revenue")}</span>
                <span>+{data?.revenue.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pl-4 text-[10px] opacity-80">
                <span>{t("balance.cash")}</span>
                <span>{data?.revenueCash.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pl-4 text-[10px] opacity-80">
                <span>{t("balance.credit")}</span>
                <span>{data?.revenueCredit.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between mt-1">
                <span className="text-red-500 flex items-center"><TrendingDown className="h-3 w-3 mr-1"/> {t("recap.expenses")}</span>
                <span>-{data?.expenses.toLocaleString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
    );
  };

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
      {renderCard("balance.daily", balanceStats?.daily)}
      {renderCard("balance.weekly", balanceStats?.weekly)}
      {renderCard("balance.monthly", balanceStats?.monthly)}
    </div>
  );
}