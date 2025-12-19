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
import { Lock, Unlock, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

export function AdminUsers() {
  const { t } = useLanguage();
  const users = useQuery(api.admin.listUsers);
  const currentUser = useQuery(api.users.currentUser);
  const toggleUser = useMutation(api.admin.toggleUserSuspension);
  const updateUserRole = useMutation(api.admin.updateUserRole);
  const deleteUsers = useMutation(api.admin.deleteUsers);
  const createAccount = useMutation(api.admin.createAccount);

  const [selectedUsers, setSelectedUsers] = useState<Id<"users">[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Create Form State
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"NORMAL" | "ACCOUNTANT" | "ADMIN">("NORMAL");
  const [createBusiness, setCreateBusiness] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [plan, setPlan] = useState<"free" | "startup" | "pro" | "premium" | "enterprise">("enterprise");
  const [durationMonths, setDurationMonths] = useState(12);

  const handleToggleUser = async (id: Id<"users">, currentStatus: boolean | undefined) => {
    try {
      await toggleUser({ id, suspend: !currentStatus });
      toast.success(!currentStatus ? "User suspended" : "User activated");
    } catch (e) {
      toast.error("Error updating user status");
    }
  };

  const handleRoleChange = async (id: Id<"users">, newRole: "NORMAL" | "ACCOUNTANT" | "ADMIN") => {
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
      await createAccount({
        name: newName,
        email: newEmail,
        role: newRole,
        createBusiness,
        businessName: createBusiness ? businessName : undefined,
        plan: createBusiness ? plan : undefined,
        durationMonths: createBusiness ? durationMonths : undefined,
      });
      toast.success("Account created successfully");
      setIsCreateOpen(false);
      // Reset form
      setNewName("");
      setNewEmail("");
      setNewRole("NORMAL");
      setCreateBusiness(false);
      setBusinessName("");
      setPlan("enterprise");
      setDurationMonths(12);
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
                      <SelectItem value="NORMAL">Normal User</SelectItem>
                      <SelectItem value="ACCOUNTANT">Accountant</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
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
                        <Label htmlFor="plan">Subscription Plan</Label>
                        <Select value={plan} onValueChange={(v: any) => setPlan(v)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="startup">Startup</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="premium">Premium</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="duration">Duration (Months)</Label>
                        <Select value={durationMonths.toString()} onValueChange={(v) => setDurationMonths(parseInt(v))}>
                          <SelectTrigger>
                            <SelectValue />
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
              <TableRow key={u._id}>
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
                    defaultValue={u.roleGlobal || (u.role === "admin" ? "ADMIN" : "NORMAL")}
                    onValueChange={(value: "NORMAL" | "ACCOUNTANT" | "ADMIN") => handleRoleChange(u._id, value)}
                    disabled={u._id === currentUser?._id}
                  >
                    <SelectTrigger className="w-[130px] h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NORMAL">NORMAL</SelectItem>
                      <SelectItem value="ACCOUNTANT">ACCOUNTANT</SelectItem>
                      <SelectItem value="ADMIN">ADMIN</SelectItem>
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
                  {u.role !== "admin" && (
                    <Button
                      variant={u.isSuspended ? "outline" : "destructive"}
                      size="sm"
                      onClick={() => handleToggleUser(u._id, u.isSuspended)}
                    >
                      {u.isSuspended ? <Unlock className="h-4 w-4 mr-2" /> : <Lock className="h-4 w-4 mr-2" />}
                      <span>{u.isSuspended ? (t("admin.action.unlock") || "Unlock") : (t("admin.action.lock") || "Lock")}</span>
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}