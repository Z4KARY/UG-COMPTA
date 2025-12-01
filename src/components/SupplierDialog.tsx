import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";

interface SupplierDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId: Id<"businesses">;
  supplier: any;
  currency: string;
}

export function SupplierDialog({ open, onOpenChange, businessId, supplier, currency }: SupplierDialogProps) {
  const { t } = useLanguage();
  const createSupplier = useMutation(api.suppliers.create);
  const updateSupplier = useMutation(api.suppliers.update);
  
  const [formData, setFormData] = useState({
      name: "",
      nif: "",
      rc: "",
      address: "",
      phone: "",
      email: "",
      notes: ""
  });

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name,
        nif: supplier.nif || "",
        rc: supplier.rc || "",
        address: supplier.address || "",
        phone: supplier.phone || "",
        email: supplier.email || "",
        notes: supplier.notes || ""
      });
    } else {
      setFormData({ name: "", nif: "", rc: "", address: "", phone: "", email: "", notes: "" });
    }
  }, [supplier, open]);

  const supplierInvoices = useQuery(api.purchaseInvoices.listBySupplier, 
    businessId && supplier?._id ? { businessId: businessId, supplierId: supplier._id } : "skip"
  );

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (supplier?._id) {
            await updateSupplier({
              id: supplier._id,
              ...formData
            });
            toast.success("Supplier updated");
          } else {
            await createSupplier({
                businessId: businessId,
                ...formData
            });
            toast.success("Supplier created");
          }
          onOpenChange(false);
      } catch (error) {
          toast.error(supplier?._id ? "Failed to update supplier" : "Failed to create supplier");
      }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
            <DialogHeader>
                <DialogTitle>{supplier ? t("suppliers.edit") : t("suppliers.add")}</DialogTitle>
                <DialogDescription>{t("suppliers.subtitle")}</DialogDescription>
            </DialogHeader>
            
            {supplier ? (
                <Tabs defaultValue="details" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="details">{t("suppliers.details")}</TabsTrigger>
                        <TabsTrigger value="invoices">{t("suppliers.invoices")} ({supplierInvoices?.length || 0})</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details">
                        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{t("customers.name")} *</Label>
                                <Input 
                                    id="name" 
                                    value={formData.name} 
                                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    required 
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nif">{t("customers.nif")}</Label>
                                    <Input 
                                        id="nif" 
                                        value={formData.nif} 
                                        onChange={(e) => setFormData({...formData, nif: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="rc">{t("customers.rc")}</Label>
                                    <Input 
                                        id="rc" 
                                        value={formData.rc} 
                                        onChange={(e) => setFormData({...formData, rc: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="address">{t("customers.address")}</Label>
                                <Input 
                                    id="address" 
                                    value={formData.address} 
                                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">{t("customers.phone")}</Label>
                                    <Input 
                                        id="phone" 
                                        value={formData.phone} 
                                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">{t("customers.email")}</Label>
                                    <Input 
                                        id="email" 
                                        value={formData.email} 
                                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    />
                                </div>
                            </div>
                            <Button type="submit" className="w-full">Save Changes</Button>
                        </form>
                    </TabsContent>

                    <TabsContent value="invoices">
                        <div className="max-h-[400px] overflow-y-auto border rounded-md mt-4">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[80px] px-2 text-xs">{t("invoices.number")}</TableHead>
                                        <TableHead className="hidden sm:table-cell">{t("invoices.date")}</TableHead>
                                        <TableHead className="px-2 text-xs">{t("invoices.status")}</TableHead>
                                        <TableHead className="text-right px-2 text-xs">{t("invoices.amount")}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {supplierInvoices?.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-xs">
                                                {t("invoices.empty")}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {supplierInvoices?.map((invoice) => (
                                        <TableRow key={invoice._id}>
                                            <TableCell className="font-medium text-xs px-2 py-3 whitespace-nowrap">{invoice.invoiceNumber}</TableCell>
                                            <TableCell className="hidden sm:table-cell text-xs px-2 py-3 whitespace-nowrap">{format(new Date(invoice.invoiceDate), "dd/MM/yyyy")}</TableCell>
                                            <TableCell className="px-2 py-3">
                                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium capitalize ${
                                                    (invoice.status === "paid" || invoice.paymentDate) 
                                                        ? "bg-emerald-100 text-emerald-700" 
                                                        : "bg-yellow-100 text-yellow-700"
                                                }`}>
                                                    {invoice.status === "paid" ? t("invoices.status.paid") : t("invoices.status.unpaid")}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-xs px-2 py-3 whitespace-nowrap">
                                                {invoice.totalTtc.toLocaleString()} <span className="hidden sm:inline">{currency}</span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TabsContent>
                </Tabs>
            ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t("customers.name")} *</Label>
                        <Input 
                            id="name" 
                            value={formData.name} 
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            required 
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="nif">{t("customers.nif")}</Label>
                            <Input 
                                id="nif" 
                                value={formData.nif} 
                                onChange={(e) => setFormData({...formData, nif: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="rc">{t("customers.rc")}</Label>
                            <Input 
                                id="rc" 
                                value={formData.rc} 
                                onChange={(e) => setFormData({...formData, rc: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="address">{t("customers.address")}</Label>
                        <Input 
                            id="address" 
                            value={formData.address} 
                            onChange={(e) => setFormData({...formData, address: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="phone">{t("customers.phone")}</Label>
                            <Input 
                                id="phone" 
                                value={formData.phone} 
                                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email">{t("customers.email")}</Label>
                            <Input 
                                id="email" 
                                value={formData.email} 
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>
                    <Button type="submit" className="w-full">{t("suppliers.add")}</Button>
                </form>
            )}
        </DialogContent>
    </Dialog>
  );
}
