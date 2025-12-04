import DashboardLayout from "@/components/DashboardLayout";
import { DashboardRecap } from "@/components/dashboard/DashboardRecap";
import { DashboardBalanceCards } from "@/components/dashboard/DashboardBalanceCards";
import { DashboardKPIGrid } from "@/components/dashboard/DashboardKPIGrid";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardTaxStats } from "@/components/dashboard/DashboardTaxStats";
import { DashboardTopPerformers } from "@/components/dashboard/DashboardTopPerformers";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const business = useQuery(api.businesses.getMyBusiness, {});

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("dashboard.welcome")}, {user?.name?.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground mt-1">
            {t("dashboard.subtitle")}
          </p>
        </div>

        <DashboardRecap businessId={business._id} />
        <DashboardBalanceCards businessId={business._id} />
        <DashboardTaxStats businessId={business._id} />
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
    </DashboardLayout>
  );
}