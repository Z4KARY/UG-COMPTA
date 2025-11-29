import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, SubmitHandler } from "react-hook-form";
import { Form } from "@/components/ui/form";
import { InvoiceFormDetails } from "@/components/invoice/InvoiceFormDetails";
import { InvoiceFormCustomer } from "@/components/invoice/InvoiceFormCustomer";
import { InvoiceFormItems } from "@/components/invoice/InvoiceFormItems";
import { InvoiceFormSummary } from "@/components/invoice/InvoiceFormSummary";
import { InvoiceItem } from "@/types/invoice";

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

const formSchema = z.object({
  invoiceNumber: z.string().optional(),
  issueDate: z.date(),
  dueDate: z.date(),
  items: z.array(z.object({
    productId: z.string().optional(),
    description: z.string(),
    quantity: z.number(),
    unitPrice: z.number(),
    discountRate: z.number().optional(),
    tvaRate: z.number(),
    lineTotal: z.number(),
    productType: z.enum(["goods", "service"]).optional(),
  })),
  notes: z.string().optional(),
  currency: z.string().optional(),
  type: z.enum(["invoice", "quote", "credit_note"]),
  fiscalType: z.enum(["LOCAL", "EXPORT", "EXEMPT"]).optional(),
  paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"]),
  customerId: z.string().min(1, "Customer is required"),
});

type FormValues = z.infer<typeof formSchema>;

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

  const [submitStatus, setSubmitStatus] = useState<"draft" | "issued">("draft");

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      invoiceNumber: "AUTO", // Default to AUTO
      issueDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
      items: [{ description: "", quantity: 1, unitPrice: 0, tvaRate: 19, lineTotal: 0, discountRate: 0 }],
      notes: "",
      currency: "DZD",
      type: "invoice",
      fiscalType: "LOCAL",
      paymentMethod: "CASH",
      customerId: "",
    },
  });

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
  const [notes, setNotes] = useState("");

  // Watch form values for calculations
  const paymentMethod = form.watch("paymentMethod");
  const type = form.watch("type");

  // Sync form with state changes
  useEffect(() => {
    form.setValue("items", items.map(i => ({
      productId: i.productId,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      discountRate: i.discountRate,
      tvaRate: i.tvaRate,
      lineTotal: i.lineTotal,
      productType: i.productType
    })));
  }, [items, form]);

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

  const onSubmit: SubmitHandler<FormValues> = async (values) => {
    if (!business) return;
    
    try {
      await createInvoice({
        businessId: business._id,
        customerId: values.customerId as Id<"customers">,
        invoiceNumber: values.invoiceNumber === "AUTO" || !values.invoiceNumber ? undefined : values.invoiceNumber, // Send undefined if AUTO
        type: values.type,
        fiscalType: values.fiscalType as "LOCAL" | "EXPORT" | "EXEMPT" | undefined,
        issueDate: values.issueDate.getTime(),
        dueDate: values.dueDate.getTime(),
        currency: values.currency || "DZD",
        status: submitStatus,
        notes: values.notes || "",
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

      toast.success(`Invoice ${submitStatus === 'draft' ? 'saved as draft' : 'issued'} successfully`);
      navigate("/invoices");
    } catch (error) {
      console.error(error);
      toast.error("Failed to create invoice");
    }
  }

  const handleSubmit = (status: "draft" | "issued") => {
    setSubmitStatus(status);
    form.handleSubmit(onSubmit)();
  };

  if (!business) return null;

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">Create {type === "quote" ? "Quote" : type === "credit_note" ? "Credit Note" : "Invoice"}</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <InvoiceFormDetails />

            <InvoiceFormCustomer 
              customers={customers || []} 
              businessId={business._id}
              onCustomerSelect={(id) => form.setValue("customerId", id)}
            />
          </div>

          <InvoiceFormItems 
            items={items} 
            setItems={setItems} 
            products={products || []} 
            business={business}
          />
        </form>
      </Form>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
          {/* Business Info (Read-Only) */}
          <Card className="bg-muted/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Business Information</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                        <p className="font-bold">{business.name}</p>
                        <p>{business.address}</p>
                        {business.city && <p>{business.city}</p>}
                    </div>
                    <div className="sm:text-right">
                        <p>NIF: {business.nif || "-"}</p>
                        <p>RC: {business.rc || "-"}</p>
                        <p>AI: {business.ai || "-"}</p>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>

        <div className="order-1 lg:order-2">
          <InvoiceFormSummary 
            business={business}
            subtotalHt={subtotalHt}
            totalTva={totalTva}
            totalTtc={totalTtc}
            stampDutyAmount={stampDutyAmount}
            paymentMethod={paymentMethod}
            stampDutyConfig={stampDutyConfig}
            notes={notes}
            setNotes={setNotes}
            onAction={handleSubmit}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}