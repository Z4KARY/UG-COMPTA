import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Printer, CheckCircle, Send, XCircle } from "lucide-react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

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

  const handleStatusChange = async (status: "sent" | "paid" | "cancelled") => {
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
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="ghost" asChild>
          <Link to="/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
          </Link>
        </Button>
        <div className="flex gap-2">
          {invoice.status === "draft" && (
            <Button onClick={() => handleStatusChange("sent")} variant="outline">
              <Send className="mr-2 h-4 w-4" /> Issue Invoice
            </Button>
          )}
          {invoice.status === "sent" && (
            <Button onClick={() => handleStatusChange("paid")} variant="default">
              <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
            </Button>
          )}
          {(invoice.status === "draft" || invoice.status === "sent") && (
            <Button onClick={() => handleStatusChange("cancelled")} variant="destructive">
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
          )}
          <Button onClick={handlePrint} variant="secondary">
            <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      <div className="bg-white p-8 shadow-sm border rounded-lg max-w-4xl mx-auto print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary">INVOICE</h1>
            <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
            <div className="mt-2 text-sm">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    invoice.status === "paid" ? "bg-green-100 text-green-800" :
                    invoice.status === "sent" ? "bg-blue-100 text-blue-800" :
                    invoice.status === "cancelled" ? "bg-red-100 text-red-800" :
                    "bg-gray-100 text-gray-800"
                }`}>
                    {invoice.status.toUpperCase()}
                </span>
                {invoice.paymentMethod && <p className="mt-1 text-muted-foreground">Method: {invoice.paymentMethod}</p>}
            </div>
          </div>
          <div className="text-right">
            <h2 className="font-bold text-lg">{invoice.customer?.name}</h2>
            <p className="text-sm text-muted-foreground">
              {invoice.customer?.address}
            </p>
            <p className="text-sm text-muted-foreground">
              {invoice.customer?.email}
            </p>
            <p className="text-sm text-muted-foreground">
              {invoice.customer?.phone}
            </p>
            {invoice.customer?.taxId && (
                <p className="text-sm text-muted-foreground">
                    NIF: {invoice.customer.taxId}
                </p>
            )}
          </div>
        </div>

        {/* Dates */}
        <div className="flex justify-between mb-8 text-sm">
          <div>
            <p className="font-bold">Issue Date:</p>
            <p>{new Date(invoice.issueDate).toLocaleDateString()}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">Due Date:</p>
            <p>{new Date(invoice.dueDate).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Items */}
        <table className="w-full mb-8 text-sm">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2">Description</th>
              <th className="text-right py-2">Qty</th>
              <th className="text-right py-2">Price</th>
              <th className="text-right py-2">TVA</th>
              <th className="text-right py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-2">{item.description}</td>
                <td className="text-right py-2">{item.quantity}</td>
                <td className="text-right py-2">
                  {item.unitPrice.toLocaleString()}
                </td>
                <td className="text-right py-2">{item.tvaRate}%</td>
                <td className="text-right py-2">
                  {item.lineTotal.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end">
          <div className="w-64 space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Total HT:</span>
              <span>
                {subtotalHt.toLocaleString()} {invoice.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total TVA:</span>
              <span>
                {invoice.totalTva.toLocaleString()} {invoice.currency}
              </span>
            </div>
            {stampDuty > 0 && (
              <div className="flex justify-between">
                <span>Timbre Fiscal:</span>
                <span>{stampDuty.toLocaleString()} {invoice.currency}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2">
              <span>Total TTC:</span>
              <span>
                {invoice.totalTtc.toLocaleString()} {invoice.currency}
              </span>
            </div>
          </div>
        </div>

        {/* Notes */}
        {invoice.notes && (
          <div className="mt-8 pt-8 border-t text-sm text-muted-foreground">
            <p className="font-bold mb-1">Notes:</p>
            <p>{invoice.notes}</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}