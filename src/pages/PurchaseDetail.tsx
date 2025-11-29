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
import { useState } from "react";

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

  const handlePrint = () => {
    window.print();
  };

  const handleDelete = async () => {
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
      if (confirm("Are you sure you want to mark this invoice as unpaid?")) {
          try {
              await markAsUnpaid({ id: invoice._id });
              toast.success("Invoice marked as unpaid");
          } catch (error) {
              toast.error("Failed to mark as unpaid");
          }
      }
  };

  const business = invoice.business;
  const supplier = invoice.supplier;

  // Design settings (using business settings for consistency, though this is an incoming invoice)
  const primaryColor = business?.primaryColor || "#0f172a"; 
  const font = business?.font || "Inter";

  const status = invoice.status || (invoice.paymentDate ? "paid" : "unpaid");

  return (
    <DashboardLayout breadcrumbOverrides={{ [invoice._id]: invoice.invoiceNumber || "Purchase" }}>
      <style type="text/css" media="print">
        {`
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; }
          @media print {
            .no-print { display: none !important; }
            .print-break-inside-avoid { break-inside: avoid; }
            html, body { width: 210mm; height: 297mm; margin: 0; padding: 0; }
            .print-container { 
                box-shadow: none !important; 
                border: none !important; 
                margin: 0 !important; 
                width: 100% !important; 
                max-width: 100% !important;
                padding: 10mm !important;
                min-height: 100% !important;
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
      <div className="w-full mx-auto print:w-full print:max-w-none">
        <div className="print-container bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100 w-full max-w-[210mm] mx-auto min-h-[297mm] relative flex flex-col"
             style={{ fontFamily: font }}>
          
          {/* Top Accent Line */}
          <div className="h-2 w-full print:hidden" style={{ backgroundColor: primaryColor }}></div>

          <div className="p-8 md:p-12 print:p-0 flex-grow flex flex-col">
            {/* Header - Supplier Info (Issuer) */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12 print:mb-6 print:gap-4">
                <div className="w-full md:w-1/2">
                    <div className="h-20 flex items-center mb-6">
                        <h2 className="text-2xl font-bold uppercase tracking-tight text-gray-900">{supplier?.name || "Unknown Supplier"}</h2>
                    </div>
                    
                    <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-semibold text-gray-900 text-base mb-1">{supplier?.name}</p>
                        <p className="whitespace-pre-line">{supplier?.address}</p>
                        {supplier?.phone && <p>Tel: {supplier.phone}</p>}
                        {supplier?.email && <p>Email: {supplier.email}</p>}
                        <div className="flex gap-4 mt-2 text-xs text-gray-500">
                            {supplier?.nif && <span>NIF: {supplier.nif}</span>}
                            {supplier?.rc && <span>RC: {supplier.rc}</span>}
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-1/2 text-left md:text-right">
                    <div className="inline-block text-left md:text-right">
                        <h1 className="text-4xl font-light tracking-tight mb-2 uppercase text-gray-900">
                            Purchase Invoice
                        </h1>
                        <p className="text-lg font-medium text-gray-500 mb-6">#{invoice.invoiceNumber}</p>
                        
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600 text-left">
                            <div className="text-gray-400">Invoice Date</div>
                            <div className="font-medium text-gray-900 text-right">{new Date(invoice.invoiceDate).toLocaleDateString('en-GB')}</div>
                            
                            {invoice.paymentDate && (
                                <>
                                    <div className="text-gray-400">Payment Date</div>
                                    <div className="font-medium text-gray-900 text-right">{new Date(invoice.paymentDate).toLocaleDateString('en-GB')}</div>
                                </>
                            )}
                            
                            {invoice.paymentMethod && (
                                <>
                                    <div className="text-gray-400">Payment Method</div>
                                    <div className="font-medium text-gray-900 text-right capitalize">{invoice.paymentMethod.replace('_', ' ').toLowerCase()}</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bill To Section (My Business) */}
            <div className="flex flex-col md:flex-row gap-8 mb-12 print:mb-6">
                <div className="w-full md:w-1/2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h3>
                    <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
                        <h2 className="font-bold text-lg text-gray-900 mb-1">{business?.name}</h2>
                        {business?.tradeName && <p className="text-sm text-gray-600 mb-2">{business.tradeName}</p>}
                        
                        <div className="text-sm text-gray-600 space-y-1">
                            <p className="whitespace-pre-line">{business?.address}</p>
                            <p>{business?.city}, Algeria</p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                {business?.nif && <span>NIF: {business.nif}</span>}
                                {business?.rc && <span>RC: {business.rc}</span>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8 print:mb-4">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-gray-100">
                            <th className="text-left py-3 pl-4 font-semibold text-gray-900 bg-gray-50/50 rounded-l-lg">Description</th>
                            <th className="text-right py-3 font-semibold text-gray-900 bg-gray-50/50 w-24">Qty</th>
                            <th className="text-right py-3 font-semibold text-gray-900 bg-gray-50/50 w-32">Price</th>
                            <th className="text-right py-3 font-semibold text-gray-900 bg-gray-50/50 w-24">VAT</th>
                            <th className="text-right py-3 pr-4 font-semibold text-gray-900 bg-gray-50/50 rounded-r-lg w-32">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {invoice.items?.map((item, index) => (
                            <tr key={index}>
                                <td className="py-4 pl-4 text-gray-900 font-medium">{item.description}</td>
                                <td className="py-4 text-right text-gray-600">{item.quantity}</td>
                                <td className="py-4 text-right text-gray-600">{item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td className="py-4 text-right text-gray-600">{item.vatRate}%</td>
                                <td className="py-4 pr-4 text-right text-gray-900 font-medium">{item.lineTotalTtc.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals & Notes */}
            <div className="flex flex-col md:flex-row gap-12 mb-12 print:mb-6 print:break-inside-avoid">
                <div className="flex-1">
                    {invoice.description && (
                        <div className="bg-gray-50/50 border border-gray-100 rounded-lg p-4 text-sm text-gray-600">
                            <p className="font-semibold mb-1 text-gray-900">Description / Notes</p>
                            <p>{invoice.description}</p>
                        </div>
                    )}
                </div>

                <div className="w-full md:w-80">
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal HT</span>
                            <span className="font-medium text-gray-900">{invoice.subtotalHt.toLocaleString('en-US', { minimumFractionDigits: 2 })} DZD</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>VAT Total</span>
                            <span className="font-medium text-gray-900">{invoice.vatTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })} DZD</span>
                        </div>
                        
                        <Separator className="my-2" />
                        
                        <div className="flex justify-between items-end">
                            <span className="font-bold text-lg text-gray-900">Total TTC</span>
                            <div className="text-right">
                                <span className="block font-bold text-2xl text-gray-900" style={{ color: primaryColor }}>
                                    {invoice.totalTtc.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm font-medium text-gray-500">DZD</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Amount in Words */}
            <div className="mb-12 print:mb-0 print:break-inside-avoid">
                <p className="text-sm text-gray-500 mb-1">Amount in words:</p>
                <p className="text-gray-900 font-medium italic border-l-4 pl-4 py-1" style={{ borderColor: primaryColor }}>
                    "{numberToWords(invoice.totalTtc)}"
                </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}