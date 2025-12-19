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
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/contexts/LanguageContext";

export function AdminUsers() {
  const { t } = useLanguage();
  const users = useQuery(api.admin.listUsers);
  const currentUser = useQuery(api.users.currentUser);
  const toggleUser = useMutation(api.admin.toggleUserSuspension);
  const updateUserRole = useMutation(api.admin.updateUserRole);

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

  return (
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
