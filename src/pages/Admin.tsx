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
import { ShieldAlert, ShieldCheck, Lock, Unlock, CheckCircle, XCircle, Mail } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useNavigate } from "react-router";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/use-auth";

export default function Admin() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  // We need to check if user is admin. 
  // Since we don't have a direct hook for role in context, we rely on the query failing or returning null if not authorized,
  // but ideally we check the user object.
  const user = useQuery(api.users.currentUser);
  const isAdmin = user?.role === "admin";
  
  const businesses = useQuery(api.admin.listBusinesses, isAdmin ? {} : "skip");
  const users = useQuery(api.admin.listUsers, isAdmin ? {} : "skip");
  const contactRequests = useQuery(api.admin.listContactRequests, isAdmin ? {} : "skip");
  const globalParams = useQuery(api.admin.getGlobalFiscalParameters, isAdmin ? {} : "skip");
  
  const toggleBusiness = useMutation(api.admin.toggleBusinessSuspension);
  const toggleUser = useMutation(api.admin.toggleUserSuspension);
  const updateContactStatus = useMutation(api.admin.updateContactRequestStatus);

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

  const handleToggleBusiness = async (id: Id<"businesses">, currentStatus: boolean | undefined) => {
      try {
          await toggleBusiness({ id, suspend: !currentStatus });
          toast.success(!currentStatus ? (t("admin.toast.businessSuspended") || "Business suspended") : (t("admin.toast.businessActivated") || "Business activated"));
      } catch (e) {
          toast.error(t("admin.toast.businessError") || "Error updating business status");
      }
  };

  const handleToggleUser = async (id: Id<"users">, currentStatus: boolean | undefined) => {
      try {
          await toggleUser({ id, suspend: !currentStatus });
          toast.success(!currentStatus ? (t("admin.toast.userSuspended") || "User suspended") : (t("admin.toast.userActivated") || "User activated"));
      } catch (e) {
          toast.error(t("admin.toast.userError") || "Error updating user status");
      }
  };

  const handleUpdateContactStatus = async (id: Id<"contactRequests">, newStatus: "new" | "contacted" | "closed") => {
    try {
      await updateContactStatus({ id, status: newStatus });
      toast.success("Contact request updated");
    } catch (e) {
      toast.error("Error updating contact request");
    }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">{t("admin.title") || "Admin Panel"}</h1>
      </div>

      <Tabs defaultValue="businesses">
        <TabsList>
          <TabsTrigger value="businesses">{t("admin.tab.businesses") || "Businesses"}</TabsTrigger>
          <TabsTrigger value="users">{t("admin.tab.users") || "Users"}</TabsTrigger>
          <TabsTrigger value="requests">Contact Requests</TabsTrigger>
          <TabsTrigger value="fiscal">{t("admin.tab.fiscal") || "Fiscal Config"}</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses">
          <Card>
            <CardHeader>
              <CardTitle>{t("admin.businesses.title") || "Businesses"}</CardTitle>
              <CardDescription>{t("admin.businesses.description") || "Manage registered businesses"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.table.name") || "Name"}</TableHead>
                    <TableHead>{t("admin.table.owner") || "Owner"}</TableHead>
                    <TableHead>{t("admin.table.nif") || "NIF"}</TableHead>
                    <TableHead>{t("admin.table.status") || "Status"}</TableHead>
                    <TableHead className="text-right">{t("admin.table.actions") || "Actions"}</TableHead>
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
                            <Badge variant="destructive">{t("admin.status.suspended") || "Suspended"}</Badge>
                        ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t("admin.status.active") || "Active"}</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                            variant={b.isSuspended ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => handleToggleBusiness(b._id, b.isSuspended)}
                        >
                            {b.isSuspended ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                            {b.isSuspended ? (t("admin.action.unlock") || "Unlock") : (t("admin.action.lock") || "Lock")}
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
              <CardTitle>{t("admin.users.title") || "Users"}</CardTitle>
              <CardDescription>{t("admin.users.description") || "Manage registered users"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.table.name") || "Name"}</TableHead>
                    <TableHead>{t("admin.table.email") || "Email"}</TableHead>
                    <TableHead>{t("admin.table.role") || "Role"}</TableHead>
                    <TableHead>{t("admin.table.status") || "Status"}</TableHead>
                    <TableHead className="text-right">{t("admin.table.actions") || "Actions"}</TableHead>
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
                            <Badge variant="destructive">{t("admin.status.suspended") || "Suspended"}</Badge>
                        ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t("admin.status.active") || "Active"}</Badge>
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
                                {u.isSuspended ? (t("admin.action.unlock") || "Unlock") : (t("admin.action.lock") || "Lock")}
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

        <TabsContent value="requests">
          <Card>
            <CardHeader>
              <CardTitle>Contact Requests</CardTitle>
              <CardDescription>Manage sales inquiries and contact requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contactRequests?.map((req) => (
                    <TableRow key={req._id}>
                      <TableCell className="whitespace-nowrap">
                        {new Date(req.submittedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{req.name}</TableCell>
                      <TableCell>{req.email}</TableCell>
                      <TableCell>{req.companyName || "-"}</TableCell>
                      <TableCell className="max-w-[300px] truncate" title={req.message}>
                        {req.message || "-"}
                      </TableCell>
                      <TableCell>
                        {req.status === "new" && <Badge variant="default">New</Badge>}
                        {req.status === "contacted" && <Badge variant="secondary" className="bg-blue-100 text-blue-800">Contacted</Badge>}
                        {req.status === "closed" && <Badge variant="outline">Closed</Badge>}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {req.status === "new" && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateContactStatus(req._id, "contacted")}
                              title="Mark as Contacted"
                            >
                              <Mail className="h-4 w-4 mr-2" />
                              Contact
                            </Button>
                          )}
                          {req.status !== "closed" && (
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => handleUpdateContactStatus(req._id, "closed")}
                              title="Close Request"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {contactRequests?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                        No contact requests found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fiscal">
            <Card>
                <CardHeader>
                    <CardTitle>{t("admin.fiscal.title") || "Fiscal Configuration"}</CardTitle>
                    <CardDescription>
                        {t("admin.fiscal.description") || "Global fiscal parameters and tax rates"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t("admin.table.code") || "Code"}</TableHead>
                                <TableHead>{t("admin.table.effectiveFrom") || "Effective From"}</TableHead>
                                <TableHead>{t("admin.table.value") || "Value"}</TableHead>
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
                                        {t("admin.fiscal.empty") || "No global parameters defined"}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-md text-sm">
                        <p>{t("admin.fiscal.note") || "Note: These parameters apply to all businesses unless overridden."}</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}