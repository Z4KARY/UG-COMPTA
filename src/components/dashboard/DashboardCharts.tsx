import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp, Users } from "lucide-react";
import { motion } from "framer-motion";
import { ComposedChart, Line, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Legend, PieChart, Pie, Cell, Legend as PieLegend } from "recharts";

interface RevenueTrendData {
  month: string;
  revenue: number;
  revenueCash: number;
  revenueCredit: number;
  expenses: number;
  balance: number;
}

interface TopPerformer {
  name: string;
  amount: number;
}

interface DashboardChartsProps {
  revenueTrend: RevenueTrendData[] | undefined;
  balanceStats: any;
  topPerformers: { customers: TopPerformer[]; products: TopPerformer[] } | undefined;
  currency: string;
}

export default function DashboardCharts({ revenueTrend, balanceStats, topPerformers, currency }: DashboardChartsProps) {
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const COLORS = ['#10b981', '#3b82f6']; // Emerald (Cash), Blue (Credit)
  const ALLOCATION_COLORS = ['#ef4444', '#10b981']; // Red (Expenses), Emerald (Profit)

  // Calculate Revenue Allocation (Expenses vs Profit)
  const expenses = balanceStats?.monthly?.expenses || 0;
  const profit = Math.max(0, balanceStats?.monthly?.balance || 0);
  const allocationData = [
    { name: 'Expenses', value: expenses },
    { name: 'Net Profit', value: profit }
  ];

  const hasTrendData = revenueTrend && revenueTrend.length > 0 && revenueTrend.some(d => d.revenue > 0 || d.expenses > 0);

  return (
    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-7">
      {/* Revenue Chart */}
      <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-4">
        <Card className="h-full hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Cash Flow & Balance Trend
            </CardTitle>
            <CardDescription>Revenue (Cash vs Credit), Expenses & Net Balance</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] sm:h-[350px] w-full min-h-[300px]">
                {hasTrendData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={revenueTrend || []} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
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
                            <Legend />
                            <Bar 
                              dataKey="revenueCash" 
                              name="Revenue (Cash)"
                              stackId="a"
                              fill="#10b981" 
                              radius={[0, 0, 0, 0]} 
                              maxBarSize={50}
                            />
                            <Bar 
                              dataKey="revenueCredit" 
                              name="Revenue (Credit)"
                              stackId="a"
                              fill="#3b82f6" 
                              radius={[4, 4, 0, 0]} 
                              maxBarSize={50}
                            />
                            <Bar 
                              dataKey="expenses" 
                              name="Expenses"
                              fill="#ef4444" 
                              radius={[4, 4, 0, 0]} 
                              maxBarSize={50}
                            />
                            <Line
                              type="monotone"
                              dataKey="balance"
                              name="Net Balance"
                              stroke="#8b5cf6"
                              strokeWidth={2}
                              dot={{ r: 4, fill: "#8b5cf6" }}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                        No trend data available yet.
                    </div>
                )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cash vs Credit & Top Performers */}
      <motion.div variants={item} className="col-span-1 md:col-span-2 lg:col-span-3 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Cash vs Credit Card */}
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium">Payment Distribution</CardTitle>
                    <CardDescription className="text-xs">Paid vs Credit (Revenue)</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="h-[120px] w-full flex items-center justify-center">
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
                                        innerRadius={35}
                                        outerRadius={50}
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
                                            backgroundColor: 'var(--background)',
                                            fontSize: '12px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-xs">Loading...</div>
                        )}
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                        <div>
                            <p className="text-muted-foreground">Paid</p>
                            <p className="font-bold text-emerald-500">{balanceStats?.distribution.cash.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-muted-foreground">Credit</p>
                            <p className="font-bold text-blue-500">{balanceStats?.distribution.credit.toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Profit Distribution Card */}
            <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-sm font-medium">Revenue Allocation</CardTitle>
                    <CardDescription className="text-xs">Expenses vs Profit</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0">
                    <div className="h-[120px] w-full flex items-center justify-center">
                        {balanceStats ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={allocationData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={35}
                                        outerRadius={50}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {ALLOCATION_COLORS.map((color, index) => (
                                            <Cell key={`cell-${index}`} fill={color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        contentStyle={{ 
                                            borderRadius: '8px', 
                                            border: '1px solid var(--border)', 
                                            backgroundColor: 'var(--background)',
                                            fontSize: '12px'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground text-xs">Loading...</div>
                        )}
                    </div>
                    <div className="flex justify-between mt-2 text-xs">
                        <div>
                            <p className="text-muted-foreground">Expenses</p>
                            <p className="font-bold text-red-500">{expenses.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-muted-foreground">Profit</p>
                            <p className="font-bold text-emerald-500">{profit.toLocaleString()}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>

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
                                <span className="font-bold text-sm">{c.amount.toLocaleString()} <span className="text-xs font-normal text-muted-foreground">{currency}</span></span>
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
  );
}