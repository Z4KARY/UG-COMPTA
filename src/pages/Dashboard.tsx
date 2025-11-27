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
} from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

export default function Dashboard() {
  const business = useQuery(api.businesses.getMyBusiness, {});
  
  const stats = useQuery(api.reports.getDashboardStats, 
    business ? { businessId: business._id } : "skip"
  );
  
  const revenueTrend = useQuery(api.reports.getRevenueTrend,
    business ? { businessId: business._id } : "skip"
  );

  const topPerformers = useQuery(api.reports.getTopPerformers,
    business ? { businessId: business._id } : "skip"
  );

  if (!business) {
    return (
      <DashboardLayout>
        <Card>
          <CardHeader>
            <CardTitle>Welcome to InvoiceFlow</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              Please set up your business profile to get started.
            </p>
            <Button asChild>
              <Link to="/settings">Setup Business</Link>
            </Button>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/invoices/new">Create Invoice</Link>
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Turnover
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.turnover.toLocaleString()} {business.currency}
            </div>
            <p className="text-xs text-muted-foreground">
              For {stats?.period}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              TVA Collected
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.tva.toLocaleString()} {business.currency}
            </div>
            <p className="text-xs text-muted-foreground">
              To be declared
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Stamp Duty</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.stampDuty.toLocaleString()} {business.currency}
            </div>
            <p className="text-xs text-muted-foreground">
              Cash payments only
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Invoices
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.invoiceCount || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Issued this month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Revenue Chart */}
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
            <CardDescription>Monthly revenue for the last 6 months</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueTrend || []}>
                        <XAxis 
                            dataKey="month" 
                            stroke="#888888" 
                            fontSize={12} 
                            tickLine={false} 
                            axisLine={false} 
                        />
                        <YAxis
                            stroke="#888888"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip 
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Bar dataKey="revenue" fill="currentColor" radius={[4, 4, 0, 0]} className="fill-primary" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Top Performers</CardTitle>
            <CardDescription>Top customers and products by revenue</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
                <div>
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Users className="h-4 w-4" /> Top Customers
                    </h4>
                    <div className="space-y-3">
                        {topPerformers?.customers.map((c, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <span className="truncate max-w-[150px]">{c.name}</span>
                                <span className="font-medium">{c.amount.toLocaleString()} {business.currency}</span>
                            </div>
                        ))}
                        {(!topPerformers?.customers.length) && <p className="text-xs text-muted-foreground">No data available</p>}
                    </div>
                </div>
                
                <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                        <Package className="h-4 w-4" /> Top Products
                    </h4>
                    <div className="space-y-3">
                        {topPerformers?.products.map((p, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <span className="truncate max-w-[150px]">{p.name}</span>
                                <span className="font-medium">{p.amount.toLocaleString()} {business.currency}</span>
                            </div>
                        ))}
                        {(!topPerformers?.products.length) && <p className="text-xs text-muted-foreground">No data available</p>}
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}