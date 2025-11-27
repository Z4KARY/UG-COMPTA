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

export default function Admin() {
  const navigate = useNavigate();
  // We need to check if user is admin. 
  // Since we don't have a direct hook for role in context, we rely on the query failing or returning null if not authorized,
  // but ideally we check the user object.
  const user = useQuery(api.users.currentUser);
  
  const businesses = useQuery(api.admin.listBusinesses);
  const users = useQuery(api.admin.listUsers);
  const globalParams = useQuery(api.admin.getGlobalFiscalParameters);
  
  const toggleBusiness = useMutation(api.admin.toggleBusinessSuspension);
  const toggleUser = useMutation(api.admin.toggleUserSuspension);

  useEffect(() => {
    if (user && user.role !== "admin") {
        toast.error("Access Denied");
        navigate("/dashboard");
    }
  }, [user, navigate]);

  if (!user || user.role !== "admin") {
      return (
          <DashboardLayout>
              <div className="flex items-center justify-center h-full">
                  <p>Loading or Access Denied...</p>
              </div>
          </DashboardLayout>
      );
  }

  const handleToggleBusiness = async (id: Id<"businesses">, currentStatus: boolean | undefined) => {
      try {
          await toggleBusiness({ id, suspend: !currentStatus });
          toast.success(`Business ${!currentStatus ? "suspended" : "activated"}`);
      } catch (e) {
          toast.error("Failed to update business status");
      }
  };

  const handleToggleUser = async (id: Id<"users">, currentStatus: boolean | undefined) => {
      try {
          await toggleUser({ id, suspend: !currentStatus });
          toast.success(`User ${!currentStatus ? "suspended" : "activated"}`);
      } catch (e) {
          toast.error("Failed to update user status");
      }
  };

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Admin Panel</h1>
      </div>

      <Tabs defaultValue="businesses">
        <TabsList>
          <TabsTrigger value="businesses">Businesses</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="fiscal">Global Fiscal Config</TabsTrigger>
        </TabsList>

        <TabsContent value="businesses">
          <Card>
            <CardHeader>
              <CardTitle>All Businesses</CardTitle>
              <CardDescription>Manage registered businesses and their status.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>NIF</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                            <Badge variant="destructive">Suspended</Badge>
                        ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                            variant={b.isSuspended ? "outline" : "destructive"}
                            size="sm"
                            onClick={() => handleToggleBusiness(b._id, b.isSuspended)}
                        >
                            {b.isSuspended ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                            {b.isSuspended ? "Unlock" : "Lock"}
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
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage registered users.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
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
                            <Badge variant="destructive">Suspended</Badge>
                        ) : (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
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
                                {u.isSuspended ? "Unlock" : "Lock"}
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
                    <CardTitle>Global Fiscal Parameters</CardTitle>
                    <CardDescription>
                        Current global configuration. Updates affect all businesses without overrides.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Effective From</TableHead>
                                <TableHead>Value (Preview)</TableHead>
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
                                        No global parameters set. System defaults apply.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-md text-sm">
                        <p>To update global parameters (e.g., for a new Finance Law), use the system scripts or a dedicated configuration tool. This view is currently read-only.</p>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
}
