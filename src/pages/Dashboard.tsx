import DashboardLayout from "@/components/DashboardLayout";
import { DashboardRecap } from "@/components/dashboard/DashboardRecap";
import { DashboardBalanceCards } from "@/components/dashboard/DashboardBalanceCards";
import { DashboardKPIGrid } from "@/components/dashboard/DashboardKPIGrid";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardTaxStats } from "@/components/dashboard/DashboardTaxStats";
import { DashboardTopPerformers } from "@/components/dashboard/DashboardTopPerformers";
import { DashboardSales } from "@/components/dashboard/DashboardSales";
import { DashboardExpenses } from "@/components/dashboard/DashboardExpenses";
import { DashboardTreasury } from "@/components/dashboard/DashboardTreasury";
import { DashboardNotifications } from "@/components/dashboard/DashboardNotifications";
import { DashboardProfitability } from "@/components/dashboard/DashboardProfitability";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect } from "react";
import { useNavigate } from "react-router";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const business = useQuery(api.businesses.getMyBusiness, {});
  const navigate = useNavigate();

  useEffect(() => {
    if (business === null) {
      navigate("/onboarding");
    }
  }, [business, navigate]);

  if (business === undefined) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (business === null) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] flex-col items-center justify-center gap-4">
          <h2 className="text-xl font-semibold">No Business Found</h2>
          <p className="text-muted-foreground">Please create a business to view the dashboard.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {t("dashboard.welcome")}, {user?.name?.split(" ")[0]}!
                </h1>
                <p className="text-muted-foreground mt-1">
                    {t("dashboard.subtitle")}
                </p>
            </div>
            <div className="w-full md:w-auto">
                {/* Placeholder for global actions or date picker */}
            </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="treasury">Treasury</TabsTrigger>
            <TabsTrigger value="tax">Tax</TabsTrigger>
            <TabsTrigger value="profitability">Profitability</TabsTrigger>
            <TabsTrigger value="plans">Plans</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-3 space-y-4">
                    <DashboardRecap businessId={business._id} />
                    <DashboardBalanceCards businessId={business._id} />
                    <DashboardKPIGrid businessId={business._id} />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <DashboardCharts businessId={business._id} />
                        </div>
                        <div className="lg:col-span-1">
                            <DashboardTopPerformers businessId={business._id} />
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-1 space-y-4">
                    <DashboardNotifications businessId={business._id} />
                    {/* Future: Add Activity Feed here */}
                </div>
            </div>
          </TabsContent>

          <TabsContent value="sales" className="space-y-4">
            <DashboardSales businessId={business._id} />
          </TabsContent>

          <TabsContent value="expenses" className="space-y-4">
            <DashboardExpenses businessId={business._id} />
          </TabsContent>

          <TabsContent value="treasury" className="space-y-4">
            <DashboardTreasury businessId={business._id} />
          </TabsContent>

          <TabsContent value="tax" className="space-y-4">
            <DashboardTaxStats businessId={business._id} />
          </TabsContent>

          <TabsContent value="profitability" className="space-y-4">
            <DashboardProfitability businessId={business._id} />
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            <LandingPricing fromDashboard={true} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}