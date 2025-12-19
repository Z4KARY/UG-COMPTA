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
import { Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/contexts/LanguageContext";

export function AdminBusinesses() {
  const { t } = useLanguage();
  const businesses = useQuery(api.admin.listBusinesses);
  const toggleBusiness = useMutation(api.admin.toggleBusinessSuspension);

  const handleToggleBusiness = async (id: Id<"businesses">, currentStatus: boolean | undefined) => {
    try {
      await toggleBusiness({ id, suspend: !currentStatus });
      toast.success(!currentStatus ? "Business suspended" : "Business activated");
    } catch (e) {
      toast.error("Error updating business status");
    }
  };

  return (
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
                    <span>{b.isSuspended ? (t("admin.action.unlock") || "Unlock") : (t("admin.action.lock") || "Lock")}</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
