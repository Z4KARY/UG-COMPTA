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
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Lock, Unlock, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

export function AdminBusinesses() {
  const { t } = useLanguage();
  const businesses = useQuery(api.admin.listBusinesses);
  const toggleBusiness = useMutation(api.admin.toggleBusinessSuspension);
  const deleteBusinesses = useMutation(api.admin.deleteBusinesses);

  const [selectedBusinesses, setSelectedBusinesses] = useState<Id<"businesses">[]>([]);

  const handleToggleBusiness = async (id: Id<"businesses">, currentStatus: boolean | undefined) => {
    try {
      await toggleBusiness({ id, suspend: !currentStatus });
      toast.success(!currentStatus ? "Business suspended" : "Business activated");
    } catch (e) {
      toast.error("Error updating business status");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && businesses) {
      setSelectedBusinesses(businesses.map(b => b._id));
    } else {
      setSelectedBusinesses([]);
    }
  };

  const handleSelectBusiness = (id: Id<"businesses">, checked: boolean) => {
    if (checked) {
      setSelectedBusinesses(prev => [...prev, id]);
    } else {
      setSelectedBusinesses(prev => prev.filter(bid => bid !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedBusinesses.length} businesses? This action cannot be undone.`)) return;
    
    try {
      await deleteBusinesses({ ids: selectedBusinesses });
      toast.success("Businesses deleted successfully");
      setSelectedBusinesses([]);
    } catch (e) {
      toast.error("Error deleting businesses");
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("admin.businesses.title") || "Businesses"}</CardTitle>
          <CardDescription>{t("admin.businesses.description") || "Manage registered businesses"}</CardDescription>
        </div>
        {selectedBusinesses.length > 0 && (
          <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete ({selectedBusinesses.length})
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={businesses && businesses.length > 0 && selectedBusinesses.length === businesses.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
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
                <TableCell>
                  <Checkbox 
                    checked={selectedBusinesses.includes(b._id)}
                    onCheckedChange={(c) => handleSelectBusiness(b._id, !!c)}
                  />
                </TableCell>
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
