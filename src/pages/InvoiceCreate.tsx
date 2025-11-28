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
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { Plus, Trash2, Calculator, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CreateCustomerDialog } from "@/components/CreateCustomerDialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from "@/components/ui/form";

// We will fetch these from backend now, but keep defaults for initial state
const DEFAULT_FISCAL_CONSTANTS = {
  STAMP_DUTY: {
    MIN_AMOUNT_SUBJECT: 0,
    MIN_DUTY: 5,
    MAX_DUTY: 10000,
    BRACKETS: [
        { up_to: null, rate_per_100da: 1.0 }
    ]
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
  productType?: "goods" | "service";
}

const formSchema = z.object({
  invoiceNumber: z.string().default("AUTO"),
  issueDate: z.date(),
  dueDate: z.date(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().default(1),
    unitPrice: z.number().default(0),
    tvaRate: z.number().default(19),
    lineTotal: z.number().default(0),
  })),
  notes: z.string().default(""),
  currency: z.string().default("DZD"),
  type: z.enum(["invoice", "quote", "credit_note"]),
  fiscalType: z.enum(["LOCAL", "INTERNATIONAL"]),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"]),
});

export default function InvoiceCreate() {
  const navigate = useNavigate();
  const business = useQuery(api.businesses.getMyBusiness, {});
  const customers = useQuery(
    api.customers.list,
    business ? { businessId: business._id } : "skip"
  );
  const products = useQuery(
    api.products.list,
    business ? { businessId: business._id } : "skip"
  );
  
  // Fetch fiscal parameters
  const stampDutyConfig = useQuery(api.fiscalParameters.getStampDutyConfig, 
    business ? { businessId: business._id } : "skip"
  );

  const createInvoice = useMutation(api.invoices.create);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceNumber: "AUTO", // Default to AUTO
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      items: [{ description: "", quantity: 1, unitPrice: 0, tvaRate: 19, lineTotal: 0 }],
      notes: "",
      currency: "DZD",
      type: "invoice",
      fiscalType: "LOCAL",
    },
  });

  const [type, setType] = useState<"invoice" | "quote" | "credit_note">("invoice");
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
      tvaRate: business?.fiscalRegime === "IFU" || business?.type === "auto_entrepreneur" ? 0 : 19,
      lineTotal: 0,
      productType: "service",
    },
  ]);

  // Update default TVA when business loads
  useEffect(() => {
    if (business && items.length === 1 && items[0].description === "" && items[0].unitPrice === 0) {
        const defaultTva = (business.fiscalRegime === "IFU" || business.type === "auto_entrepreneur") ? 0 : (business.tvaDefault || 19);
        setItems([{ ...items[0], tvaRate: defaultTva }]);
    }
  }, [business]);

  // Calculations
  const calculateTotals = () => {
    let subtotalHt = 0;
    let totalTva = 0;

    items.forEach((item) => {
      // Replicate backend logic for preview
      const quantity = item.quantity;
      const unitPrice = item.unitPrice;
      const discountRate = item.discountRate || 0;
      // Force 0 TVA for AE in preview
      const tvaRate = business?.type === "auto_entrepreneur" ? 0 : item.tvaRate;

      const basePrice = unitPrice * quantity;
      const discountAmount = Math.round((basePrice * (discountRate / 100) + Number.EPSILON) * 100) / 100;
      const lineTotalHt = Math.round((basePrice - discountAmount + Number.EPSILON) * 100) / 100;
      const lineTva = Math.round((lineTotalHt * (tvaRate / 100) + Number.EPSILON) * 100) / 100;

      subtotalHt += lineTotalHt;
      totalTva += lineTva;
    });

    // Round totals
    subtotalHt = Math.round((subtotalHt + Number.EPSILON) * 100) / 100;
    totalTva = Math.round((totalTva + Number.EPSILON) * 100) / 100;

    let baseTtc = subtotalHt + totalTva;
    
    // Stamp Duty (Droit de Timbre) Calculation
    // Based on Code du Timbre Art. 258 & LF 2025
    let stampDutyAmount = 0;

    if (paymentMethod === "CASH") {
      // Use fetched config or defaults
      const config = stampDutyConfig || DEFAULT_FISCAL_CONSTANTS.STAMP_DUTY;
      const { MIN_AMOUNT_SUBJECT, MIN_DUTY, MAX_DUTY, BRACKETS } = config;
      
      if (baseTtc >= MIN_AMOUNT_SUBJECT) {
          let duty = 0;
          let remaining = baseTtc;
          let previousLimit = 0;

          if (!BRACKETS || BRACKETS.length === 0) {
             duty = Math.ceil(baseTtc / 100) * 1.0;
          } else {
            for (const bracket of BRACKETS) {
                let bracketCap = bracket.up_to === null ? Infinity : bracket.up_to;
                let bracketSize = bracketCap - previousLimit;
                let applicableAmount = Math.min(remaining, bracketSize);
                
                if (applicableAmount > 0) {
                    let units_100da = Math.ceil(applicableAmount / 100);
                    duty += units_100da * bracket.rate_per_100da;
                    remaining -= applicableAmount;
                    previousLimit = bracketCap;
                }
                if (remaining <= 0) break;
            }
          }

          if (duty < MIN_DUTY) duty = MIN_DUTY;
          if (MAX_DUTY !== null && duty > MAX_DUTY) duty = MAX_DUTY;
          
          stampDutyAmount = Math.round((duty + Number.EPSILON) * 100) / 100;
      }
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

    if (field === "description" || field === "productType") {
      // @ts-ignore
      item[field] = value;
    } else {
      item[field as "quantity" | "unitPrice" | "discountRate" | "tvaRate"] =
        parseFloat(value as string) || 0;
    }

    // Recalculate line total for display (HT)
    const basePrice = item.unitPrice * item.quantity;
    const discountAmount = basePrice * ((item.discountRate || 0) / 100);
    item.lineTotal = basePrice - discountAmount; // Raw calculation for immediate feedback, rounded in totals

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
        tvaRate: business?.fiscalRegime === "IFU" || business?.type === "auto_entrepreneur" ? 0 : (business?.tvaDefault || 19),
        lineTotal: 0,
        productType: "service",
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
        tvaRate: business?.fiscalRegime === "IFU" ? 0 : product.tvaRate,
        discountRate: product.defaultDiscount || 0,
        productType: product.type || "service",
      };
      // Recalculate line total
      const priceAfterDiscount =
        product.unitPrice * (1 - (product.defaultDiscount || 0) / 100);
      newItems[index].lineTotal = priceAfterDiscount * newItems[index].quantity;
      setItems(newItems);
    }
  };

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!business) return;
    
    try {
      // ... keep existing code (calculations)

      await createInvoice({
        businessId: business._id,
        customerId: values.customerId as Id<"customers">,
        invoiceNumber: values.invoiceNumber === "AUTO" ? undefined : values.invoiceNumber, // Send undefined if AUTO
        type: values.type,
        fiscalType: values.fiscalType,
        issueDate: values.issueDate.getTime(),
        dueDate: values.dueDate.getTime(),
        currency: values.currency,
        status: "draft",
        notes: values.notes,
        paymentMethod: values.paymentMethod,
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
      // ... keep existing code (error handling)
    }
  }

  if (!business) return null;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Create {type === "quote" ? "Quote" : type === "credit_note" ? "Credit Note" : "Invoice"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Invoice Details</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="invoiceNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Invoice Number</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                            <Input {...field} placeholder="Leave as AUTO for automatic generation" />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Set to "AUTO" to automatically generate the next number (e.g. INV-2024-001).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="issueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Issue Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The date when the invoice is issued.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        The date by which the invoice must be paid.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="invoice">Invoice (Facture)</SelectItem>
                          <SelectItem value="quote">Quote (Pro-forma/Devis)</SelectItem>
                          <SelectItem value="credit_note">Credit Note (Avoir)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The type of document being created.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fiscalType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fiscal Type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOCAL">Local (TVA 19%)</SelectItem>
                          <SelectItem value="INTERNATIONAL">International (No TVA)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The fiscal regime for this invoice.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Currency</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select currency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DZD">Algerian Dinar (DZD)</SelectItem>
                          <SelectItem value="USD">US Dollar (USD)</SelectItem>
                          <SelectItem value="EUR">Euro (EUR)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The currency in which the invoice is issued.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
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
                      <FormDescription>
                        The method by which the customer will pay.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {/* Customer Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Customer</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Customer</Label>
                  <div className="flex gap-2">
                    <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger className="w-full">
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
                    <CreateCustomerDialog 
                        businessId={business._id} 
                        onCustomerCreated={(id) => setCustomerId(id)}
                    />
                </div>
              </div>
            </Card>
          </div>

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
                    <Label className="text-xs">Type</Label>
                    <Select 
                        value={item.productType || "service"} 
                        onValueChange={(val) => handleItemChange(index, "productType", val)}
                    >
                        <SelectTrigger className="h-10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="service">Service</SelectItem>
                            <SelectItem value="goods">Goods</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-1 space-y-1">
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
                  {business?.type !== "auto_entrepreneur" && (
                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">TVA %</Label>
                    <Input
                      type="number"
                      value={item.tvaRate}
                      onChange={(e) =>
                        handleItemChange(index, "tvaRate", e.target.value)
                      }
                      disabled={business?.fiscalRegime === "IFU"}
                      className={business?.fiscalRegime === "IFU" ? "bg-gray-100 text-gray-500" : ""}
                    />
                  </div>
                  )}
                  <div className="col-span-1 space-y-1">
                    <Label className="text-xs">Total {business?.type === "auto_entrepreneur" ? "" : "HT"}</Label>
                    <div className="text-sm font-medium py-2">
                      {item.lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
        </form>
      </Form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Business Info (Read-Only) */}
          <Card className="bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Business Information</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-bold">{business.name}</p>
                        <p>{business.address}</p>
                        {business.city && <p>{business.city}</p>}
                    </div>
                    <div className="text-right">
                        <p>NIF: {business.nif || "-"}</p>
                        <p>RC: {business.rc || "-"}</p>
                        <p>AI: {business.ai || "-"}</p>
                    </div>
                </div>
            </CardContent>
          </Card>

          {/* Customer & Invoice Details */}
          <Card>
            <CardHeader>
              <CardTitle>Document Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={type} onValueChange={(val: any) => setType(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="invoice">Invoice (Facture)</SelectItem>
                    <SelectItem value="quote">Quote (Pro-forma/Devis)</SelectItem>
                    <SelectItem value="credit_note">Credit Note (Avoir)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Customer</Label>
                <div className="flex gap-2">
                    <Select value={customerId} onValueChange={setCustomerId}>
                    <SelectTrigger className="w-full">
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
                    <CreateCustomerDialog 
                        businessId={business._id} 
                        onCustomerCreated={(id) => setCustomerId(id)}
                    />
                </div>
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
        </div>

        <div className="space-y-6">
          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total {business?.type === "auto_entrepreneur" ? "" : "HT"}</span>
                <span>
                  {subtotalHt.toFixed(2)} {business.currency}
                </span>
              </div>
              {business?.type !== "auto_entrepreneur" && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total TVA</span>
                <span>
                  {totalTva.toFixed(2)} {business.currency}
                </span>
              </div>
              )}
              
              {stampDutyAmount > 0 && (
                <div className="flex items-center justify-between text-sm pt-2 border-t text-orange-600">
                  <div className="flex items-center gap-2">
                    <Label>Timbre Fiscal (Cash)</Label>
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
            </CardContent>
          </Card>

          {/* Fiscal Alerts */}
          {paymentMethod === "CASH" && (
            <Alert className="bg-orange-50 border-orange-200">
              <Info className="h-4 w-4 text-orange-600" />
              <AlertTitle className="text-orange-800">Stamp Duty Applied</AlertTitle>
              <AlertDescription className="text-orange-700 text-xs">
                Cash payments are subject to stamp duty (Min {stampDutyConfig?.MIN_DUTY || 5} DA, Max {stampDutyConfig?.MAX_DUTY || 10000} DA).
                <br />
                Ref: Code du Timbre Art. 258.
              </AlertDescription>
            </Alert>
          )}
          
          {paymentMethod !== "CASH" && paymentMethod !== "OTHER" && (
             <Alert className="bg-green-50 border-green-200">
              <Info className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-800">Stamp Duty Exempt</AlertTitle>
              <AlertDescription className="text-green-700 text-xs">
                Electronic payments (Cheque, Transfer, Card) are exempt from stamp duty.
                <br />
                Ref: Loi de Finances 2025, Art. 258 quinquies.
              </AlertDescription>
            </Alert>
          )}

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
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => handleSubmit("draft")}>
                    Save Draft
                </Button>
                <Button onClick={() => handleSubmit("issued")}>
                    Issue Invoice
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}