import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Printer, CheckCircle, Send, XCircle, Pencil } from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import { useEffect } from "react";
import { InvoiceTranslationPanel } from "@/components/invoice/InvoiceTranslationPanel";
import { InvoiceDocument } from "@/components/invoice/InvoiceDocument";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const invoice = useQuery(api.invoices.get, {
    id: id as Id<"invoices">,
  });
  const updateStatus = useMutation(api.invoices.updateStatus);

  useEffect(() => {
    if (invoice) {
      const clientName = invoice.customer?.name || "Client";
      const invoiceNum = invoice.invoiceNumber || "Draft";
      document.title = `UGCOMPTA - ${clientName} - ${invoiceNum}`;
    }
    return () => {
      document.title = "UGCOMPTA";
    };
  }, [invoice]);

  const handlePrint = () => {
    window.print();
  };

  const business = invoice?.business;

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
          {invoice.status === "draft" && (
            <Button variant="outline" asChild className="flex-1 md:flex-none">
              <Link to={`/invoices/${invoice._id}/edit`}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Link>
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