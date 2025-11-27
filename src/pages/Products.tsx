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
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";

export default function Products() {
  const business = useQuery(api.businesses.getMyBusiness);
  const products = useQuery(
    api.products.list,
    business ? { businessId: business._id } : "skip"
  );
  const createProduct = useMutation(api.products.create);
  const deleteProduct = useMutation(api.products.remove);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    unitPrice: 0,
    tvaRate: 19,
    defaultDiscount: 0,
    type: "service" as "goods" | "service",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === "name" ? value : parseFloat(value) || 0,
    });
  };

  const handleTypeChange = (value: "goods" | "service") => {
    setFormData({ ...formData, type: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    try {
      await createProduct({
        businessId: business._id,
        ...formData,
      });
      toast.success("Product created");
      setIsDialogOpen(false);
      setFormData({ name: "", unitPrice: 0, tvaRate: 19, defaultDiscount: 0, type: "service" });
    } catch (error) {
      toast.error("Failed to create product");
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Products</h1>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Enter the product details below.
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
              </div>
              <DialogFooter>
                <Button type="submit">Save Product</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Product List</CardTitle>
          <CardDescription>
            Manage your products and services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>TVA (%)</TableHead>
                <TableHead>Discount (%)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products?.map((product) => (
                <TableRow key={product._id}>
                  <TableCell className="font-medium">
                    {product.name}
                    <div className="text-xs text-muted-foreground capitalize">{product.type || "service"}</div>
                  </TableCell>
                  <TableCell>{product.unitPrice.toLocaleString()} {business.currency}</TableCell>
                  <TableCell>{product.tvaRate}%</TableCell>
                  <TableCell>{product.defaultDiscount || 0}%</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(product._id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {products?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No products found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}