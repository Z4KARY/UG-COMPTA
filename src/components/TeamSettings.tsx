import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Loader2, MoreVertical, Plus, Shield, Trash2, UserPlus, Users } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface TeamSettingsProps {
  businessId: Id<"businesses">;
}

export function TeamSettings({ businessId }: TeamSettingsProps) {
  const { t } = useLanguage();
  const members = useQuery(api.members.list, { businessId });
  const addMember = useMutation(api.members.add);
  const updateMember = useMutation(api.members.update);
  const removeMember = useMutation(api.members.remove);

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"staff" | "accountant">("staff");
  const [isAdding, setIsAdding] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<Id<"businessMembers"> | null>(null);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberEmail) return;

    setIsAdding(true);
    try {
      await addMember({
        businessId,
        email: newMemberEmail,
        role: newMemberRole,
      });
      toast.success(t("settings.team.toast.addSuccess"));
      setNewMemberEmail("");
      setNewMemberRole("staff");
    } catch (error: any) {
      toast.error(error.message || t("settings.team.toast.addError"));
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateRole = async (memberId: Id<"businessMembers">, role: "owner" | "accountant" | "staff") => {
    try {
      await updateMember({ memberId, role });
      toast.success(t("settings.team.toast.roleSuccess"));
    } catch (error: any) {
      toast.error(error.message || t("settings.team.toast.roleError"));
    }
  };

  const confirmRemoveMember = async () => {
    if (!memberToRemove) return;
    try {
      await removeMember({ memberId: memberToRemove });
      toast.success(t("settings.team.toast.removeSuccess"));
      setMemberToRemove(null);
    } catch (error: any) {
      toast.error(error.message || t("settings.team.toast.removeError"));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <UserPlus className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <CardTitle>{t("settings.team.addTitle")}</CardTitle>
              <CardDescription>
                {t("settings.team.addDescription")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMember} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="grid w-full gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                {t("settings.team.email")}
              </label>
              <Input
                id="email"
                type="email"
                placeholder="colleague@example.com"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                required
              />
            </div>
            <div className="grid w-full md:w-[200px] gap-2">
              <label htmlFor="role" className="text-sm font-medium">
                {t("settings.team.role")}
              </label>
              <Select
                value={newMemberRole}
                onValueChange={(v: "staff" | "accountant") => setNewMemberRole(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="accountant">Accountant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isAdding}>
              {isAdding ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              {t("settings.team.addBtn")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg">
              <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <CardTitle>{t("settings.team.listTitle")}</CardTitle>
              <CardDescription>
                {t("settings.team.listDescription")}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members?.map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar>
                    <AvatarImage src={member.user?.image} />
                    <AvatarFallback>
                      {member.user?.name?.[0] || member.user?.email?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{member.user?.name || "Unknown User"}</p>
                    <p className="text-sm text-muted-foreground">{member.user?.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Badge
                    variant={
                      member.role === "owner"
                        ? "default"
                        : member.role === "accountant"
                        ? "secondary"
                        : "outline"
                    }
                    className="capitalize"
                  >
                    {member.role}
                  </Badge>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleUpdateRole(member._id, "owner")}>
                        <Shield className="mr-2 h-4 w-4" />
                        {t("settings.team.makeOwner")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateRole(member._id, "accountant")}>
                        <Users className="mr-2 h-4 w-4" />
                        {t("settings.team.makeAccountant")}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateRole(member._id, "staff")}>
                        <Users className="mr-2 h-4 w-4" />
                        {t("settings.team.makeStaff")}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setMemberToRemove(member._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        {t("settings.team.remove")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {members?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                {t("settings.team.empty")}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("settings.team.confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.team.confirmDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("settings.team.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("settings.team.confirmRemove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}