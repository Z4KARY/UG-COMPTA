import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
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
import { useLanguage } from "@/contexts/LanguageContext";

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

// Moved schema inside component to use translations or defined with custom error map if needed.
// For now, we will define it here but use the t function in the component to get messages.
// Actually, to use t() in z.object, we need to create the schema inside the component or pass t to a schema creator.

type FormValues = {
  invoiceNumber?: string;
  issueDate: Date;
  dueDate: Date;
  items: any[];
  notes?: string;
  currency?: string;
  type: "invoice" | "quote" | "credit_note" | "pro_forma" | "delivery_note" | "sale_order";
  fiscalType?: "LOCAL" | "EXPORT" | "EXEMPT";
  paymentMethod: "CASH" | "BANK_TRANSFER" | "CHEQUE" | "CARD" | "OTHER";
  customerId: string;
};

export default function InvoiceCreate() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const formSchema = z.object({
    invoiceNumber: z.string().optional(),
    issueDate: z.date(),
    dueDate: z.date(),
    items: z.array(z.object({
      productId: z.string().optional(),
      description: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      discountRate: z.number().min(0).max(100).optional(),
      tvaRate: z.number(),
      lineTotal: z.number(),
      productType: z.enum(["goods", "service"]).optional(),
    })).min(1, t("validation.items.empty") || "Invoice must have at least one item"),
    notes: z.string().optional(),
    currency: z.string().optional(),
    type: z.enum(["invoice", "quote", "credit_note", "pro_forma", "delivery_note", "sale_order"]),
    fiscalType: z.enum(["LOCAL", "EXPORT", "EXEMPT"]).optional(),
    paymentMethod: z.enum(["CASH", "BANK_TRANSFER", "CHEQUE", "CARD", "OTHER"]),
    customerId: z.string().min(1, t("validation.customer.invalid") || "Customer is required"),
  });

  const business = useQuery(api.businesses.getMyBusiness, {});
  
  // Fetch existing invoice if in edit mode
  const existingInvoice = useQuery(api.invoices.get, id ? { id: id as Id<"invoices"> } : "skip");

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
  const updateInvoice = useMutation(api.invoices.update);

  const [submitStatus, setSubmitStatus] = useState<"draft" | "issued">("draft");
  const [ipAddress, setIpAddress] = useState<string | undefined>(undefined);

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then(response => response.json())
      .then(data => setIpAddress(data.ip))
      .catch(error => console.error("Failed to fetch IP:", error));
  }, []);

  const [formData, setFormData] = useState({
    customerId: "",
    type: "invoice" as "invoice" | "quote" | "credit_note" | "pro_forma" | "delivery_note" | "sale_order",
    fiscalType: "LOCAL" as "LOCAL" | "EXPORT" | "EXEMPT",
    language: "fr", // Default language
    issueDate: new Date(),
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 days
    currency: "DZD",
    items: [] as any[],
    notes: "",
    paymentMethod: "BANK_TRANSFER" as any,
    invoiceNumber: "AUTO",
    isAutoNumber: true,
  });

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

  // Populate form when existing invoice loads
  useEffect(() => {
    if (existingInvoice && isEditMode) {
      // Set form values
      form.reset({
        invoiceNumber: existingInvoice.invoiceNumber,
        issueDate: new Date(existingInvoice.issueDate),
        dueDate: new Date(existingInvoice.dueDate),
        items: existingInvoice.items.map((item: any) => ({
          productId: item.productId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discountRate: item.discountRate || 0,
          tvaRate: item.tvaRate,
          lineTotal: item.lineTotal,
          productType: item.productType || "service",
        })),
        notes: existingInvoice.notes || "",
        currency: existingInvoice.currency,
        type: existingInvoice.type as any,
        fiscalType: existingInvoice.fiscalType as any || "LOCAL",
        paymentMethod: existingInvoice.paymentMethod as any || "CASH",
        customerId: existingInvoice.customerId,
      });

      // Set state values
      setFormData({
        customerId: existingInvoice.customerId,
        type: existingInvoice.type as any,
        fiscalType: existingInvoice.fiscalType as any || "LOCAL",
        language: existingInvoice.language || "fr",
        issueDate: new Date(existingInvoice.issueDate),
        dueDate: new Date(existingInvoice.dueDate),
        currency: existingInvoice.currency,
        items: existingInvoice.items,
        notes: existingInvoice.notes || "1",
        paymentMethod: existingInvoice.paymentMethod as any || "CASH",
        invoiceNumber: existingInvoice.invoiceNumber,
        isAutoNumber: false, // Always manual/fixed when editing
      });

      setItems(existingInvoice.items.map((item: any) => ({
        productId: item.productId,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountRate: item.discountRate || 0,
        tvaRate: item.tvaRate,
        lineTotal: item.lineTotal,
        productType: item.productType || "service",
      })));
      
      setNotes(existingInvoice.notes || "");
      setSubmitStatus(existingInvoice.status as "draft" | "issued");
    }
  }, [existingInvoice, isEditMode, form]);

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

  // Update default TVA when business loads (only for new invoices)
  useEffect(() => {
    if (!isEditMode && business && items.length === 1 && items[0].description === "" && items[0].unitPrice === 0) {
        const defaultTva = (business.fiscalRegime === "IFU" || business.type === "auto_entrepreneur") ? 0 : (business.tvaDefault || 19);
        setItems([{ ...items[0], tvaRate: defaultTva }]);
    }
  }, [business, isEditMode]);

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
      const invoiceData = {
        businessId: business._id,
        customerId: values.customerId as Id<"customers">,
        invoiceNumber: formData.isAutoNumber ? "AUTO" : formData.invoiceNumber,
        type: formData.type,
        fiscalType: formData.fiscalType,
        language: formData.language,
        issueDate: formData.issueDate.getTime(),
        dueDate: formData.dueDate.getTime(),
        currency: formData.currency,
        status: submitStatus === "draft" ? "draft" : "issued",
        notes: values.notes ? values.notes : null,
        paymentMethod: values.paymentMethod,
        subtotalHt,
        totalHt: subtotalHt, // Legacy support
        totalTva,
        stampDutyAmount,
        totalTtc,
        items: items.map(item => ({
            ...item,
            productId: (item.productId && item.productId !== "") ? item.productId as Id<"products"> : undefined,
            lineTotalHt: item.lineTotal,
            lineTotalTtc: item.lineTotal * (1 + item.tvaRate/100)
        })),
        userAgent: navigator.userAgent,
        ipAddress: ipAddress,
      };

      if (isEditMode && id) {
        await updateInvoice({
          id: id as Id<"invoices">,
          ...invoiceData,
          status: submitStatus === "draft" ? "draft" : "issued", // Ensure status is passed correctly
        });
        toast.success(t("invoiceCreate.success.updated") || "Invoice updated successfully");
      } else {
        await createInvoice(invoiceData as any);
        toast.success(submitStatus === 'draft' ? t("invoiceCreate.success.draft") : t("invoiceCreate.success.issued"));
      }

      navigate("/invoices");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : (isEditMode ? "Failed to update invoice" : t("invoiceCreate.error.create")));
    }
  }

  const handleSubmit = (status: "draft" | "issued") => {
    setSubmitStatus(status);
    form.handleSubmit(onSubmit)();
  };

  if (!business) return null;
  if (isEditMode && !existingInvoice) return <DashboardLayout><div>Loading...</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
        <h1 className="text-3xl font-bold tracking-tight">
            {isEditMode ? "Edit Invoice" : (
              type === "quote" ? t("invoiceCreate.title.quote") : 
              type === "credit_note" ? t("invoiceCreate.title.creditNote") : 
              type === "pro_forma" ? t("invoiceCreate.title.proForma") :
              type === "delivery_note" ? t("invoiceCreate.title.deliveryNote") :
              type === "sale_order" ? t("invoiceCreate.title.saleOrder") :
              t("invoiceCreate.title.invoice")
            )}
        </h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <InvoiceFormDetails
              type={type}
              issueDate={formData.issueDate}
              dueDate={formData.dueDate}
              currency={formData.currency}
              language={formData.language}
              paymentMethod={paymentMethod}
              invoiceNumber={formData.invoiceNumber}
              isAutoNumber={formData.isAutoNumber}
              onTypeChange={(val) => {
                form.setValue("type", val as any);
                setFormData({ ...formData, type: val as any });
              }}
              onIssueDateChange={(date) =>
                setFormData({ ...formData, issueDate: date || new Date() })
              }
              onDueDateChange={(date) =>
                setFormData({ ...formData, dueDate: date || new Date() })
              }
              onCurrencyChange={(currency) =>
                setFormData({ ...formData, currency })
              }
              onLanguageChange={(language) =>
                setFormData({ ...formData, language })
              }
              onPaymentMethodChange={(method) => 
                form.setValue("paymentMethod", method as any)
              }
              onInvoiceNumberChange={(number) =>
                setFormData({ ...formData, invoiceNumber: number })
              }
              onAutoNumberChange={(isAuto) =>
                setFormData({ ...formData, isAutoNumber: isAuto, invoiceNumber: isAuto ? "AUTO" : "" })
              }
            />

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
              <CardTitle className="text-sm font-medium text-muted-foreground">{t("invoiceCreate.businessInfo")}</CardTitle>
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
            language={formData.language}
            setLanguage={(lang) => setFormData({ ...formData, language: lang })}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}