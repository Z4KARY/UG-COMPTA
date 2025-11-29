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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { api } from "@/convex/_generated/api";
import { useQuery, useMutation } from "convex/react";
import { Plus, Trash2, ArrowLeft, Pencil } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function Suppliers() {
  const business = useQuery(api.businesses.getMyBusiness, {});
  const suppliers = useQuery(api.suppliers.list, business ? { businessId: business._id } : "skip");
  const createSupplier = useMutation(api.suppliers.create);
  const updateSupplier = useMutation(api.suppliers.update);
  const deleteSupplier = useMutation(api.suppliers.remove);

  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"suppliers"> | null>(null);
  
  // Fetch invoices for selected supplier
  const supplierInvoices = useQuery(api.purchaseInvoices.listBySupplier, 
    business && editingId ? { businessId: business._id, supplierId: editingId } : "skip"
  );

  const [formData, setFormData] = useState({
      name: "",
      nif: "",
      rc: "",
      address: "",
      phone: "",
      email: "",
      notes: ""
  });

  const handleEdit = (supplier: any) => {
    setEditingId(supplier._id);
    setFormData({
      name: supplier.name,
      nif: supplier.nif || "",
      rc: supplier.rc || "",
      address: supplier.address || "",
      phone: supplier.phone || "",
      email: supplier.email || "",
      notes: supplier.notes || ""
    });
    setIsOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({ name: "", nif: "", rc: "", address: "", phone: "", email: "", notes: "" });
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!business) return;
      try {
          if (editingId) {
            await updateSupplier({
              id: editingId,
              ...formData
            });
            toast.success("Supplier updated");
          } else {
            await createSupplier({
                businessId: business._id,
                ...formData
            });
            toast.success("Supplier created");
          }
          setIsOpen(false);
          setFormData({ name: "", nif: "", rc: "", address: "", phone: "", email: "", notes: "" });
          setEditingId(null);
      } catch (error) {
          toast.error(editingId ? "Failed to update supplier" : "Failed to create supplier");
      }
  };

  const handleDelete = async (id: any) => {
      if (confirm("Are you sure? This will fail if the supplier has linked invoices.")) {
          try {
              await deleteSupplier({ id });
              toast.success("Supplier deleted");
          } catch (error) {
              toast.error("Failed to delete supplier");
          }
      }
  };

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
                    <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
                    <p className="text-muted-foreground mt-1">
                    Manage your suppliers and track amounts owed.
                    </p>
                </div>
            </div>

            <div className="w-full md:w-auto">
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleCreate} className="w-full md:w-auto">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Supplier
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>{editingId ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
                            <DialogDescription>{editingId ? "Update supplier details and view history." : "Enter supplier details for VAT tracking."}</DialogDescription>
                        </DialogHeader>
                        
                        {editingId ? (
                            <Tabs defaultValue="details" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="details">Details</TabsTrigger>
                                    <TabsTrigger value="invoices">Invoices ({supplierInvoices?.length || 0})</TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="details">
                                    <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="name">Supplier Name *</Label>
                                            <Input 
                                                id="name" 
                                                value={formData.name} 
                                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                required 
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="nif">NIF</Label>
                                                <Input 
                                                    id="nif" 
                                                    value={formData.nif} 
                                                    onChange={(e) => setFormData({...formData, nif: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="rc">RC</Label>
                                                <Input 
                                                    id="rc" 
                                                    value={formData.rc} 
                                                    onChange={(e) => setFormData({...formData, rc: e.target.value})}
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="address">Address</Label>
                                            <Input 
                                                id="address" 
                                                value={formData.address} 
                                                onChange={(e) => setFormData({...formData, address: e.target.value})}
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="phone">Phone</Label>
                                                <Input 
                                                    id="phone" 
                                                    value={formData.phone} 
                                                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="email">Email</Label>
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
                                                    <TableHead className="w-[80px] px-2 text-xs">Number</TableHead>
                                                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                                                    <TableHead className="px-2 text-xs">Status</TableHead>
                                                    <TableHead className="text-right px-2 text-xs">Amount</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {supplierInvoices?.length === 0 && (
                                                    <TableRow>
                                                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground text-xs">
                                                            No invoices found.
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
                                                                {invoice.status || (invoice.paymentDate ? "paid" : "unpaid")}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-right font-medium text-xs px-2 py-3 whitespace-nowrap">
                                                            {invoice.totalTtc.toLocaleString()} <span className="hidden sm:inline">{business?.currency}</span>
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
                                    <Label htmlFor="name">Supplier Name *</Label>
                                    <Input 
                                        id="name" 
                                        value={formData.name} 
                                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                                        required 
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="nif">NIF</Label>
                                        <Input 
                                            id="nif" 
                                            value={formData.nif} 
                                            onChange={(e) => setFormData({...formData, nif: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="rc">RC</Label>
                                        <Input 
                                            id="rc" 
                                            value={formData.rc} 
                                            onChange={(e) => setFormData({...formData, rc: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address</Label>
                                    <Input 
                                        id="address" 
                                        value={formData.address} 
                                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="phone">Phone</Label>
                                        <Input 
                                            id="phone" 
                                            value={formData.phone} 
                                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email">Email</Label>
                                        <Input 
                                            id="email" 
                                            value={formData.email} 
                                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full">Create Supplier</Button>
                            </form>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </div>

        <Card>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="pl-4">Name</TableHead>
                            <TableHead className="hidden md:table-cell">Contact</TableHead>
                            <TableHead className="hidden lg:table-cell text-right">Total Purchases</TableHead>
                            <TableHead className="hidden lg:table-cell text-right">Paid</TableHead>
                            <TableHead className="text-right">Balance Due</TableHead>
                            <TableHead className="w-[80px] text-right pr-4">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suppliers?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No suppliers found.
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
                                        {[supplier.nif && `NIF: ${supplier.nif}`, supplier.rc && `RC: ${supplier.rc}`].filter(Boolean).join(" | ")}
                                    </div>
                                </TableCell>
                                <TableCell className="hidden md:table-cell">
                                    <div className="flex flex-col text-xs">
                                        <span>{supplier.phone}</span>
                                        <span className="text-muted-foreground">{supplier.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-right font-medium">
                                    {supplier.financials?.totalPurchases.toLocaleString()} <span className="text-xs text-muted-foreground">{business?.currency}</span>
                                </TableCell>
                                <TableCell className="hidden lg:table-cell text-right text-emerald-600">
                                    {supplier.financials?.totalPaid.toLocaleString()} <span className="text-xs text-muted-foreground">{business?.currency}</span>
                                </TableCell>
                                <TableCell className="text-right">
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