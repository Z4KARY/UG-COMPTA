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
import { Badge } from "@/components/ui/badge";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export function AdminSubscriptions() {
  const subscriptions = useQuery(api.admin.listAllSubscriptions);
  const cancelSubscription = useMutation(api.admin.cancelSubscription);

  const handleCancel = async (id: Id<"subscriptions">) => {
    if (!confirm("Are you sure you want to cancel this subscription?")) return;
    try {
      await cancelSubscription({ id });
      toast.success("Subscription canceled");
    } catch (e) {
      toast.error("Failed to cancel subscription");
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
              <TableHead>Start Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {subscriptions?.map((sub) => (
              <TableRow key={sub._id}>
                <TableCell className="font-medium">{sub.businessName}</TableCell>
                <TableCell className="capitalize">{sub.planId}</TableCell>
                <TableCell>{sub.amount.toLocaleString()} {sub.currency}</TableCell>
                <TableCell className="capitalize">{sub.interval}</TableCell>
                <TableCell>
                  <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                    {sub.status}
                  </Badge>
                </TableCell>
                <TableCell>{new Date(sub.startDate).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  {sub.status === "active" && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(sub._id)}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  )}
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
      </CardContent>
    </Card>
  );
}
