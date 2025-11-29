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

interface TeamSettingsProps {
  businessId: Id<"businesses">;
}

export function TeamSettings({ businessId }: TeamSettingsProps) {
  const members = useQuery(api.members.list, { businessId });
  const addMember = useMutation(api.members.add);
  const updateMember = useMutation(api.members.update);
  const removeMember = useMutation(api.members.remove);

  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState<"staff" | "accountant">("staff");
  const [isAdding, setIsAdding] = useState(false);

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
      toast.success("Member added successfully");
      setNewMemberEmail("");
      setNewMemberRole("staff");
    } catch (error: any) {
      toast.error(error.message || "Failed to add member");
    } finally {
      setIsAdding(false);
    }
  };

  const handleUpdateRole = async (memberId: Id<"businessMembers">, role: "owner" | "accountant" | "staff") => {
    try {
      await updateMember({ memberId, role });
      toast.success("Role updated successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to update role");
    }
  };

  const handleRemoveMember = async (memberId: Id<"businessMembers">) => {
    if (!confirm("Are you sure you want to remove this member?")) return;
    try {
      await removeMember({ memberId });
      toast.success("Member removed successfully");
    } catch (error: any) {
      toast.error(error.message || "Failed to remove member");
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
              <CardTitle>Add Team Member</CardTitle>
              <CardDescription>
                Invite users to collaborate on this business.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddMember} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="grid w-full gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email Address
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
                Role
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
              Add Member
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
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                Manage access and permissions for your team.
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
                        Make Owner
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateRole(member._id, "accountant")}>
                        <Users className="mr-2 h-4 w-4" />
                        Make Accountant
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleUpdateRole(member._id, "staff")}>
                        <Users className="mr-2 h-4 w-4" />
                        Make Staff
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => handleRemoveMember(member._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remove Member
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
            {members?.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No members found.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
