import DashboardLayout from "@/components/DashboardLayout";
import { DashboardRecap } from "@/components/dashboard/DashboardRecap";
import { DashboardBalanceCards } from "@/components/dashboard/DashboardBalanceCards";
import { DashboardKPIGrid } from "@/components/dashboard/DashboardKPIGrid";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
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
        <DashboardKPIGrid businessId={business._id} />
        <DashboardCharts businessId={business._id} />
      </div>
    </DashboardLayout>
  );
}