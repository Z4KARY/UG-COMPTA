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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Plus, Trash2, Pencil } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { ImportDialog } from "@/components/ImportDialog";

export default function Products() {
  const business = useQuery(api.businesses.getMyBusiness, {});
  const products = useQuery(
    api.products.list,
    business ? { businessId: business._id } : "skip"
  );
  const createProduct = useMutation(api.products.create);
  const updateProduct = useMutation(api.products.update);
  const deleteProduct = useMutation(api.products.remove);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"products"> | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    unitPrice: 0,
    tvaRate: 19,
    defaultDiscount: 0,
    unitLabel: "",
    isActive: true,
    type: "service" as "goods" | "service",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "name" || name === "description" || name === "unitLabel" ? value : parseFloat(value) || 0,
    });
  };

  const handleTypeChange = (value: "goods" | "service") => {
    setFormData({ ...formData, type: value });
  };

  const handleEdit = (product: any) => {
    setEditingId(product._id);
    setFormData({
      name: product.name,
      description: product.description || "",
      unitPrice: product.unitPrice,
      tvaRate: product.tvaRate,
      defaultDiscount: product.defaultDiscount || 0,
      unitLabel: product.unitLabel || "",
      isActive: product.isActive !== false,
      type: product.type || "service",
    });
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({ 
      name: "", description: "", unitPrice: 0, tvaRate: 19, defaultDiscount: 0, 
      unitLabel: "", isActive: true, type: "service" 
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    try {
      if (editingId) {
        await updateProduct({
          id: editingId,
          ...formData,
        });
        toast.success("Product updated");
      } else {
        await createProduct({
          businessId: business._id,
          ...formData,
        });
        toast.success("Product created");
      }
      setIsDialogOpen(false);
      setFormData({ 
        name: "", description: "", unitPrice: 0, tvaRate: 19, defaultDiscount: 0, 
        unitLabel: "", isActive: true, type: "service" 
      });
      setEditingId(null);
    } catch (error) {
      toast.error(editingId ? "Failed to update product" : "Failed to create product");
    }
  };

  const handleDelete = async (id: Id<"products">) => {
    if (confirm("Are you sure you want to delete this product?")) {
      try {
        await deleteProduct({ id });
        toast.success("Product deleted");
      } catch (error) {
        toast.error("Failed to delete product");
      }
    }
  };

  if (!business) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Please set up your business profile first.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products & Services</h1>
            <p className="text-muted-foreground mt-1">
              Manage your catalog of goods and services.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            {business && (
              <div className="w-full sm:w-auto">
                <ImportDialog businessId={business._id} type="PRODUCTS" />
              </div>
            )}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreate} className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? "Edit Product" : "Add New Product"}</DialogTitle>
                  <DialogDescription>
                    {editingId ? "Update product details." : "Enter the product details below."}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="type" className="text-right">
                        Type
                      </Label>
                      <Select value={formData.type} onValueChange={handleTypeChange}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service">Service (Prestation)</SelectItem>
                          <SelectItem value="goods">Goods (Marchandise)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        Name
                      </Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="description" className="text-right">
                        Description
                      </Label>
                      <Input
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="unitPrice" className="text-right">
                        Price
                      </Label>
                      <Input
                        id="unitPrice"
                        name="unitPrice"
                        type="number"
                        value={formData.unitPrice}
                        onChange={handleChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="unitLabel" className="text-right">
                        Unit Label
                      </Label>
                      <Input
                        id="unitLabel"
                        name="unitLabel"
                        value={formData.unitLabel}
                        onChange={handleChange}
                        className="col-span-3"
                        placeholder="e.g. Hour, Piece"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="tvaRate" className="text-right">
                        TVA (%)
                      </Label>
                      <Input
                        id="tvaRate"
                        name="tvaRate"
                        type="number"
                        value={formData.tvaRate}
                        onChange={handleChange}
                        className="col-span-3"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="defaultDiscount" className="text-right">
                        Discount (%)
                      </Label>
                      <Input
                        id="defaultDiscount"
                        name="defaultDiscount"
                        type="number"
                        value={formData.defaultDiscount}
                        onChange={handleChange}
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="isActive" className="text-right">
                        Active
                      </Label>
                      <div className="col-span-3 flex items-center space-x-2">
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="submit">{editingId ? "Save Changes" : "Create Product"}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product List</CardTitle>
            <CardDescription>
              Manage your products and services.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>TVA (%)</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => (
                    <TableRow key={product._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(product)}>
                      <TableCell className="font-medium min-w-[150px]">
                        {product.name}
                        <div className="text-xs text-muted-foreground capitalize">{product.type || "service"}</div>
                        {product.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</div>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{product.unitPrice.toLocaleString()} {business.currency}</TableCell>
                      <TableCell>{product.unitLabel || "-"}</TableCell>
                      <TableCell>{product.tvaRate}%</TableCell>
                      <TableCell>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${product.isActive !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                            {product.isActive !== false ? "Active" : "Inactive"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product._id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {products?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center">
                        No products found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}