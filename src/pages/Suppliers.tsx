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
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
                <Link to="/purchases">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Suppliers</h1>
                <p className="text-muted-foreground mt-1">
                Manage your suppliers for purchase tracking.
                </p>
            </div>
        </div>

        <div className="flex justify-end">
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogTrigger asChild>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Supplier
                    </Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edit Supplier" : "Add New Supplier"}</DialogTitle>
                        <DialogDescription>{editingId ? "Update supplier details." : "Enter supplier details for VAT tracking."}</DialogDescription>
                    </DialogHeader>
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
                        <Button type="submit" className="w-full">{editingId ? "Save Changes" : "Create Supplier"}</Button>
                    </form>
                </DialogContent>
            </Dialog>
        </div>

        <Card>
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>NIF</TableHead>
                            <TableHead>RC</TableHead>
                            <TableHead>Contact</TableHead>
                            <TableHead className="w-[100px] text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {suppliers?.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                    No suppliers found.
                                </TableCell>
                            </TableRow>
                        )}
                        {suppliers?.map((supplier) => (
                            <TableRow key={supplier._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(supplier)}>
                                <TableCell className="font-medium">{supplier.name}</TableCell>
                                <TableCell>{supplier.nif || "-"}</TableCell>
                                <TableCell>{supplier.rc || "-"}</TableCell>
                                <TableCell>
                                    <div className="flex flex-col text-xs">
                                        <span>{supplier.phone}</span>
                                        <span className="text-muted-foreground">{supplier.email}</span>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="icon" onClick={() => handleEdit(supplier)}>
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDelete(supplier._id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </div>
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
