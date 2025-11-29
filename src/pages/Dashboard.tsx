import DashboardLayout from "@/components/DashboardLayout";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { ArrowRight, Plus } from "lucide-react";
import { Link } from "react-router";
import React from "react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import DashboardBalanceCards from "@/components/dashboard/DashboardBalanceCards";
import DashboardKPIGrid from "@/components/dashboard/DashboardKPIGrid";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

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

  // Calculate Receivables to Profit Ratio
  const receivablesRatio = React.useMemo(() => {
    if (!stats?.netProfit || !balanceStats?.distribution.credit) return 0;
    if (stats.netProfit <= 0) return 0; 
    return Math.round((balanceStats.distribution.credit / stats.netProfit) * 100);
  }, [stats, balanceStats]);

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
        <DashboardBalanceCards balanceStats={balanceStats} currency={business.currency} />

        {/* Key Metrics */}
        <DashboardKPIGrid stats={stats} receivablesRatio={receivablesRatio} currency={business.currency} />

        {/* Charts */}
        <DashboardCharts 
          revenueTrend={revenueTrend} 
          balanceStats={balanceStats} 
          topPerformers={topPerformers} 
          currency={business.currency} 
        />
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