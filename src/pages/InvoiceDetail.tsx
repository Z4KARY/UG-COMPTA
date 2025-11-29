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
          <p>Loading...</p>
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
  const primaryColor = business?.primaryColor || "#000000";
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
          }
        `}
      </style>
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 print:hidden gap-4">
        <Button variant="ghost" asChild className="-ml-2 md:ml-0">
          <Link to="/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
          </Link>
        </Button>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {invoice.status === "draft" && (
            <Button onClick={() => handleStatusChange("issued")} variant="outline" className="flex-1 md:flex-none">
              <Send className="mr-2 h-4 w-4" /> Issue
            </Button>
          )}
          {invoice.status === "issued" && (
            <Button onClick={() => handleStatusChange("paid")} variant="default" className="flex-1 md:flex-none">
              <CheckCircle className="mr-2 h-4 w-4" /> Paid
            </Button>
          )}
          {(invoice.status === "draft" || invoice.status === "issued") && (
            <Button onClick={() => handleStatusChange("cancelled")} variant="destructive" className="flex-1 md:flex-none">
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
          )}
          <Button onClick={handlePrint} variant="secondary" className="flex-1 md:flex-none">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <div className="w-full mx-auto print:w-full print:max-w-none print:absolute print:top-0 print:left-0 print:m-0">
        <div className="bg-white p-4 sm:p-6 md:p-8 shadow-sm border rounded-lg w-full max-w-4xl mx-auto print:shadow-none print:border-none print:w-full print:max-w-none print:p-[15mm] print:m-0 print:min-h-screen"
             style={{ fontFamily: font }}>
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start mb-6 gap-6 print:flex-row print:mb-4 print:gap-0">
            <div className="w-full md:w-1/2 print:w-1/2">
              <h2 className="font-bold text-lg uppercase mb-1">{business?.name}</h2>
              {business?.tradeName && <p className="font-medium text-gray-700">{business.tradeName}</p>}
              <p className="text-sm text-muted-foreground whitespace-pre-line">{business?.address}</p>
              <p className="text-sm text-muted-foreground">{business?.city}, Algeria</p>
              
              <div className="mt-3 space-y-0.5 text-xs print:text-xs">
                  {isAE ? (
                      <>
                          <p className="font-medium">Auto-Entrepreneur Card: {business?.autoEntrepreneurCardNumber || "N/A"}</p>
                          <p className="text-muted-foreground">NIF: {business?.nif || "N/A"}</p>
                          <p className="text-muted-foreground">NIS: {business?.nis || "N/A"}</p>
                          <p className="text-muted-foreground">CASNOS: {business?.ssNumber || "N/A"}</p>
                      </>
                  ) : (
                      <>
                          <p className="text-muted-foreground"><span className="font-semibold">RC:</span> {business?.rc || "N/A"}</p>
                          <p className="text-muted-foreground"><span className="font-semibold">NIF:</span> {business?.nif || "N/A"}</p>
                          <p className="text-muted-foreground"><span className="font-semibold">NIS:</span> {business?.nis || "N/A"}</p>
                          <p className="text-muted-foreground"><span className="font-semibold">AI:</span> {business?.ai || "N/A"}</p>
                          {business?.capital && (
                              <p className="text-muted-foreground"><span className="font-semibold">Social Capital:</span> {business.capital.toLocaleString()} {business.currency}</p>
                          )}
                      </>
                  )}
              </div>
            </div>
            <div className="w-full md:w-1/2 text-left md:text-right print:w-1/2 print:text-right">
              {logoUrl && (
                <img src={logoUrl} alt="Business Logo" className="h-16 md:h-20 object-contain mb-2 md:ml-auto print:ml-auto" />
              )}
              <h1 className="text-2xl md:text-3xl font-bold uppercase" style={{ color: primaryColor }}>
                {invoice.type === "quote" ? "QUOTE" : invoice.type === "credit_note" ? "CREDIT NOTE" : "INVOICE"}
              </h1>
              <p className="text-lg md:text-xl font-medium text-gray-600">No. {invoice.invoiceNumber}</p>
              
              <div className="mt-3 text-sm md:text-right space-y-0.5 print:text-right">
                  <div className="flex md:justify-end gap-2 print:justify-end">
                      <span className="font-bold">Issue Date:</span>
                      <span>{new Date(invoice.issueDate).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="flex md:justify-end gap-2 print:justify-end">
                      <span className="font-bold">Due Date:</span>
                      <span>{new Date(invoice.dueDate).toLocaleDateString('en-GB')}</span>
                  </div>
                  <div className="flex md:justify-end gap-2 print:justify-end">
                      <span className="font-bold">Place of Issue:</span>
                      <span>{business?.city || "Algeria"}</span>
                  </div>
                  <div className="flex md:justify-end gap-2 print:justify-end">
                      <span className="font-bold">Payment Method:</span>
                      <span>{invoice.paymentMethod || "Not specified"}</span>
                  </div>
                  <div className="flex md:justify-end gap-2 print:justify-end">
                      <span className="font-bold">Terms:</span>
                      <span>{paymentTerms}</span>
                  </div>
              </div>
            </div>
          </div>

          <div className="border rounded-lg p-4 mb-6 bg-gray-50/50 print:mb-4 print:p-3">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Billed To (Client)</h3>
              <h2 className="font-bold text-lg mb-1">{invoice.customer?.name}</h2>
              {invoice.customer?.contactPerson && <p className="text-sm text-gray-600 mb-1">Attn: {invoice.customer.contactPerson}</p>}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
                  <div className="space-y-0.5">
                      <p className="text-muted-foreground whitespace-pre-line">{invoice.customer?.address}</p>
                      {invoice.customer?.phone && <p className="text-muted-foreground"><span className="font-semibold">Tel:</span> {invoice.customer.phone}</p>}
                      {invoice.customer?.email && <p className="text-muted-foreground"><span className="font-semibold">Email:</span> {invoice.customer.email}</p>}
                  </div>
                  <div className="space-y-0.5">
                      {invoice.customer?.taxId && (
                          <p className="text-muted-foreground"><span className="font-semibold">NIF:</span> {invoice.customer.taxId}</p>
                      )}
                      {invoice.customer?.rc && (
                          <p className="text-muted-foreground"><span className="font-semibold">RC:</span> {invoice.customer.rc}</p>
                      )}
                      {invoice.customer?.ai && (
                          <p className="text-muted-foreground"><span className="font-semibold">AI:</span> {invoice.customer.ai}</p>
                      )}
                      {invoice.customer?.nis && (
                          <p className="text-muted-foreground"><span className="font-semibold">NIS:</span> {invoice.customer.nis}</p>
                      )}
                  </div>
              </div>
          </div>

          {/* Items */}
          <div className="min-h-[100px] overflow-x-auto">
          <table className="w-full mb-6 text-sm print:mb-4">
            <thead>
              <tr className="border-b-2" style={{ borderColor: primaryColor }}>
                <th className="text-left py-2 pl-2" style={{ color: primaryColor }}>Description</th>
                <th className="text-right py-2" style={{ color: primaryColor }}>Qty</th>
                <th className="text-right py-2" style={{ color: primaryColor }}>Unit Price</th>
                {!isAE && <th className="text-right py-2" style={{ color: primaryColor }}>VAT</th>}
                <th className="text-right py-2 pr-2" style={{ color: primaryColor }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items?.map((item, index) => (
                <tr key={index} className="border-b border-gray-100">
                  <td className="py-2 pl-2 min-w-[150px]">{item.description}</td>
                  <td className="text-right py-2 whitespace-nowrap">{item.quantity}</td>
                  <td className="text-right py-2 whitespace-nowrap">
                    {item.unitPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  {!isAE && <td className="text-right py-2 whitespace-nowrap">{item.tvaRate}%</td>}
                  <td className="text-right py-2 pr-2 whitespace-nowrap">
                    {item.lineTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {/* Totals */}
          <div className="flex flex-col md:flex-row justify-between gap-8 mb-6 print:mb-4 print:break-inside-avoid print:flex-row">
              <div className="flex-1">
                  {invoice.notes && (
                    <div className="text-sm text-muted-foreground">
                      <p className="font-bold mb-1">Notes:</p>
                      <p>{invoice.notes}</p>
                    </div>
                  )}
              </div>

              <div className="w-full md:w-80 space-y-1 text-sm print:w-80">
                  <div className="flex justify-between py-1">
                  <span>Subtotal:</span>
                  <span className="font-medium">
                      {subtotalHt.toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency}
                  </span>
                  </div>
                  {!isAE && (
                  <div className="flex justify-between py-1">
                  <span>Total VAT:</span>
                  <span className="font-medium">
                      {invoice.totalTva.toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency}
                  </span>
                  </div>
                  )}
                  {stampDuty > 0 && (
                  <div className="flex justify-between py-1">
                      <span>Stamp Duty:</span>
                      <span className="font-medium">{stampDuty.toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                  </div>
                  )}
                  <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2 mt-1" style={{ color: primaryColor }}>
                  <span>Total:</span>
                  <span>
                      {invoice.totalTtc.toLocaleString('en-US', { minimumFractionDigits: 2 })} {invoice.currency}
                  </span>
                  </div>
              </div>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border mb-6 print:mb-4 print:break-inside-avoid">
              <p className="font-bold text-sm mb-1">This invoice is fixed at the sum of:</p>
              <p className="italic text-gray-700 font-medium">
                  "{numberToWords(invoice.totalTtc)}"
              </p>
          </div>

          {/* Legal Footer */}
          <div className="mt-8 pt-4 border-t text-center text-xs text-muted-foreground print:mt-6 print:break-inside-avoid">
              <p className="mb-1">Invoice issued in accordance with Law 04-02 and Executive Decree 05-468 regarding commercial practices in Algeria.</p>
              {isAE ? (
                  <p>VAT not applicable – Auto-Entrepreneur (IFU).</p>
              ) : business?.fiscalRegime === "IFU" || business?.fiscalRegime === "forfaitaire" ? (
                  <p>VAT not applicable – Flat rate regime (IFU).</p>
              ) : null}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}