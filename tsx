import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Printer, CheckCircle, Send, XCircle } from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { InvoiceTranslationPanel } from "@/components/invoice/InvoiceTranslationPanel";
import { InvoiceDocument } from "@/components/invoice/InvoiceDocument";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const invoice = useQuery(api.invoices.get, {
    id: id as Id<"invoices">,
  });
  const updateStatus = useMutation(api.invoices.updateStatus);

  const handlePrint = () => {
    setTimeout(() => {
      window.print();
    }, 100);
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

  const invoiceSummary = useMemo(() => {
    // ... keep existing code
  }, [invoice, business, subtotalHt, stampDuty, isAE, paymentTerms]);

  return (
    <DashboardLayout breadcrumbOverrides={{ [invoice._id]: invoice.invoiceNumber || "Draft" }}>
      <style>
        {`
          @media print {
            @page { size: A4; margin: 0; }
            body { 
              visibility: hidden; 
              -webkit-print-color-adjust: exact;
            }
            .print-container { 
              visibility: visible;
              position: absolute;
              left: 0;
              top: 0;
              width: 100% !important;
              max-width: none !important;
              margin: 0 !important;
              padding: 20mm !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
            }
            .print-container * {
              visibility: visible;
            }
            /* Ensure no other elements interfere */
            nav, header, aside, .no-print { display: none !important; }
          }
        `}
      </style>
      
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 print:hidden gap-4">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => navigate(-1)} className="flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </Button>
          <Button onClick={handlePrint} className="flex items-center space-x-2">
            <Printer className="w-4 h-4" />
            <span>Print</span>
          </Button>
          <Button variant="destructive" onClick={handleDelete} className="flex items-center space-x-2">
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </Button>
        </div>
        <div className="flex items-center space-x-4">
          <Button onClick={() => setIsPayDialogOpen(true)} className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Mark as Paid</span>
          </Button>
          <Button variant="outline" onClick={handleMarkAsUnpaid} className="flex items-center space-x-2">
            <XCircle className="w-4 h-4" />
            <span>Mark as Unpaid</span>
          </Button>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="mb-12 print:break-inside-avoid">
        <p className="text-sm text-gray-500 mb-1">{labels.amountInWords}:</p>
        <p>
          "{numberToWords(invoice.totalTtc, lang)}"
        </p>
      </div>

      {/* Invoice Translation Panel */}
      <InvoiceTranslationPanel
        invoice={invoice}
        business={business}
        supplier={supplier}
        primaryColor={primaryColor}
        font={font}
        status={status}
        paymentDate={invoice?.paymentDate}
        paymentMethod={invoice?.paymentMethod}
        totalAmount={invoice?.totalAmount}
        dueAmount={invoice?.dueAmount}
        paymentHistory={invoice?.paymentHistory}
        onPaymentDateChange={setPaymentDate}
        onPaymentMethodChange={setPaymentMethod}
        onPaymentSubmit={handleMarkAsPaid}
        onPaymentCancel={() => setIsPayDialogOpen(false)}
        isPayDialogOpen={isPayDialogOpen}
      />

      {/* Invoice Document */}
      <InvoiceDocument
        invoice={invoice}
        business={business}
        supplier={supplier}
        primaryColor={primaryColor}
        font={font}
        status={status}
        paymentDate={invoice?.paymentDate}
        paymentMethod={invoice?.paymentMethod}
        totalAmount={invoice?.totalAmount}
        dueAmount={invoice?.dueAmount}
        paymentHistory={invoice?.paymentHistory}
        onPaymentDateChange={setPaymentDate}
        onPaymentMethodChange={setPaymentMethod}
        onPaymentSubmit={handleMarkAsPaid}
        onPaymentCancel={() => setIsPayDialogOpen(false)}
        isPayDialogOpen={isPayDialogOpen}
      />
    </DashboardLayout>
  );
}