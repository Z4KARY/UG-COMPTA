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
import { Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { ImportDialog } from "@/components/ImportDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { SetupRequired } from "@/components/SetupRequired";

export default function Products() {
  const { t } = useLanguage();
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
        toast.success(t("products.toast.updated"));
      } else {
        await createProduct({
          businessId: business._id,
          ...formData,
        });
        toast.success(t("products.toast.created"));
      }
      setIsDialogOpen(false);
      setFormData({ 
        name: "", description: "", unitPrice: 0, tvaRate: 19, defaultDiscount: 0, 
        unitLabel: "", isActive: true, type: "service" 
      });
      setEditingId(null);
    } catch (error) {
      toast.error(editingId ? t("products.toast.updateError") : t("products.toast.createError"));
    }
  };

  const handleDelete = async (id: Id<"products">) => {
    if (confirm(t("products.deleteConfirm"))) {
      try {
        await deleteProduct({ id });
        toast.success(t("products.toast.deleted"));
      } catch (error) {
        toast.error(t("products.toast.deleteError"));
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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("products.title")}</h1>
            <p className="text-muted-foreground mt-1">
              {t("products.subtitle")}
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
                  <Plus className="mr-2 h-4 w-4" /> {t("products.add")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingId ? t("products.edit") : t("products.add")}</DialogTitle>
                  <DialogDescription>
                    {editingId ? t("products.edit") : t("products.subtitle")}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="type" className="text-right">
                        {t("products.type")}
                      </Label>
                      <Select value={formData.type} onValueChange={handleTypeChange}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder={t("products.type")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="service">{t("products.type.service")}</SelectItem>
                          <SelectItem value="goods">{t("products.type.goods")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="name" className="text-right">
                        {t("products.name")}
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
                        {t("products.description")}
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
                        {t("products.price")}
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
                        {t("products.unitLabel")}
                      </Label>
                      <Input
                        id="unitLabel"
                        name="unitLabel"
                        value={formData.unitLabel}
                        onChange={handleChange}
                        className="col-span-3"
                        placeholder={t("products.placeholders.unitLabel")}
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="tvaRate" className="text-right">
                        {t("products.tva")}
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
                        {t("products.discount")}
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
                        {t("products.active")}
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
                    <Button type="submit">{editingId ? t("products.edit") : t("products.add")}</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t("products.title")}</CardTitle>
            <CardDescription>
              {t("products.subtitle")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("products.name")}</TableHead>
                    <TableHead>{t("products.price")}</TableHead>
                    <TableHead>{t("products.unit")}</TableHead>
                    <TableHead>{t("products.tva")}</TableHead>
                    <TableHead>{t("products.status")}</TableHead>
                    <TableHead className="text-right">{t("products.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products?.map((product) => (
                    <TableRow key={product._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(product)}>
                      <TableCell className="font-medium min-w-[150px]">
                        {product.name}
                        <div className="text-xs text-muted-foreground capitalize">
                            {product.type === "goods" ? t("products.type.goods") : t("products.type.service")}
                        </div>
                        {product.description && <div className="text-xs text-muted-foreground truncate max-w-[200px]">{product.description}</div>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{product.unitPrice.toLocaleString()} {business.currency}</TableCell>
                      <TableCell>{product.unitLabel || "-"}</TableCell>
                      <TableCell>{product.tvaRate}%</TableCell>
                      <TableCell>
                        <div className={`text-xs px-2 py-1 rounded-full inline-block ${product.isActive !== false ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}`}>
                            {product.isActive !== false ? t("products.active") : t("products.inactive")}
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
                        {t("products.empty")}
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