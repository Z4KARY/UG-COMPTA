import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Plus, Save, Trash2, Wand2 } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";

export default function PurchaseCreate() {
  const navigate = useNavigate();
  const business = useQuery(api.businesses.getMyBusiness, {});
  const suppliers = useQuery(api.suppliers.list, business ? { businessId: business._id } : "skip");
  const createPurchase = useMutation(api.purchaseInvoices.create);

  const [formData, setFormData] = useState({
    supplierId: "",
    invoiceNumber: "",
    invoiceDate: new Date().toISOString().split("T")[0],
    paymentMethod: "CASH",
    description: "",
  });

  const [items, setItems] = useState([
    { description: "", quantity: 1, unitPrice: 0, vatRate: 19 }
  ]);

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, vatRate: 19 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotals = () => {
    let subtotal = 0;
    let vat = 0;
    items.forEach(item => {
        const lineTotal = item.quantity * item.unitPrice;
        subtotal += lineTotal;
        vat += lineTotal * (item.vatRate / 100);
    });
    return { subtotal, vat, total: subtotal + vat };
  };

  const totals = calculateTotals();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business) return;
    if (!formData.supplierId) {
        toast.error("Please select a supplier");
        return;
    }

    try {
        await createPurchase({
            businessId: business._id,
            supplierId: formData.supplierId as any,
            invoiceNumber: formData.invoiceNumber,
            invoiceDate: new Date(formData.invoiceDate).getTime(),
            paymentMethod: formData.paymentMethod as any,
            description: formData.description,
            items: items.map(item => ({
                description: item.description,
                quantity: Number(item.quantity),
                unitPrice: Number(item.unitPrice),
                vatRate: Number(item.vatRate),
            })),
        });
        toast.success("Purchase invoice recorded");
        navigate("/purchases");
    } catch (error) {
        toast.error("Failed to record purchase");
        console.error(error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
                <Link to="/purchases">
                    <ArrowLeft className="h-4 w-4" />
                </Link>
            </Button>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">New Purchase Invoice</h1>
                <p className="text-muted-foreground mt-1">
                    Record a supplier invoice for VAT deduction.
                </p>
            </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Invoice Details</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Supplier</Label>
                        <Select 
                            value={formData.supplierId} 
                            onValueChange={(val) => setFormData({...formData, supplierId: val})}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select supplier" />
                            </SelectTrigger>
                            <SelectContent>
                                {suppliers?.map(s => (
                                    <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {suppliers?.length === 0 && (
                            <p className="text-xs text-muted-foreground">
                                No suppliers found. <Link to="/suppliers" className="text-primary underline">Create one first</Link>.
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Invoice Number</Label>
                        <div className="flex gap-2">
                            <Input 
                                value={formData.invoiceNumber}
                                onChange={(e) => setFormData({...formData, invoiceNumber: e.target.value})}
                                placeholder="e.g. INV-2024-001"
                                required={formData.invoiceNumber !== "AUTO"}
                                disabled={formData.invoiceNumber === "AUTO"}
                            />
                            <Button 
                                type="button" 
                                variant="outline" 
                                size="icon"
                                onClick={() => setFormData({
                                    ...formData, 
                                    invoiceNumber: formData.invoiceNumber === "AUTO" ? "" : "AUTO"
                                })}
                                title="Auto-generate number"
                            >
                                <Wand2 className={`h-4 w-4 ${formData.invoiceNumber === "AUTO" ? "text-primary" : "text-muted-foreground"}`} />
                            </Button>
                        </div>
                        {formData.invoiceNumber === "AUTO" && (
                            <p className="text-xs text-muted-foreground">
                                Number will be generated automatically (e.g. ACH-2024-001)
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label>Date</Label>
                        <Input 
                            type="date"
                            value={formData.invoiceDate}
                            onChange={(e) => setFormData({...formData, invoiceDate: e.target.value})}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Payment Method</Label>
                        <Select 
                            value={formData.paymentMethod} 
                            onValueChange={(val) => setFormData({...formData, paymentMethod: val})}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                                <SelectItem value="CHEQUE">Cheque</SelectItem>
                                <SelectItem value="CARD">Card</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Items</CardTitle>
                    <Button type="button" variant="outline" size="sm" onClick={addItem}>
                        <Plus className="mr-2 h-4 w-4" /> Add Item
                    </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                    {items.map((item, index) => (
                        <div key={index} className="grid grid-cols-12 gap-4 items-end border-b pb-4 last:border-0 last:pb-0">
                            <div className="col-span-5 space-y-2">
                                <Label className="text-xs">Description</Label>
                                <Input 
                                    value={item.description}
                                    onChange={(e) => updateItem(index, "description", e.target.value)}
                                    placeholder="Item description"
                                    required
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label className="text-xs">Qty</Label>
                                <Input 
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label className="text-xs">Price</Label>
                                <Input 
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={item.unitPrice}
                                    onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value))}
                                    required
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label className="text-xs">VAT %</Label>
                                <Select 
                                    value={item.vatRate.toString()} 
                                    onValueChange={(val) => updateItem(index, "vatRate", parseFloat(val))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="0">0%</SelectItem>
                                        <SelectItem value="9">9%</SelectItem>
                                        <SelectItem value="19">19%</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="col-span-1">
                                <Button type="button" variant="ghost" size="icon" onClick={() => removeItem(index)} disabled={items.length === 1}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}

                    <div className="flex justify-end pt-4">
                        <div className="w-64 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Subtotal HT:</span>
                                <span>{totals.subtotal.toFixed(2)} DZD</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">VAT Total:</span>
                                <span>{totals.vat.toFixed(2)} DZD</span>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-bold">
                                <span>Total TTC:</span>
                                <span>{totals.total.toFixed(2)} DZD</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate("/purchases")}>
                    Cancel
                </Button>
                <Button type="submit" size="lg">
                    <Save className="mr-2 h-4 w-4" />
                    Save Purchase
                </Button>
            </div>
        </form>
      </div>
    </DashboardLayout>
  );
}