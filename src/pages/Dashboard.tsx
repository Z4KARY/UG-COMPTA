import DashboardLayout from "@/components/DashboardLayout";
import { DashboardRecap } from "@/components/dashboard/DashboardRecap";
import { DashboardBalanceCards } from "@/components/dashboard/DashboardBalanceCards";
import { DashboardKPIGrid } from "@/components/dashboard/DashboardKPIGrid";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Dashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

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

        <DashboardRecap />
        <DashboardBalanceCards />
        <DashboardKPIGrid />
        <DashboardCharts />
      </div>
    </DashboardLayout>
  );
}