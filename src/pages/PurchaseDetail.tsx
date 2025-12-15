import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Printer, Trash2, CheckCircle, XCircle } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { numberToWords } from "@/lib/numberToWords";
import { Separator } from "@/components/ui/separator";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useState, useMemo } from "react";
import { PurchaseInvoiceDocument } from "@/components/invoice/PurchaseInvoiceDocument";

export default function PurchaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const invoice = useQuery(api.purchaseInvoices.get, {
    id: id as Id<"purchaseInvoices">,
  });
  const deletePurchase = useMutation(api.purchaseInvoices.remove);
  const markAsPaid = useMutation(api.purchaseInvoices.markAsPaid);
  const markAsUnpaid = useMutation(api.purchaseInvoices.markAsUnpaid);

  const [isPayDialogOpen, setIsPayDialogOpen] = useState(false);
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<"CASH" | "BANK_TRANSFER" | "CHEQUE" | "CARD" | "OTHER">("CASH");

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
    if (!invoice) return;
    if (confirm("Are you sure you want to delete this purchase invoice?")) {
      try {
        await deletePurchase({ id: invoice._id });
        toast.success("Purchase invoice deleted");
        navigate("/purchases");
      } catch (error) {
        toast.error("Failed to delete purchase invoice");
      }
    }
  };

  const handleMarkAsPaid = async () => {
    if (!invoice) return;
    try {
        await markAsPaid({
            id: invoice._id,
            paymentDate: new Date(paymentDate).getTime(),
            paymentMethod,
        });
        toast.success("Invoice marked as paid");
        setIsPayDialogOpen(false);
    } catch (error) {
        toast.error("Failed to mark as paid");
    }
  };

  const handleMarkAsUnpaid = async () => {
      if (!invoice) return;
      if (confirm("Are you sure you want to mark this invoice as unpaid?")) {
          try {
              await markAsUnpaid({ id: invoice._id });
              toast.success("Invoice marked as unpaid");
          } catch (error) {
              toast.error("Failed to mark as unpaid");
          }
      }
  };

  const business = invoice?.business;
  const supplier = invoice?.supplier;

  // Design settings (using business settings for consistency, though this is an incoming invoice)
  const primaryColor = business?.primaryColor || "#0f172a"; 
  const font = business?.font || "Inter";

  const status = invoice?.status || (invoice?.paymentDate ? "paid" : "unpaid");

  const purchaseSummary = useMemo(() => {
    if (!invoice) return "";
    const lines: string[] = [];
    const currency = business?.currency || "DZD";
    lines.push(
      `Purchase Invoice #${invoice.invoiceNumber ?? "N/A"} - Status: ${status}`
    );
    lines.push(
      `Invoice Date: ${new Date(
        invoice.invoiceDate
      ).toLocaleDateString("en-GB")}`
    );
    if (invoice.paymentDate) {
      lines.push(
        `Payment Date: ${new Date(
          invoice.paymentDate
        ).toLocaleDateString("en-GB")}`
      );
    }
    lines.push(`Payment Method: ${invoice.paymentMethod ?? "Unspecified"}`);
    if (supplier?.name) {
      lines.push(
        `Supplier: ${supplier.name}, ${supplier.address ?? ""}`
      );
      if (supplier.nif) lines.push(`Supplier NIF: ${supplier.nif}`);
      if (supplier.rc) lines.push(`Supplier RC: ${supplier.rc}`);
    }
    if (business?.name) {
      lines.push(
        `Buyer: ${business.name}, ${business.address ?? ""}`
      );
      if (business.nif) lines.push(`Buyer NIF: ${business.nif}`);
      if (business.rc) lines.push(`Buyer RC: ${business.rc}`);
    }
    invoice.items?.forEach((item, index) => {
      lines.push(
        `Line ${index + 1}: ${item.description} | Qty ${item.quantity} | Unit ${
          item.unitPrice
        } ${currency} | VAT ${item.vatRate}% | Total ${
          item.lineTotalTtc
        } ${currency}`
      );
    });
    lines.push(
      `Subtotal HT: ${invoice.subtotalHt.toFixed(2)} ${currency}`
    );
    lines.push(`VAT Total: ${invoice.vatTotal.toFixed(2)} ${currency}`);
    lines.push(`Grand Total TTC: ${invoice.totalTtc.toFixed(2)} ${currency}`);
    if (invoice.description) {
      lines.push(`Notes: ${invoice.description}`);
    }
    return lines.join("\n");
  }, [invoice, supplier, business, status]);

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
    <DashboardLayout breadcrumbOverrides={{ [invoice._id]: invoice.invoiceNumber || "Purchase" }}>
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; }
          @media print {
            .no-print { display: none !important; }
            .print-break-inside-avoid { break-inside: avoid; }
            html, body { width: 100%; height: auto; margin: 0; padding: 0; overflow: visible; }
            .print-container { 
                box-shadow: none !important; 
                border: none !important; 
                margin: 0 !important; 
                width: 100% !important; 
                max-width: 100% !important;
                padding: 20mm !important;
                min-height: auto !important;
                overflow: visible !important;
                border-radius: 0 !important;
            }
          }
        `}
      </style>
      
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 print:hidden gap-4">
        <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" asChild className="h-9">
            <Link to="/purchases">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Link>
            </Button>
            <div className={`px-3 py-1 rounded-full text-xs font-medium border capitalize ${
                status === "paid" 
                    ? "bg-emerald-100 text-emerald-700 border-emerald-200" 
                    : "bg-yellow-100 text-yellow-700 border-yellow-200"
            }`}>
                {status}
            </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {status === "unpaid" ? (
              <Dialog open={isPayDialogOpen} onOpenChange={setIsPayDialogOpen}>
                  <DialogTrigger asChild>
                      <Button className="flex-1 md:flex-none bg-emerald-600 hover:bg-emerald-700">
                          <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
                      </Button>
                  </DialogTrigger>
                  <DialogContent>
                      <DialogHeader>
                          <DialogTitle>Mark Invoice as Paid</DialogTitle>
                          <DialogDescription>
                              Enter the payment details for this purchase invoice.
                          </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                          <div className="grid gap-2">
                              <Label htmlFor="paymentDate">Payment Date</Label>
                              <Input
                                  id="paymentDate"
                                  type="date"
                                  value={paymentDate}
                                  onChange={(e) => setPaymentDate(e.target.value)}
                              />
                          </div>
                          <div className="grid gap-2">
                              <Label htmlFor="paymentMethod">Payment Method</Label>
                              <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                                  <SelectTrigger>
                                      <SelectValue placeholder="Select method" />
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
                      </div>
                      <DialogFooter>
                          <Button variant="outline" onClick={() => setIsPayDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleMarkAsPaid}>Confirm Payment</Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>
          ) : (
              <Button onClick={handleMarkAsUnpaid} variant="outline" className="flex-1 md:flex-none text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-200">
                  <XCircle className="mr-2 h-4 w-4" /> Mark as Unpaid
              </Button>
          )}

          <Button onClick={handleDelete} variant="outline" className="flex-1 md:flex-none text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
          <Button onClick={handlePrint} variant="secondary" className="flex-1 md:flex-none">
            <Printer className="mr-2 h-4 w-4" /> Print / PDF
          </Button>
        </div>
      </div>

      {/* Invoice Document */}
      <PurchaseInvoiceDocument 
        invoice={invoice} 
        business={business} 
        supplier={supplier} 
      />
    </DashboardLayout>
  );
}