import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
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
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Plus, Trash2, ArrowLeft, Pencil, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { SetupRequired } from "@/components/SetupRequired";
import { SupplierDialog } from "@/components/SupplierDialog";

export default function Suppliers() {
  const { t } = useLanguage();
  const business = useQuery(api.businesses.getMyBusiness, {});
  const suppliers = useQuery(api.suppliers.list, business ? { businessId: business._id } : "skip");
  const deleteSupplier = useMutation(api.suppliers.remove);

  const [isOpen, setIsOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const handleEdit = (supplier: any) => {
    setSelectedSupplier(supplier);
    setIsOpen(true);
  };

  const handleCreate = () => {
    setSelectedSupplier(null);
    setIsOpen(true);
  };

  const handleDelete = async (id: any) => {
      if (confirm(t("suppliers.deleteConfirm"))) {
          try {
              await deleteSupplier({ id });
              toast.success(t("suppliers.toast.deleted"));
          } catch (error) {
              toast.error(t("suppliers.toast.deleteError"));
          }
      }
  };

  if (business === undefined) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (business === null || !business.type) {
    return <SetupRequired />;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link to="/purchases">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">{t("suppliers.title")}</h1>
                    <p className="text-muted-foreground mt-1">
                    {t("suppliers.subtitle")}
                    </p>
                </div>
            </div>

            <div className="w-full md:w-auto">
                <Button onClick={handleCreate} className="w-full md:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("suppliers.add")}
                </Button>
            </div>
        </div>

        <SupplierDialog 
            open={isOpen} 
            onOpenChange={setIsOpen} 
            businessId={business._id} 
            supplier={selectedSupplier}
            currency={business.currency}
        />

        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-4">{t("customers.name")}</TableHead>
                            <TableHead className="hidden md:table-cell">{t("customers.contact")}</TableHead>
                            <TableHead className="text-right whitespace-nowrap">{t("suppliers.totalPurchases")}</TableHead>
                            <TableHead className="text-right whitespace-nowrap">{t("suppliers.paid")}</TableHead>
                            <TableHead className="text-right whitespace-nowrap">{t("suppliers.balanceDue")}</TableHead>
                            <TableHead className="w-[80px] text-right pr-4">{t("invoices.actions")}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suppliers?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    {t("suppliers.empty")}
                                </TableCell>
                            </TableRow>
                        )}
                        {suppliers?.map((supplier) => (
                            <TableRow key={supplier._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(supplier)}>
                                <TableCell className="font-medium pl-4">
                                    <div className="text-sm">{supplier.name}</div>
                                    <div className="text-xs text-muted-foreground md:hidden">
                                        {supplier.phone}
                                    </div>
                                    <div className="text-xs text-muted-foreground hidden md:block">
                                        {[supplier.nif && `${t("common.nif")}: ${supplier.nif}`, supplier.rc && `${t("common.rc")}: ${supplier.rc}`].filter(Boolean).join(" | ")}
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <div className="flex flex-col text-xs">
                                        <span>{supplier.phone}</span>
                                        <span className="text-muted-foreground">{supplier.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right font-medium whitespace-nowrap">
                                    {supplier.financials?.totalPurchases.toLocaleString()} <span className="text-xs text-muted-foreground">{business?.currency}</span>
                                </TableCell>
                                <TableCell className="text-right text-emerald-600 whitespace-nowrap">
                                    {supplier.financials?.totalPaid.toLocaleString()} <span className="text-xs text-muted-foreground">{business?.currency}</span>
                                </TableCell>
                                <TableCell className="text-right whitespace-nowrap">
                                    <span className={`text-sm ${supplier.financials?.balanceDue > 0 ? "text-red-600 font-bold" : "text-muted-foreground"}`}>
                                        {supplier.financials?.balanceDue.toLocaleString()} <span className="text-xs font-normal hidden sm:inline">{business?.currency}</span>
                                    </span>
                                </TableCell>
                                <TableCell className="pr-4">
                                    <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(supplier)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(supplier._id)}>
                                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}