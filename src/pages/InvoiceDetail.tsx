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

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const invoice = useQuery(api.invoices.get, {
    id: id as Id<"invoices">,
  });
  const updateStatus = useMutation(api.invoices.updateStatus);

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

  const business = invoice.business;
  const isAE = business?.type === "auto_entrepreneur";

  // Calculate payment terms
  const issueDate = new Date(invoice.issueDate);
  const dueDate = new Date(invoice.dueDate);
  const diffTime = Math.abs(dueDate.getTime() - issueDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  let paymentTerms = "Payment on receipt";
  if (diffDays === 0) paymentTerms = "Immediate payment";
  else if (diffDays > 0) paymentTerms = `${diffDays} days`;

  // Design settings
  const primaryColor = business?.primaryColor || "#0f172a"; // Default to slate-900
  const secondaryColor = business?.secondaryColor || "#ffffff";
  const font = business?.font || "Inter";
  const logoUrl = business?.logoUrl;

  const handleStatusChange = async (status: "issued" | "paid" | "cancelled") => {
    try {
      await updateStatus({ id: invoice._id, status });
      toast.success(`Invoice marked as ${status}`);
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    }
  };

  // Fallback for legacy invoices
  const stampDuty = invoice.stampDutyAmount ?? (invoice.timbre ? 10 : 0);
  const subtotalHt = invoice.subtotalHt ?? invoice.totalHt ?? 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "issued": return "bg-blue-100 text-blue-700 border-blue-200";
      case "overdue": return "bg-red-100 text-red-700 border-red-200";
      case "cancelled": return "bg-gray-100 text-gray-700 border-gray-200";
      default: return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

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

      {/* Invoice Document */}
      <div className="w-full mx-auto print:w-full print:max-w-none">
        <div className="print-container bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100 w-full max-w-[210mm] mx-auto min-h-[297mm] relative flex flex-col"
             style={{ fontFamily: font }}>
          
          {/* Top Accent Line */}
          <div className="h-2 w-full print:hidden" style={{ backgroundColor: primaryColor }}></div>

          <div className="p-8 md:p-12 flex-grow flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                <div className="w-full md:w-1/2">
                    {logoUrl ? (
                        <img src={logoUrl} alt="Business Logo" className="h-20 object-contain mb-6" />
                    ) : (
                        <div className="h-20 flex items-center mb-6">
                            <h2 className="text-2xl font-bold uppercase tracking-tight" style={{ color: primaryColor }}>{business?.name}</h2>
                        </div>
                    )}
                    
                    <div className="text-sm text-gray-600 space-y-1">
                        <p className="font-semibold text-gray-900 text-base mb-1">{business?.name}</p>
                        {business?.tradeName && <p>{business.tradeName}</p>}
                        <p className="whitespace-pre-line">{business?.address}</p>
                        <p>{business?.city}, Algeria</p>
                        {business?.phone && <p>Tel: {business.phone}</p>}
                        {business?.email && <p>Email: {business.email}</p>}
                    </div>
                </div>

                <div className="w-full md:w-1/2 text-left md:text-right">
                    <div className="inline-block text-left md:text-right">
                        <h1 className="text-4xl font-light tracking-tight mb-2 uppercase text-gray-900">
                            {invoice.type === "quote" ? "Quote" : invoice.type === "credit_note" ? "Credit Note" : "Invoice"}
                        </h1>
                        <p className="text-lg font-medium text-gray-500 mb-6">#{invoice.invoiceNumber}</p>
                        
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-gray-600 text-left">
                            <div className="text-gray-400">Issue Date</div>
                            <div className="font-medium text-gray-900 text-right">{new Date(invoice.issueDate).toLocaleDateString('en-GB')}</div>
                            
                            <div className="text-gray-400">Due Date</div>
                            <div className="font-medium text-gray-900 text-right">{new Date(invoice.dueDate).toLocaleDateString('en-GB')}</div>
                            
                            {invoice.paymentMethod && (
                                <>
                                    <div className="text-gray-400">Payment</div>
                                    <div className="font-medium text-gray-900 text-right capitalize">{invoice.paymentMethod.replace('_', ' ').toLowerCase()}</div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Bill To Section */}
            <div className="flex flex-col md:flex-row gap-8 mb-12">
                <div className="w-full md:w-1/2">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Bill To</h3>
                    <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
                        <h2 className="font-bold text-lg text-gray-900 mb-1">{invoice.customer?.name}</h2>
                        {invoice.customer?.contactPerson && <p className="text-sm text-gray-600 mb-2">Attn: {invoice.customer.contactPerson}</p>}
                        
                        <div className="text-sm text-gray-600 space-y-1">
                            <p className="whitespace-pre-line">{invoice.customer?.address}</p>
                            <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                {invoice.customer?.taxId && <span>NIF: {invoice.customer.taxId}</span>}
                                {invoice.customer?.rc && <span>RC: {invoice.customer.rc}</span>}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Business Legal IDs (Compact) */}
                <div className="w-full md:w-1/2 md:text-right flex flex-col justify-end">
                     <div className="text-xs text-gray-400 space-y-1">
                        {isAE ? (
                            <>
                                <p>Auto-Entrepreneur Card: {business?.autoEntrepreneurCardNumber || "N/A"}</p>
                                <p>NIF: {business?.nif || "N/A"} | NIS: {business?.nis || "N/A"}</p>
                                <p>CASNOS: {business?.ssNumber || "N/A"}</p>
                            </>
                        ) : (
                            <>
                                <p>RC: {business?.rc || "N/A"}</p>
                                <p>NIF: {business?.nif || "N/A"} | NIS: {business?.nis || "N/A"}</p>
                                <p>AI: {business?.ai || "N/A"}</p>
                                {business?.capital && (
                                    <p>Capital: {business.capital.toLocaleString()} {business.currency}</p>
                                )}
                            </>
                        )}
                     </div>
                </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-gray-100">
                            <th className="text-left py-3 pl-4 font-semibold text-gray-900 bg-gray-50/50 rounded-l-lg">Description</th>
                            <th className="text-right py-3 font-semibold text-gray-900 bg-gray-50/50 w-24">Qty</th>
                            <th className="text-right py-3 font-semibold text-gray-900 bg-gray-50/50 w-32">Price</th>
                            {!isAE && <th className="text-right py-3 font-semibold text-gray-900 bg-gray-50/50 w-24">VAT</th>}
                            <th className="text-right py-3 pr-4 font-semibold text-gray-900 bg-gray-50/50 rounded-r-lg w-32">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {invoice.items?.map((item, index) => (
                            <tr key={index}>
                                <td className="py-4 pl-4 text-gray-900 font-medium">{item.description}</td>
                                <td className="py-4 text-right text-gray-600">{item.quantity}</td>
                                <td className="py-4 text-right text-gray-600">{item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                {!isAE && <td className="py-4 text-right text-gray-600">{item.tvaRate}%</td>}
                                <td className="py-4 pr-4 text-right text-gray-900 font-medium">{item.lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals & Notes */}
            <div className="flex flex-col md:flex-row gap-12 mb-12 print:break-inside-avoid">
                <div className="flex-1">
                    {invoice.notes && (
                        <div className="bg-yellow-50/50 border border-yellow-100 rounded-lg p-4 text-sm text-yellow-800">
                            <p className="font-semibold mb-1 text-yellow-900">Notes</p>
                            <p>{invoice.notes}</p>
                        </div>
                    )}
                </div>

                <div className="w-full md:w-80">
                    <div className="space-y-3">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Subtotal</span>
                            <span className="font-medium text-gray-900">{subtotalHt.toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                        </div>
                        {!isAE && (
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>VAT Total</span>
                                <span className="font-medium text-gray-900">{invoice.totalTva.toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                            </div>
                        )}
                        {stampDuty > 0 && (
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>Stamp Duty</span>
                                <span className="font-medium text-gray-900">{stampDuty.toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                            </div>
                        )}
                        
                        <Separator className="my-2" />
                        
                        <div className="flex justify-between items-end">
                            <span className="font-bold text-lg text-gray-900">Total</span>
                            <div className="text-right">
                                <span className="block font-bold text-2xl text-gray-900" style={{ color: primaryColor }}>
                                    {invoice.totalTtc.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-sm font-medium text-gray-500">{invoice.currency}</span>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Amount in Words */}
            <div className="mb-12 print:break-inside-avoid">
                <p className="text-sm text-gray-500 mb-1">Amount in words:</p>
                <p className="text-gray-900 font-medium italic border-l-4 pl-4 py-1" style={{ borderColor: primaryColor }}>
                    "{numberToWords(invoice.totalTtc)}"
                </p>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8 border-t border-gray-100 text-center text-xs text-gray-400 print:break-inside-avoid">
                <p className="mb-1">Invoice issued in accordance with Law 04-02 and Executive Decree 05-468 regarding commercial practices in Algeria.</p>
                {isAE ? (
                    <p>VAT not applicable – Auto-Entrepreneur (IFU).</p>
                ) : business?.fiscalRegime === "IFU" || business?.fiscalRegime === "forfaitaire" ? (
                    <p>VAT not applicable – Flat rate regime (IFU).</p>
                ) : null}
                <p className="mt-2">Thank you for your business.</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}