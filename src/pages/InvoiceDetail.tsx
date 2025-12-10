import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Printer, CheckCircle, Send, XCircle } from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { numberToWords } from "@/lib/numberToWords";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useMemo } from "react";
import { InvoiceTranslationPanel } from "@/components/invoice/InvoiceTranslationPanel";
import { InvoiceDocument } from "@/components/invoice/InvoiceDocument";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const invoice = useQuery(api.invoices.get, {
    id: id as Id<"invoices">,
  });
  const updateStatus = useMutation(api.invoices.updateStatus);

  const handlePrint = () => {
    window.print();
  };

  const business = invoice?.business;
  const isAE = business?.type === "auto_entrepreneur";

  // Calculate payment terms
  let paymentTerms = "Payment on receipt";
  if (invoice) {
    const issueDate = new Date(invoice.issueDate);
    const dueDate = new Date(invoice.dueDate);
    const diffTime = Math.abs(dueDate.getTime() - issueDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) paymentTerms = "Immediate payment";
    else if (diffDays > 0) paymentTerms = `${diffDays} days`;
  }

  // Design settings
  const primaryColor = business?.primaryColor || "#0f172a"; // Default to slate-900
  const secondaryColor = business?.secondaryColor || "#ffffff";
  const font = business?.font || "Inter";
  const invoiceFontFamily = font.includes(" ")
    ? `"${font}", Inter, sans-serif`
    : `${font}, Inter, sans-serif`;
  const logoUrl = business?.logoUrl;

  const handleStatusChange = async (status: "issued" | "paid" | "cancelled") => {
    if (!invoice) return;
    try {
      await updateStatus({ id: invoice._id, status });
      toast.success(`Invoice marked as ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    }
  };

  // Fallback for legacy invoices
  const stampDuty = invoice?.stampDutyAmount ?? (invoice?.timbre ? 10 : 0);
  const subtotalHt = invoice?.subtotalHt ?? invoice?.totalHt ?? 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "issued": return "bg-blue-100 text-blue-700 border-blue-200";
      case "overdue": return "bg-red-100 text-red-700 border-red-200";
      case "cancelled": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const invoiceSummary = useMemo(() => {
    if (!invoice) return "";
    const lines: string[] = [];
    lines.push(
      `Invoice #${invoice.invoiceNumber ?? "N/A"} (${invoice.type}) - Status: ${
        invoice.status
      }`
    );
    lines.push(
      `Issue Date: ${new Date(
        invoice.issueDate
      ).toLocaleDateString("en-GB")} | Due Date: ${new Date(
        invoice.dueDate
      ).toLocaleDateString("en-GB")}`
    );
    lines.push(`Payment Terms: ${paymentTerms}`);
    lines.push(`Payment Method: ${invoice.paymentMethod ?? "Unspecified"}`);
    lines.push(`Currency: ${invoice.currency}`);
    if (business?.name) {
      lines.push(
        `Seller: ${business.name}, ${business.tradeName ?? ""}, ${
          business.address ?? ""
        }, ${business.city ?? ""}`
      );
      if (business.nif) lines.push(`Seller NIF: ${business.nif}`);
      if (business.rc) lines.push(`Seller RC: ${business.rc}`);
      if (business.ai) lines.push(`Seller AI: ${business.ai}`);
    }
    if (invoice.customer?.name) {
      lines.push(
        `Customer: ${invoice.customer.name}, ${
          invoice.customer.address ?? ""
        }`
      );
      if (invoice.customer.taxId)
        lines.push(`Customer NIF: ${invoice.customer.taxId}`);
      if (invoice.customer.rc)
        lines.push(`Customer RC: ${invoice.customer.rc}`);
    }
    invoice.items?.forEach((item, index) => {
      lines.push(
        `Item ${index + 1}: ${item.description} | Qty ${item.quantity} | Unit ${
          item.unitPrice
        } ${invoice.currency} | TVA ${item.tvaRate}% | Total ${
          item.lineTotal
        } ${invoice.currency}`
      );
    });
    lines.push(
      `Subtotal HT: ${subtotalHt.toFixed(2)} ${invoice.currency}`
    );
    if (!isAE) {
      lines.push(
        `VAT Total: ${(invoice.totalTva ?? 0).toFixed(2)} ${invoice.currency}`
      );
    }
    if (stampDuty > 0) {
      lines.push(
        `Stamp Duty: ${stampDuty.toFixed(2)} ${invoice.currency}`
      );
    }
    lines.push(
      `Grand Total TTC: ${invoice.totalTtc.toFixed(2)} ${invoice.currency}`
    );
    if (invoice.notes) {
      lines.push(`Notes: ${invoice.notes}`);
    }
    return lines.join("\n");
  }, [invoice, business, subtotalHt, stampDuty, isAE, paymentTerms]);

  if (!invoice) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full"></div>
            <div className="h-4 w-48 bg-gray-200 rounded"></div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout breadcrumbOverrides={{ [invoice._id]: invoice.invoiceNumber || "Draft" }}>
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; }
          @media print {
            .no-print { display: none !important; }
            .print-break-inside-avoid { break-inside: avoid; }
            html, body { width: 100%; height: 100%; margin: 0; padding: 0; overflow: visible; }
            .print-container { 
                box-shadow: none !important; 
                border: none !important; 
                margin: 0 !important; 
                width: 100% !important; 
                max-width: none !important;
                padding: 20mm !important;
            }
          }
        `}
      </style>
      
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 print:hidden gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="h-9">
            <Link to="/invoices">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Link>
            </Button>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${getStatusColor(invoice.status)}`}>
                {invoice.status}
            </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {invoice.status === "draft" && (
            <Button onClick={() => handleStatusChange("issued")} className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700">
              <Send className="mr-2 h-4 w-4" /> Issue Invoice
            </Button>
          )}
          {invoice.status === "issued" && (
            <Button onClick={() => handleStatusChange("paid")} className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700">
              <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
            </Button>
          )}
          {(invoice.status === "draft" || invoice.status === "issued") && (
            <Button onClick={() => handleStatusChange("cancelled")} variant="outline" className="flex-1 md:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
          )}
          <Button onClick={handlePrint} variant="secondary" className="flex-1 md:flex-none">
            <Printer className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </div>

      <InvoiceTranslationPanel
        invoiceId={invoice._id}
        currentLanguage={invoice.language || "fr"}
        items={invoice.items}
        notes={invoice.notes}
      />

      {/* Invoice Document */}
      <InvoiceDocument 
        invoice={invoice} 
        business={business} 
        items={invoice.items} 
        language={invoice.language} 
      />
    </DashboardLayout>
  );
}