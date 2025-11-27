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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info } from "lucide-react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Plus, Trash2, Calculator } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";

// Simplified client-side version of the fiscal logic for preview
// The authoritative logic is in convex/fiscal.ts
const FISCAL_CONSTANTS = {
  STAMP_DUTY: {
    MIN_DUTY: 5,
    MAX_DUTY: 10000,
    RATE_PER_100DA: 1.0,
  }
};

interface InvoiceItem {
  productId?: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discountRate: number;
  tvaRate: number;
  lineTotal: number;
}

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const business = useQuery(api.businesses.getMyBusiness);
  const customers = useQuery(
    api.customers.list,
    business ? { businessId: business._id } : "skip"
  );
  const products = useQuery(
    api.products.list,
    business ? { businessId: business._id } : "skip"
  );
  const createInvoice = useMutation(api.invoices.create);

  const [customerId, setCustomerId] = useState<string>("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [issueDate, setIssueDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "CHEQUE" | "CARD" | "OTHER">("CASH");
  
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      description: "",
      quantity: 1,
      unitPrice: 0,
      discountRate: 0,
      tvaRate: 19,
      lineTotal: 0,
    },
  ]);

  // Calculations
  const calculateTotals = () => {
    let subtotalHt = 0;
    let totalTva = 0;

    items.forEach((item) => {
      const priceAfterDiscount =
        item.unitPrice * (1 - (item.discountRate || 0) / 100);
      const lineTotalHt = priceAfterDiscount * item.quantity;
      const lineTva = lineTotalHt * (item.tvaRate / 100);

      subtotalHt += lineTotalHt;
      totalTva += lineTva;
    });

    let baseTtc = subtotalHt + totalTva;
    
    // Stamp Duty (Droit de Timbre) Calculation
    let stampDutyAmount = 0;

    if (paymentMethod === "CASH") {
      const { MIN_DUTY, MAX_DUTY, RATE_PER_100DA } = FISCAL_CONSTANTS.STAMP_DUTY;
      
      // 1 DA per 100 DA or fraction thereof
      stampDutyAmount = Math.ceil(baseTtc / 100) * RATE_PER_100DA;
      
      if (stampDutyAmount < MIN_DUTY) stampDutyAmount = MIN_DUTY;
      if (stampDutyAmount > MAX_DUTY) stampDutyAmount = MAX_DUTY;
    }

    const finalTotal = baseTtc + stampDutyAmount;

    return { subtotalHt, totalTva, totalTtc: finalTotal, stampDutyAmount };
  };

  const { subtotalHt, totalTva, totalTtc, stampDutyAmount } = calculateTotals();

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string | number
  ) => {
    const newItems = [...items];
    const item = { ...newItems[index] };

    if (field === "description") {
      item.description = value as string;
    } else {
      item[field as "quantity" | "unitPrice" | "discountRate" | "tvaRate"] =
        parseFloat(value as string) || 0;
    }

    // Recalculate line total
    const priceAfterDiscount =
      item.unitPrice * (1 - (item.discountRate || 0) / 100);
    item.lineTotal = priceAfterDiscount * item.quantity;

    newItems[index] = item;
    setItems(newItems);
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        discountRate: 0,
        tvaRate: business?.tvaDefault || 19,
        lineTotal: 0,
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
  };

  const handleProductSelect = (index: number, productId: string) => {
    const product = products?.find((p) => p._id === productId);
    if (product) {
      const newItems = [...items];
      newItems[index] = {
        ...newItems[index],
        productId: product._id,
        description: product.name,
        unitPrice: product.unitPrice,
        tvaRate: product.tvaRate,
        discountRate: product.defaultDiscount || 0,
      };
      // Recalculate line total
      const priceAfterDiscount =
        product.unitPrice * (1 - (product.defaultDiscount || 0) / 100);
      newItems[index].lineTotal = priceAfterDiscount * newItems[index].quantity;
      setItems(newItems);
    }
  };

  const handleSubmit = async () => {
    if (!business || !customerId) {
      toast.error("Please select a customer");
      return;
    }

    try {
      await createInvoice({
        businessId: business._id,
        customerId: customerId as Id<"customers">,
        invoiceNumber: invoiceNumber || `INV-${Date.now()}`,
        issueDate: new Date(issueDate).getTime(),
        dueDate: new Date(dueDate).getTime(),
        currency: business.currency,
        status: "draft",
        notes,
        paymentMethod,
        subtotalHt,
        totalHt: subtotalHt, // Legacy support
        totalTva,
        stampDutyAmount,
        totalTtc,
        items: items.map(item => ({
            ...item,
            productId: item.productId as Id<"products"> | undefined,
            lineTotalHt: item.lineTotal,
            lineTotalTtc: item.lineTotal * (1 + item.tvaRate/100)
        })),
      });
      toast.success("Invoice created successfully");
      navigate("/invoices");
    } catch (error) {
      toast.error("Failed to create invoice");
      console.error(error);
    }
  };

  if (!business) return null;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create Invoice</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer & Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={customerId} onValueChange={setCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice Number</Label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div className="space-y-2">
                <Label>Issue Date</Label>
                <Input
                  type="date"
                  value={issueDate}
                  onChange={(e) => setIssueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={paymentMethod} onValueChange={(val: any) => setPaymentMethod(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CASH">Cash (Espèces)</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Bank Transfer (Virement)</SelectItem>
                    <SelectItem value="CHEQUE">Cheque</SelectItem>
                    <SelectItem value="CARD">Card (CIB/Edahabia)</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader>
              <CardTitle>Items</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.map((item, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-end border-b pb-4"
                >
                  <div className="col-span-4 space-y-1">
                    <Label className="text-xs">Description</Label>
                    <div className="flex gap-2">
                      <Select
                        onValueChange={(val) => handleProductSelect(index, val)}
                      >
                        <SelectTrigger className="w-[40px] px-2">
                          <span className="sr-only">Select Product</span>
                        </SelectTrigger>
                        <SelectContent>
                          {products?.map((p) => (
                            <SelectItem key={p._id} value={p._id}>
                              {p.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        value={item.description}
                        onChange={(e) =>
                          handleItemChange(index, "description", e.target.value)
                        }
                        placeholder="Item description"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Price</Label>
                    <Input
                      type="number"
                      value={item.unitPrice}
                      onChange={(e) =>
                        handleItemChange(index, "unitPrice", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">TVA %</Label>
                    <Input
                      type="number"
                      value={item.tvaRate}
                      onChange={(e) =>
                        handleItemChange(index, "tvaRate", e.target.value)
                      }
                    />
                  </div>
                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">Total</Label>
                    <div className="text-sm font-medium py-2">
                      {item.lineTotal.toFixed(2)}
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button variant="outline" onClick={addItem} className="w-full">
                <Plus className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total HT</span>
                <span>
                  {subtotalHt.toFixed(2)} {business.currency}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total TVA</span>
                <span>
                  {totalTva.toFixed(2)} {business.currency}
                </span>
              </div>
              
              {stampDutyAmount > 0 && (
                <div className="flex items-center justify-between text-sm pt-2 border-t text-orange-600">
                  <div className="flex items-center gap-2">
                    <Label>Timbre Fiscal (1%)</Label>
                  </div>
                  <span>
                    {stampDutyAmount.toFixed(2)} {business.currency}
                  </span>
                </div>
              )}

              <div className="border-t pt-4 flex justify-between font-bold text-lg">
                <span>Total TTC</span>
                <span>
                  {totalTtc.toFixed(2)} {business.currency}
                </span>
              </div>

              {paymentMethod === "CASH" ? (
                <Alert className="bg-orange-50 border-orange-200">
                  <Info className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-800">Stamp Duty Applied</AlertTitle>
                  <AlertDescription className="text-orange-700 text-xs">
                    Cash payments are subject to 1% stamp duty (Art. 258 Code du Timbre).
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="bg-green-50 border-green-200">
                  <Info className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Exempt from Stamp Duty</AlertTitle>
                  <AlertDescription className="text-green-700 text-xs">
                    Electronic/Bank payments are exempt (Art. 258 quinquies).
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, notes, etc."
                />
              </div>
              <Button className="w-full" onClick={handleSubmit}>
                Save Invoice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}