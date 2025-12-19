import DashboardLayout from "@/components/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/use-auth";
import { AdminOverview } from "@/components/admin/AdminOverview";
import { AdminBusinesses } from "@/components/admin/AdminBusinesses";
import { AdminUsers } from "@/components/admin/AdminUsers";
import { AdminContactRequests } from "@/components/admin/AdminContactRequests";
import { AdminFiscal } from "@/components/admin/AdminFiscal";
import { AdminSubscriptions } from "@/components/admin/AdminSubscriptions";
import { AdminAuditLogs } from "@/components/admin/AdminAuditLogs";
import { AdminAnnouncements } from "@/components/admin/AdminAnnouncements";
import { AdminSettings } from "@/components/admin/AdminSettings";

export default function Admin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const user = useQuery(api.users.currentUser);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
        navigate("/admin/auth");
        return;
    }

    if (user && user.role !== "admin") {
        toast.error(t("admin.toast.accessDenied") || "Access Denied: Admins only");
        navigate("/dashboard");
    }
  }, [user, navigate, t, authLoading, isAuthenticated]);

  if (!user || user.role !== "admin") {
      return (
          <DashboardLayout>
              <div className="flex items-center justify-center h-full">
                  <p>{t("admin.loading") || "Loading..."}</p>
              </div>
          </DashboardLayout>
      );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.title") || "Admin Panel"}</h1>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="mb-4 flex-wrap h-auto gap-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="businesses">{t("admin.tab.businesses") || "Businesses"}</TabsTrigger>
          <TabsTrigger value="users">{t("admin.tab.users") || "Users"}</TabsTrigger>
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="requests">Contact Requests</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
          <TabsTrigger value="fiscal">{t("admin.tab.fiscal") || "Fiscal Config"}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <AdminOverview />
        </TabsContent>

        <TabsContent value="businesses">
          <AdminBusinesses />
        </TabsContent>

        <TabsContent value="users">
          <AdminUsers />
        </TabsContent>

        <TabsContent value="subscriptions">
          <AdminSubscriptions />
        </TabsContent>

        <TabsContent value="requests">
          <AdminContactRequests />
        </TabsContent>

        <TabsContent value="announcements">
          <AdminAnnouncements />
        </TabsContent>

        <TabsContent value="settings">
          <AdminSettings />
        </TabsContent>

        <TabsContent value="audit">
          <AdminAuditLogs />
        </TabsContent>

        <TabsContent value="fiscal">
          <AdminFiscal />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}