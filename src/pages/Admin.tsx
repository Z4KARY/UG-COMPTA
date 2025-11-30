import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ShieldAlert, ShieldCheck, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Admin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  // We need to check if user is admin. 
  // Since we don't have a direct hook for role in context, we rely on the query failing or returning null if not authorized,
  // but ideally we check the user object.
  const user = useQuery(api.users.currentUser);
  const isAdmin = user?.role === "admin";
  
  const businesses = useQuery(api.admin.listBusinesses, isAdmin ? {} : "skip");
  const users = useQuery(api.admin.listUsers, isAdmin ? {} : "skip");
  const globalParams = useQuery(api.admin.getGlobalFiscalParameters, isAdmin ? {} : "skip");
  
  const toggleBusiness = useMutation(api.admin.toggleBusinessSuspension);
  const toggleUser = useMutation(api.admin.toggleUserSuspension);

  useEffect(() => {
    if (user && user.role !== "admin") {
        toast.error(t("admin.toast.accessDenied"));
        navigate("/dashboard");
    }
  }, [user, navigate, t]);

  if (!user || user.role !== "admin") {
      return (
          <DashboardLayout>
              <div className="flex items-center justify-center h-full">
                  <p>{t("admin.loading")}</p>
              </div>
          </DashboardLayout>
      );
  }

  const handleToggleBusiness = async (id: Id<"businesses">, currentStatus: boolean | undefined) => {
      try {
          await toggleBusiness({ id, suspend: !currentStatus });
          toast.success(!currentStatus ? t("admin.toast.businessSuspended") : t("admin.toast.businessActivated"));
      } catch (e) {
          toast.error(t("admin.toast.businessError"));
      }
  };

  const handleToggleUser = async (id: Id<"users">, currentStatus: boolean | undefined) => {
      try {
          await toggleUser({ id, suspend: !currentStatus });
          toast.success(!currentStatus ? t("admin.toast.userSuspended") : t("admin.toast.userActivated"));
      } catch (e) {
          toast.error(t("admin.toast.userError"));
      }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.title")}</h1>
      </div>

      <Tabs defaultValue="businesses">
        <TabsList>
          <TabsTrigger value="businesses">{t("admin.tab.businesses")}</TabsTrigger>
          <TabsTrigger value="users">{t("admin.tab.users")}</TabsTrigger>
          <TabsTrigger value="fiscal">{t("admin.tab.fiscal")}</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.businesses.title")}</CardTitle>
              <CardDescription>{t("admin.businesses.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.table.name")}</TableHead>
                    <TableHead>{t("admin.table.owner")}</TableHead>
                    <TableHead>{t("admin.table.nif")}</TableHead>
                    <TableHead>{t("admin.table.status")}</TableHead>
                    <TableHead className="text-right">{t("admin.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {businesses?.map((b) => (
                    <TableRow key={b._id}>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                            <span>{b.ownerName}</span>
                            <span className="text-xs text-muted-foreground">{b.ownerEmail}</span>
                        </div>
                      </TableCell>
                      <TableCell>{b.nif || "-"}</TableCell>
                      <TableCell>
                        {b.isSuspended ? (
                            <Badge variant="destructive">{t("admin.status.suspended")}</Badge>
                        ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t("admin.status.active")}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                            variant={b.isSuspended ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => handleToggleBusiness(b._id, b.isSuspended)}
                        >
                            {b.isSuspended ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                            {b.isSuspended ? t("admin.action.unlock") : t("admin.action.lock")}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.users.title")}</CardTitle>
              <CardDescription>{t("admin.users.description")}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.table.name")}</TableHead>
                    <TableHead>{t("admin.table.email")}</TableHead>
                    <TableHead>{t("admin.table.role")}</TableHead>
                    <TableHead>{t("admin.table.status")}</TableHead>
                    <TableHead className="text-right">{t("admin.table.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users?.map((u) => (
                    <TableRow key={u._id}>
                      <TableCell className="font-medium">{u.name || "Anonymous"}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{u.role || "user"}</Badge>
                      </TableCell>
                      <TableCell>
                        {u.isSuspended ? (
                            <Badge variant="destructive">{t("admin.status.suspended")}</Badge>
                        ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t("admin.status.active")}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {u.role !== "admin" && (
                            <Button 
                                variant={u.isSuspended ? "outline" : "destructive"}
                                size="sm"
                                onClick={() => handleToggleUser(u._id, u.isSuspended)}
                            >
                                {u.isSuspended ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                                {u.isSuspended ? t("admin.action.unlock") : t("admin.action.lock")}
                            </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal">
            <Card>
                <CardHeader>
                    <CardTitle>{t("admin.fiscal.title")}</CardTitle>
                    <CardDescription>
                        {t("admin.fiscal.description")}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("admin.table.code")}</TableHead>
                                <TableHead>{t("admin.table.effectiveFrom")}</TableHead>
                                <TableHead>{t("admin.table.value")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {globalParams?.map((p) => (
                                <TableRow key={p._id}>
                                    <TableCell className="font-mono">{p.code}</TableCell>
                                    <TableCell>{new Date(p.effectiveFrom).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <pre className="text-xs bg-muted p-2 rounded overflow-auto max-w-[300px] max-h-[100px]">
                                            {JSON.stringify(p.value, null, 2)}
                                        </pre>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {globalParams?.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="text-center text-muted-foreground">
                                        {t("admin.fiscal.empty")}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-md text-sm">
                        <p>{t("admin.fiscal.note")}</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}