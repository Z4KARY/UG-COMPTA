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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Lock, Unlock, Trash2, UserPlus, Eye } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { PRICING_PLANS } from "@/lib/pricing";
import { AdminTableFilters } from "./AdminTableFilters";

const PLAN_NAMES = PRICING_PLANS.en.reduce((acc, plan) => ({
  ...acc,
  [plan.id]: plan.name
}), {} as Record<string, string>);

export function AdminUsers() {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const users = useQuery(api.admin.listUsers, {
    search: search || undefined,
    role: roleFilter === "all" ? undefined : roleFilter,
  });
  const currentUser = useQuery(api.users.currentUser);
  const toggleUser = useMutation(api.admin.toggleUserSuspension);
  const updateUserRole = useMutation(api.admin.updateUserRole);
  const deleteUsers = useMutation(api.admin.deleteUsers);
  const createAccount = useMutation(api.admin.createAccount);

  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Details State
  const [viewUserId, setViewUserId] = useState<Id<"users"> | null>(null);
  const userDetails = useQuery(api.admin.getUserDetails, viewUserId ? { id: viewUserId } : "skip");
  
  // Create Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "owner" | "accountant" | "staff">("staff");
  const [createBusiness, setCreateBusiness] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [plan, setPlan] = useState<string>("");
  const [durationMonths, setDurationMonths] = useState<string>("");

  const handleToggleUser = async (id: Id<"users">, currentStatus: boolean | undefined) => {
    try {
      await toggleUser({ id, suspend: !currentStatus });
      toast.success(!currentStatus ? "User suspended" : "User activated");
    } catch (e) {
      toast.error("Error updating user status");
    }
  };

  const handleRoleChange = async (id: Id<"users">, newRole: "admin" | "owner" | "accountant" | "staff") => {
    try {
      await updateUserRole({ id, role: newRole });
      toast.success("User role updated");
    } catch (e) {
      toast.error("Error updating user role");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && users) {
      setSelectedUsers(users.map(u => u._id));
    } else {
      setSelectedUsers([]);
    }
  };

  const handleSelectUser = (id: Id<"users">, checked: boolean) => {
    if (checked) {
      setSelectedUsers(prev => [...prev, id]);
    } else {
      setSelectedUsers(prev => prev.filter(uid => uid !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`)) return;
    
    try {
      await deleteUsers({ ids: selectedUsers });
      toast.success("Users deleted successfully");
      setSelectedUsers([]);
    } catch (e) {
      toast.error("Error deleting users");
    }
  };

  const handleCreateAccount = async () => {
    try {
      if (createBusiness) {
        if (!plan) {
          toast.error("Please select a subscription plan");
          return;
        }
        if (!durationMonths) {
          toast.error("Please select a duration");
          return;
        }
      }

      await createAccount({
        name: newName,
        email: newEmail,
        role: newRole,
        createBusiness,
        businessName: createBusiness ? businessName : undefined,
        plan: createBusiness ? (plan as any) : undefined,
        durationMonths: createBusiness ? parseInt(durationMonths) : undefined,
      });
      toast.success("Account created successfully");
      setIsCreateOpen(false);
      // Reset form
      setNewName("");
      setNewEmail("");
      setNewRole("staff");
      setCreateBusiness(false);
      setBusinessName("");
      setPlan("");
      setDurationMonths("");
    } catch (e: any) {
      toast.error(e.message || "Error creating account");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("admin.users.title") || "Users"}</CardTitle>
          <CardDescription>{t("admin.users.description") || "Manage registered users"}</CardDescription>
        </div>
        <div className="flex gap-2">
          {selectedUsers.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedUsers.length})
            </Button>
          )}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Create User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Account</DialogTitle>
                <DialogDescription>
                  Create a new user account manually. They can login using the email provided.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="John Doe" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="john@example.com" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newRole} onValueChange={(v: any) => setNewRole(v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="createBusiness" checked={createBusiness} onCheckedChange={(c) => setCreateBusiness(!!c)} />
                  <Label htmlFor="createBusiness">Create Business for User</Label>
                </div>
                {createBusiness && (
                  <div className="grid gap-4 pl-6 border-l-2 border-muted">
                    <div className="grid gap-2">
                      <Label htmlFor="businessName">Business Name</Label>
                      <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Company LLC" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="plan">Subscription Plan *</Label>
                        <Select value={plan} onValueChange={setPlan}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Plan" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Auto-Entrepreneur</SelectItem>
                            <SelectItem value="startup">Startup</SelectItem>
                            <SelectItem value="pro">Small Business</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="duration">Duration *</Label>
                        <Select value={durationMonths} onValueChange={setDurationMonths}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select Duration" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1 Month</SelectItem>
                            <SelectItem value="3">3 Months</SelectItem>
                            <SelectItem value="6">6 Months</SelectItem>
                            <SelectItem value="12">1 Year</SelectItem>
                            <SelectItem value="24">2 Years</SelectItem>
                            <SelectItem value="36">3 Years</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateAccount}>Create Account</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <AdminTableFilters 
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search name or email..."
          filters={[
            {
              key: "role",
              label: "Role",
              value: roleFilter,
              onChange: setRoleFilter,
              options: [
                { label: "Admin", value: "admin" },
                { label: "Owner", value: "owner" },
                { label: "Accountant", value: "accountant" },
                { label: "Staff", value: "staff" },
              ]
            }
          ]}
          onReset={() => {
            setSearch("");
            setRoleFilter("all");
          }}
        />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={users && users.length > 0 && selectedUsers.length === users.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>{t("admin.table.name") || "Name"}</TableHead>
              <TableHead>{t("admin.table.email") || "Email"}</TableHead>
              <TableHead>{t("admin.table.role") || "Role"}</TableHead>
              <TableHead>{t("admin.table.status") || "Status"}</TableHead>
              <TableHead className="text-right">{t("admin.table.actions") || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users?.map((u) => (
              <TableRow key={u._id} className="cursor-pointer hover:bg-muted/50" onClick={(e) => {
                if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("[role='checkbox']") || (e.target as HTMLElement).closest("[role='combobox']")) return;
                setViewUserId(u._id);
              }}>
                <TableCell>
                  <Checkbox 
                    checked={selectedUsers.includes(u._id)}
                    onCheckedChange={(c) => handleSelectUser(u._id, !!c)}
                  />
                </TableCell>
                <TableCell className="font-medium">{u.name || "Anonymous"}</TableCell>
                <TableCell>{u.email}</TableCell>
                <TableCell>
                  <Select
                    defaultValue={
                        // Map legacy values to new ones for display
                        u.roleGlobal === "ADMIN" ? "admin" :
                        u.roleGlobal === "ACCOUNTANT" ? "accountant" :
                        u.roleGlobal === "NORMAL" ? "staff" :
                        (u.roleGlobal as any) || ((u as any).role === "admin" ? "admin" : "staff")
                    }
                    onValueChange={(value: "admin" | "owner" | "accountant" | "staff") => handleRoleChange(u._id, value)}
                    disabled={u._id === currentUser?._id}
                  >
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="accountant">Accountant</SelectItem>
                      <SelectItem value="staff">Staff</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  {u.isSuspended ? (
                    <Badge variant="destructive">{t("admin.status.suspended") || "Suspended"}</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t("admin.status.active") || "Active"}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setViewUserId(u._id)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    {(u as any).role !== "admin" && (
                        <Button
                        variant={u.isSuspended ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => handleToggleUser(u._id, u.isSuspended)}
                        >
                        {u.isSuspended ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* User Details Dialog */}
        <Dialog open={!!viewUserId} onOpenChange={(open) => !open && setViewUserId(null)}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>User Details</DialogTitle>
                    <DialogDescription>Information for {userDetails?.name || userDetails?.email}</DialogDescription>
                </DialogHeader>
                
                {userDetails ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Full Name</Label>
                                <p className="font-medium">{userDetails.name || "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Email</Label>
                                <p className="font-medium">{userDetails.email}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Role</Label>
                                <Badge variant="secondary">{userDetails.roleGlobal || (userDetails as any).role}</Badge>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Status</Label>
                                <div>
                                    {userDetails.isSuspended ? (
                                        <Badge variant="destructive">Suspended</Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-lg font-semibold mb-4">Businesses Owned</h3>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {userDetails.businesses?.map((b) => (
                                        <TableRow key={b._id}>
                                            <TableCell className="font-medium">{b.name}</TableCell>
                                            <TableCell className="capitalize">{PLAN_NAMES[b.plan || ""] || b.plan || "-"}</TableCell>
                                            <TableCell>
                                                {b.isSuspended ? (
                                                    <Badge variant="destructive">Suspended</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {(!userDetails.businesses || userDetails.businesses.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center text-muted-foreground">No businesses found</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    <div className="py-8 text-center">Loading details...</div>
                )}
            </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}