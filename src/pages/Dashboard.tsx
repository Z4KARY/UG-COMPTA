import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import {
  ArrowUpRight,
  CreditCard,
  DollarSign,
  Users,
  Activity,
} from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const business = useQuery(api.businesses.getMyBusiness);
  const invoices = useQuery(
    api.invoices.list,
    business ? { businessId: business._id } : "skip"
  );
  const customers = useQuery(
    api.customers.list,
    business ? { businessId: business._id } : "skip"
  );

  const totalRevenue =
    invoices
      ?.filter((i) => i.status === "paid")
      .reduce((acc, curr) => acc + curr.totalTtc, 0) || 0;

  const pendingAmount =
    invoices
      ?.filter((i) => i.status === "sent" || i.status === "overdue")
      .reduce((acc, curr) => acc + curr.totalTtc, 0) || 0;

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

      {!business ? (
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
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Revenue
                </CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {totalRevenue.toLocaleString()} {business.currency}
                </div>
                <p className="text-xs text-muted-foreground">
                  +20.1% from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Invoices
                </CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {pendingAmount.toLocaleString()} {business.currency}
                </div>
                <p className="text-xs text-muted-foreground">
                  {invoices?.filter((i) => i.status === "sent").length} invoices
                  sent
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {customers?.length || 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active customers
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Now
                </CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">+573</div>
                <p className="text-xs text-muted-foreground">
                  +201 since last hour
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Invoices</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {invoices?.slice(0, 5).map((invoice) => (
                    <div key={invoice._id} className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {invoice.customerName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {invoice.invoiceNumber}
                        </p>
                      </div>
                      <div className="ml-auto font-medium">
                        {invoice.totalTtc.toLocaleString()} {business.currency}
                      </div>
                    </div>
                  ))}
                  {(!invoices || invoices.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      No invoices found.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Customers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {customers?.slice(0, 5).map((customer) => (
                    <div key={customer._id} className="flex items-center">
                      <div className="ml-4 space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {customer.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {customer.email}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!customers || customers.length === 0) && (
                    <p className="text-sm text-muted-foreground">
                      No customers found.
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
