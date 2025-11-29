import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Users,
  Activity,
  TrendingUp,
  Package,
  Plus,
  FileText,
  ArrowRight,
  TrendingDown,
  Wallet,
  AlertCircle,
  AlertTriangle
} from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { motion } from "framer-motion";
import { Separator } from "@/components/ui/separator";
import { PieChart, Pie, Cell, Legend } from "recharts";

export default function Dashboard() {
  const business = useQuery(api.businesses.getMyBusiness, {});
  
  const stats = useQuery(api.reports.getDashboardStats, 
    business ? { businessId: business._id } : "skip"
  );
  
  const balanceStats = useQuery(api.reports.getFinancialBalance,
    business ? { businessId: business._id } : "skip"
  );
  
  const revenueTrend = useQuery(api.reports.getRevenueTrend,
    business ? { businessId: business._id } : "skip"
  );

  const topPerformers = useQuery(api.reports.getTopPerformers,
    business ? { businessId: business._id } : "skip"
  );

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const COLORS = ['#10b981', '#3b82f6']; // Emerald (Cash), Blue (Credit)

  if (!business) {
    return (
      <DashboardLayout>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6"
        >
          <div className="bg-primary/10 p-6 rounded-full">
            <Building2Icon className="h-12 w-12 text-primary" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Welcome to InvoiceFlow</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              You're just one step away. Set up your business profile to start managing your invoices and finances.
            </p>
          </div>
          <Button asChild size="lg" className="rounded-full px-8">
            <Link to="/settings">Setup Business <ArrowRight className="ml-2 h-4 w-4" /></Link>
          </Button>
        </motion.div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Overview of your financial performance.</p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button asChild className="shadow-lg shadow-primary/20 w-full sm:w-auto">
              <Link to="/invoices/new">
                <Plus className="mr-2 h-4 w-4" /> Create Invoice
              </Link>
            </Button>
          </div>
        </div>

        {/* Balance Overview Section */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <motion.div variants={item}>
                <Card className="bg-gradient-to-br from-background to-muted/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Daily Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {balanceStats?.daily.balance.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{business.currency}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="text-emerald-500 flex items-center"><ArrowUpRight className="h-3 w-3 mr-1"/> +{balanceStats?.daily.revenue.toLocaleString()}</span>
                            <span className="text-red-500 flex items-center"><TrendingDown className="h-3 w-3 mr-1"/> -{balanceStats?.daily.expenses.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div variants={item}>
                <Card className="bg-gradient-to-br from-background to-muted/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {balanceStats?.weekly.balance.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{business.currency}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="text-emerald-500 flex items-center"><ArrowUpRight className="h-3 w-3 mr-1"/> +{balanceStats?.weekly.revenue.toLocaleString()}</span>
                            <span className="text-red-500 flex items-center"><TrendingDown className="h-3 w-3 mr-1"/> -{balanceStats?.weekly.expenses.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div variants={item}>
                <Card className="bg-gradient-to-br from-background to-muted/50">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Balance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {balanceStats?.monthly.balance.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{business.currency}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <span className="text-emerald-500 flex items-center"><ArrowUpRight className="h-3 w-3 mr-1"/> +{balanceStats?.monthly.revenue.toLocaleString()}</span>
                            <span className="text-red-500 flex items-center"><TrendingDown className="h-3 w-3 mr-1"/> -{balanceStats?.monthly.expenses.toLocaleString()}</span>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <motion.div variants={item}>
            <Link to="/invoices">
              <Card className="hover:shadow-md transition-shadow border-l-4 border-l-primary cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Monthly Turnover
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <DollarSign className="h-4 w-4 text-primary" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.turnover.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{business.currency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    For {stats?.period}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/purchases">
              <Card className="hover:shadow-md transition-shadow border-l-4 border-l-red-500 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Monthly Expenses
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.expenses?.toLocaleString() || 0} <span className="text-sm font-normal text-muted-foreground">{business.currency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    For {stats?.period}
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/invoices">
              <Card className="hover:shadow-md transition-shadow border-l-4 border-l-emerald-500 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Net Profit
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <Wallet className="h-4 w-4 text-emerald-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.netProfit?.toLocaleString() || 0} <span className="text-sm font-normal text-muted-foreground">{business.currency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Turnover - Expenses
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/declarations">
              <Card className="hover:shadow-md transition-shadow border-l-4 border-l-blue-500 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    TVA Collected
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-blue-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.tva.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{business.currency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    To be declared
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
                    {stats?.stampDuty.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">{business.currency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Cash payments only
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/invoices">
              <Card className="hover:shadow-md transition-shadow border-l-4 border-l-yellow-500 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Outstanding
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-yellow-500/10 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.outstandingAmount?.toLocaleString() || 0} <span className="text-sm font-normal text-muted-foreground">{business.currency}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Unpaid invoices
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/invoices">
              <Card className="hover:shadow-md transition-shadow border-l-4 border-l-rose-500 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Overdue Invoices
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-4 w-4 text-rose-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.overdueCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Action required
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/invoices">
              <Card className="hover:shadow-md transition-shadow border-l-4 border-l-green-500 cursor-pointer h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Invoices Issued
                  </CardTitle>
                  <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats?.invoiceCount || 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    This month
                  </p>
                </CardContent>
              </Card>
            </Link>
          </motion.div>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
          {/* Revenue Chart */}
          <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-4">
            <Card className="h-full hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Revenue Trend
                </CardTitle>
                <CardDescription>Monthly revenue for the last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px] sm:h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={revenueTrend || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis 
                                dataKey="month" 
                                stroke="#888888" 
                                fontSize={12} 
                                tickLine={false} 
                                axisLine={false}
                                dy={10}
                            />
                            <YAxis
                                stroke="#888888"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `${value}`}
                            />
                            <Tooltip 
                                cursor={{ fill: 'var(--muted)' }}
                                contentStyle={{ 
                                  borderRadius: '8px', 
                                  border: '1px solid var(--border)', 
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                  backgroundColor: 'var(--background)'
                                }}
                            />
                            <Bar 
                              dataKey="revenue" 
                              fill="var(--primary)" 
                              radius={[4, 4, 0, 0]} 
                              maxBarSize={50}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Cash vs Credit & Top Performers */}
          <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-3 space-y-4">
            {/* Cash vs Credit Card */}
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader>
                    <CardTitle className="text-base">Payment Distribution</CardTitle>
                    <CardDescription>Paid vs Credit (This Month)</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full flex items-center justify-center">
                        {balanceStats ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: 'Paid', value: balanceStats.distribution.cash },
                                            { name: 'Credit', value: balanceStats.distribution.credit }
                                        ]}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {COLORS.map((color, index) => (
                                            <Cell key={`cell-${index}`} fill={color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            borderRadius: '8px', 
                                            border: '1px solid var(--border)', 
                                            backgroundColor: 'var(--background)'
                                        }}
                                    />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Loading...</div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                        <div>
                            <p className="text-xs text-muted-foreground">Paid</p>
                            <p className="font-bold text-lg text-emerald-500">{balanceStats?.distribution.cash.toLocaleString()} <span className="text-xs text-muted-foreground">{business.currency}</span></p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Credit (Créances)</p>
                            <p className="font-bold text-lg text-blue-500">{balanceStats?.distribution.credit.toLocaleString()} <span className="text-xs text-muted-foreground">{business.currency}</span></p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-shadow flex flex-col">
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Highest revenue generators</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-8">
                    <div>
                        <h4 className="text-sm font-semibold mb-4 flex items-center gap-2 text-muted-foreground uppercase tracking-wider text-xs">
                            <Users className="h-3 w-3" /> Top Customers
                        </h4>
                        <div className="space-y-4">
                            {topPerformers?.customers.map((c, i) => (
                                <div key={i} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                                        {i + 1}
                                      </div>
                                      <span className="font-medium truncate max-w-[120px] group-hover:text-primary transition-colors">{c.name}</span>
                                    </div>
                                    <span className="font-bold text-sm">{c.amount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{business.currency}</span></span>
                                </div>
                            ))}
                            {(!topPerformers?.customers.length) && <div className="text-center py-4 text-muted-foreground text-sm">No customer data available</div>}
                        </div>
                    </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}

function Building2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  )
}