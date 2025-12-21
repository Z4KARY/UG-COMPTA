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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Ban, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useState, useEffect } from "react";
import { PRICING_PLANS } from "@/lib/pricing";

const PLAN_NAMES = PRICING_PLANS.en.reduce((acc, plan) => ({
  ...acc,
  [plan.id]: plan.name
}), {} as Record<string, string>);

export function AdminSubscriptions() {
  const subscriptions = useQuery(api.admin.listAllSubscriptions);
  const cancelSubscription = useMutation(api.admin.cancelSubscription);
  const deleteSubscription = useMutation(api.admin.deleteSubscription);
  const updateSubscription = useMutation(api.admin.updateSubscription);

  const [editingSub, setEditingSub] = useState<any>(null);
  const [editPlan, setEditPlan] = useState<string>("");
  const [editStatus, setEditStatus] = useState<string>("");
  const [editEndDate, setEditEndDate] = useState<string>("");
  const [editAmount, setEditAmount] = useState<string>("");
  const [editInterval, setEditInterval] = useState<"month" | "year" | "2_years" | "3_years" | "lifetime">("year");
  const [initialPlan, setInitialPlan] = useState<string>("");

  const handleCancel = async (id: Id<"subscriptions">) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) return;
    try {
      await cancelSubscription({ id });
      toast.success("Subscription canceled");
    } catch (e) {
      toast.error("Failed to cancel subscription");
    }
  };

  const handleDelete = async (id: Id<"subscriptions">) => {
    if (!confirm("Are you sure you want to PERMANENTLY DELETE this subscription? This cannot be undone.")) return;
    try {
      await deleteSubscription({ id });
      toast.success("Subscription deleted");
    } catch (e) {
      toast.error("Failed to delete subscription");
    }
  };

  const openEditDialog = (sub: any) => {
    setEditingSub(sub);
    setEditPlan(sub.planId);
    setInitialPlan(sub.planId);
    setEditStatus(sub.status);
    setEditAmount(sub.amount?.toString() || "0");
    setEditInterval(sub.interval || "year");
    // Format date for input type="date" (YYYY-MM-DD)
    if (sub.endDate) {
        const date = new Date(sub.endDate);
        setEditEndDate(date.toISOString().split('T')[0]);
    } else {
        setEditEndDate("");
    }
  };

  // Auto-update amount when plan changes (only if plan is different from initial)
  useEffect(() => {
    if (editPlan && editPlan !== initialPlan) {
      const plan = PRICING_PLANS.en.find(p => p.id === editPlan);
      if (plan) {
        if (plan.price === "Custom") {
           // Keep existing
        } else if (plan.price) {
           const priceNum = parseInt(plan.price.replace(/[^0-9]/g, ''));
           if (!isNaN(priceNum)) {
             setEditAmount(priceNum.toString());
           }
        }
      }
    }
  }, [editPlan, initialPlan]);

  // Clear and disable end date when lifetime is selected
  useEffect(() => {
    if (editInterval === "lifetime") {
      setEditEndDate("");
    }
  }, [editInterval]);

  const handleUpdate = async () => {
    if (!editingSub) return;
    try {
      await updateSubscription({
        id: editingSub._id,
        planId: editPlan as any,
        status: editStatus as any,
        endDate: editInterval === "lifetime" ? undefined : (editEndDate ? new Date(editEndDate).getTime() : undefined),
        amount: parseFloat(editAmount) || 0,
        interval: editInterval,
      });
      toast.success("Subscription updated");
      setEditingSub(null);
    } catch (e) {
      toast.error("Failed to update subscription");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscriptions</CardTitle>
        <CardDescription>Manage all business subscriptions</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Interval</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions?.map((sub) => (
              <TableRow key={sub._id} className="cursor-pointer hover:bg-muted/50" onClick={(e) => {
                if ((e.target as HTMLElement).closest("button")) return;
                openEditDialog(sub);
              }}>
                <TableCell className="font-medium">{sub.businessName}</TableCell>
                <TableCell className="capitalize">{PLAN_NAMES[sub.planId] || sub.planId}</TableCell>
                <TableCell>{sub.amount.toLocaleString()} {sub.currency}</TableCell>
                <TableCell className="capitalize">{sub.interval}</TableCell>
                <TableCell>
                  <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                    {sub.status}
                  </Badge>
                </TableCell>
                <TableCell>{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "-"}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditDialog(sub)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {sub.status === "active" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCancel(sub._id)}
                      >
                        <Ban className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(sub._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {subscriptions?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No subscriptions found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        <Dialog open={!!editingSub} onOpenChange={(open) => !open && setEditingSub(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Subscription</DialogTitle>
              <DialogDescription>
                Modify subscription details for {editingSub?.businessName}
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="plan">Plan</Label>
                <Select value={editPlan} onValueChange={setEditPlan}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label htmlFor="amount">Amount (DZD)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  value={editAmount} 
                  onChange={(e) => setEditAmount(e.target.value)} 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="interval">Interval</Label>
                <Select value={editInterval} onValueChange={(v: any) => setEditInterval(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year">Yearly</SelectItem>
                    <SelectItem value="2_years">2 Years</SelectItem>
                    <SelectItem value="3_years">3 Years</SelectItem>
                    <SelectItem value="lifetime">Lifetime</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="past_due">Past Due</SelectItem>
                    <SelectItem value="canceled">Canceled</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input 
                  id="endDate" 
                  type="date" 
                  value={editEndDate} 
                  onChange={(e) => setEditEndDate(e.target.value)} 
                  disabled={editInterval === "lifetime"}
                />
                {editInterval === "lifetime" && (
                  <p className="text-[10px] text-muted-foreground">Lifetime subscriptions do not have an end date.</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingSub(null)}>Cancel</Button>
              <Button onClick={handleUpdate}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}