import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useQuery } from "convex/react";
import { ArrowLeft, Printer } from "lucide-react";
import { Link, useParams } from "react-router";

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const invoice = useQuery(api.invoices.get, {
    id: id as Id<"invoices">,
  });

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

  // Calculate derived values for display
  // We need to reverse calculate some values if they aren't explicitly stored, 
  // but we stored totalTtc as the final amount.
  // The schema stores: totalHt, totalTva, totalTtc, timbre (bool), cashPenaltyPercentage (optional number)
  
  const timbreAmount = invoice.timbre ? 10 : 0;
  
  // If cash penalty exists, we can try to deduce the amount or just display the percentage.
  // totalTtc = totalHt + totalTva + timbre + cashPenalty
  // So cashPenalty = totalTtc - totalHt - totalTva - timbre
  const calculatedCashPenalty = invoice.totalTtc - invoice.totalHt - invoice.totalTva - timbreAmount;
  // Use a small epsilon for float comparison or just display if > 0.01
  const hasCashPenalty = calculatedCashPenalty > 0.01;

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="ghost" asChild>
          <Link to="/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
          </Link>
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
        </Button>
      </div>

      <div className="bg-white p-8 shadow-sm border rounded-lg max-w-4xl mx-auto print:shadow-none print:border-none print:w-full print:max-w-none">
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-2xl font-bold text-primary">INVOICE</h1>
            <p className="text-muted-foreground">{invoice.invoiceNumber}</p>
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
                {invoice.totalHt.toLocaleString()} {invoice.currency}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Total TVA:</span>
              <span>
                {invoice.totalTva.toLocaleString()} {invoice.currency}
              </span>
            </div>
            {invoice.timbre && (
              <div className="flex justify-between">
                <span>Timbre Fiscal:</span>
                <span>10.00 {invoice.currency}</span>
              </div>
            )}
            {hasCashPenalty && (
              <div className="flex justify-between text-muted-foreground">
                <span>Cash Penalty {invoice.cashPenaltyPercentage ? `(${invoice.cashPenaltyPercentage}%)` : ''}:</span>
                <span>{calculatedCashPenalty.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {invoice.currency}</span>
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