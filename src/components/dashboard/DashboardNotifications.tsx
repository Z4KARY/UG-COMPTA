import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, AlertTriangle, Calendar, TrendingDown } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardNotifications({ businessId }: { businessId: Id<"businesses"> }) {
  const stats = useQuery(api.reports.getDashboardStats, { businessId });

  if (!stats) return <Skeleton className="h-[200px] w-full" />;

  const alerts = [];

  // 1. Tax Deadline Alert
  if (stats.daysToG50 <= 5) {
    alerts.push({
      title: "G50 Declaration Due Soon",
      message: `Your G50 declaration is due in ${stats.daysToG50} days.`,
      icon: Calendar,
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    });
  }

  // 2. Cash Runway Alert
  if (stats.cashRunway < 3) {
    alerts.push({
      title: "Low Cash Runway",
      message: `Cash runway is below 3 months (${stats.cashRunway.toFixed(1)} months).`,
      icon: TrendingDown,
      color: "text-red-500",
      bg: "bg-red-500/10"
    });
  }

  // 3. Overdue Invoices Alert
  if (stats.overdueCount > 0) {
    alerts.push({
      title: "Overdue Invoices",
      message: `You have ${stats.overdueCount} overdue invoices requiring action.`,
      icon: AlertTriangle,
      color: "text-red-500",
      bg: "bg-red-500/10"
    });
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No urgent alerts. You're all caught up!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-l-primary">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bell className="h-4 w-4" />
          Action Required ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert, i) => (
          <div key={i} className={`flex items-start gap-3 p-2 rounded-md ${alert.bg}`}>
            <alert.icon className={`h-5 w-5 mt-0.5 ${alert.color}`} />
            <div>
              <p className="text-sm font-medium">{alert.title}</p>
              <p className="text-xs text-muted-foreground">{alert.message}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
