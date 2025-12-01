import DashboardLayout from "@/components/DashboardLayout";
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
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Plus, ShoppingCart, Trash2, Users, Loader2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { format } from "date-fns";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { SetupRequired } from "@/components/SetupRequired";

export default function Purchases() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const business = useQuery(api.businesses.getMyBusiness, {});
  const purchases = useQuery(api.purchaseInvoices.list, business ? { businessId: business._id } : "skip");
  const deletePurchase = useMutation(api.purchaseInvoices.remove);

  const handleDelete = async (id: any) => {
      if (confirm(t("purchases.deleteConfirm"))) {
          try {
              await deletePurchase({ id });
              toast.success(t("purchases.deleteSuccess"));
          } catch (error) {
              toast.error(t("purchases.deleteError"));
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("purchases.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("purchases.subtitle")}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
                <Link to="/suppliers">
                    <Users className="mr-2 h-4 w-4" />
                    {t("purchases.manageSuppliers")}
                </Link>
            </Button>
            <Button asChild>
                <Link to="/purchases/new">
                    <Plus className="mr-2 h-4 w-4" />
                    {t("purchases.new")}
                </Link>
            </Button>
          </div>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>{t("purchases.listTitle")}</CardTitle>
                <CardDescription>{t("purchases.listDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{t("purchases.table.date")}</TableHead>
                            <TableHead>{t("purchases.table.invoiceNumber")}</TableHead>
                            <TableHead>{t("purchases.table.supplier")}</TableHead>
                            <TableHead>{t("purchases.table.status")}</TableHead>
                            <TableHead className="text-right">{t("purchases.table.totalHt")}</TableHead>
                            <TableHead className="text-right">{t("purchases.table.vat")}</TableHead>
                            <TableHead className="text-right">{t("purchases.table.totalTtc")}</TableHead>
                            <TableHead className="text-right">{t("purchases.table.deductible")}</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {purchases?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                    {t("purchases.empty")}
                                </TableCell>
                            </TableRow>
                        )}
                        {purchases?.map((purchase) => (
                            <TableRow key={purchase._id} className="cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/purchases/${purchase._id}`)}>
                                <TableCell>{format(purchase.invoiceDate, "dd/MM/yyyy")}</TableCell>
                                <TableCell className="font-medium text-blue-600">
                                    <Link to={`/purchases/${purchase._id}`} className="hover:underline">
                                        {purchase.invoiceNumber}
                                    </Link>
                                </TableCell>
                                <TableCell>{purchase.supplierName}</TableCell>
                                <TableCell>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${
                                        (purchase.status === "paid" || purchase.paymentDate)
                                            ? "bg-emerald-100 text-emerald-700" 
                                            : "bg-yellow-100 text-yellow-700"
                                    }`}>
                                        {purchase.status || (purchase.paymentDate ? "paid" : "unpaid")}
                                    </span>
                                </TableCell>
                                <TableCell className="text-right">{purchase.subtotalHt.toFixed(2)}</TableCell>
                                <TableCell className="text-right">{purchase.vatTotal.toFixed(2)}</TableCell>
                                <TableCell className="text-right">{purchase.totalTtc.toFixed(2)}</TableCell>
                                <TableCell className="text-right font-bold text-green-600">{purchase.vatDeductible.toFixed(2)}</TableCell>
                                <TableCell onClick={(e) => e.stopPropagation()}>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(purchase._id)}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}