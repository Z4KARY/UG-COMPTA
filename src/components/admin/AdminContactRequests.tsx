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
import { Mail, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export function AdminContactRequests() {
  const contactRequests = useQuery(api.admin.system.listContactRequests);
  const updateContactStatus = useMutation(api.admin.system.updateContactRequestStatus);

  const handleUpdateContactStatus = async (id: Id<"contactRequests">, newStatus: "new" | "contacted" | "closed") => {
    try {
      await updateContactStatus({ id, status: newStatus });
      toast.success("Contact request updated");
    } catch (e) {
      toast.error("Error updating contact request");
    }
  };

  return (
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
  );
}
