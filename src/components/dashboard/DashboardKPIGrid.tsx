import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DollarSign, TrendingDown, Wallet, Activity, CreditCard, 
  AlertCircle, AlertTriangle, FileText, Percent, Calculator, Scale
} from "lucide-react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

interface DashboardStats {
  turnover: number;
  expenses: number;
  netProfit: number;
  netMargin: number;
  tva: number;
  tvaDeductible: number;
  tvaPayable: number;
  stampDuty: number;
  outstandingAmount: number;
  overdueCount: number;
  invoiceCount: number;
  averageInvoiceValue: number;
  period: string;
}

interface DashboardKPIGridProps {
  stats: DashboardStats | undefined | null;
  receivablesRatio: number;
  currency: string;
}

export default function DashboardKPIGrid({ stats, receivablesRatio, currency }: DashboardKPIGridProps) {
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <motion.div variants={item}>
        <Link to="/invoices">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Turnover</CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.turnover.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{currency}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">For {stats?.period}</p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <Link to="/purchases">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Expenses</CardTitle>
              <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.expenses?.toLocaleString() || 0} <span className="text-sm font-normal text-muted-foreground">{currency}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">For {stats?.period}</p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <Link to="/invoices">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-emerald-500 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Net Profit</CardTitle>
              <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Wallet className="h-4 w-4 text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.netProfit?.toLocaleString() || 0} <span className="text-sm font-normal text-muted-foreground">{currency}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Margin: {stats?.netMargin.toFixed(1)}%</p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <Link to="/declarations">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">TVA Payable</CardTitle>
              <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Activity className="h-4 w-4 text-blue-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.tvaPayable.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{currency}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Collected: {stats?.tva.toLocaleString()} | Ded: {stats?.tvaDeductible.toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <Link to="/invoices">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-indigo-500 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Invoice Value</CardTitle>
              <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <Calculator className="h-4 w-4 text-indigo-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(stats?.averageInvoiceValue || 0).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{currency}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Based on {stats?.invoiceCount} invoices
              </p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <Link to="/declarations">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Stamp Duty</CardTitle>
              <div className="h-8 w-8 rounded-full bg-orange-500/10 flex items-center justify-center">
                <CreditCard className="h-4 w-4 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.stampDuty.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{currency}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Cash payments only</p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <Link to="/invoices">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-500 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
              <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                <AlertCircle className="h-4 w-4 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats?.outstandingAmount?.toLocaleString() || 0} <span className="text-sm font-normal text-muted-foreground">{currency}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Unpaid invoices</p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <Link to="/invoices">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-rose-500 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overdue Invoices</CardTitle>
              <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-rose-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.overdueCount || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">Action required</p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <Link to="/invoices">
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Invoices Issued</CardTitle>
              <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.invoiceCount || 0}</div>
              <p className="text-xs text-muted-foreground mt-1">This month</p>
            </CardContent>
          </Card>
        </Link>
      </motion.div>

      <motion.div variants={item}>
        <Card className="hover:shadow-md transition-shadow border-l-4 border-l-purple-500 h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receivables Impact</CardTitle>
            <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Percent className="h-4 w-4 text-purple-500" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{receivablesRatio}%</div>
            <Progress value={receivablesRatio} className="h-2 mt-2 [&>div]:bg-purple-500" />
            <p className="text-xs text-muted-foreground mt-2">of Profit is in Credit (Créances)</p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}