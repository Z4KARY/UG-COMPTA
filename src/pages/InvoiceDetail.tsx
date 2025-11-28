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
  
  let paymentTerms = "Paiement à réception";
  if (diffDays === 0) paymentTerms = "Paiement comptant";
  else if (diffDays > 0) paymentTerms = `${diffDays} jours`;

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
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6 print:hidden">
        <Button variant="ghost" asChild>
          <Link to="/invoices">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Invoices
          </Link>
        </Button>
        <div className="flex gap-2">
          {invoice.status === "draft" && (
            <Button onClick={() => handleStatusChange("issued")} variant="outline">
              <Send className="mr-2 h-4 w-4" /> Issue Invoice
            </Button>
          )}
          {invoice.status === "issued" && (
            <Button onClick={() => handleStatusChange("paid")} variant="default">
              <CheckCircle className="mr-2 h-4 w-4" /> Mark as Paid
            </Button>
          )}
          {(invoice.status === "draft" || invoice.status === "issued") && (
            <Button onClick={() => handleStatusChange("cancelled")} variant="destructive">
              <XCircle className="mr-2 h-4 w-4" /> Cancel
            </Button>
          )}
          <Button onClick={handlePrint} variant="secondary">
            <Printer className="mr-2 h-4 w-4" /> Print / Save PDF
          </Button>
        </div>
      </div>

      <div className="bg-white p-8 shadow-sm border rounded-lg max-w-4xl mx-auto print:shadow-none print:border-none print:w-full print:max-w-none"
           style={{ fontFamily: font }}>
        {/* Header */}
        <div className="flex justify-between items-start mb-8">
          <div className="w-1/2">
            <h2 className="font-bold text-lg uppercase mb-1">{business?.name}</h2>
            {business?.tradeName && <p className="font-medium text-gray-700">{business.tradeName}</p>}
            <p className="text-sm text-muted-foreground whitespace-pre-line">{business?.address}</p>
            <p className="text-sm text-muted-foreground">{business?.city}, Algérie</p>
            
            <div className="mt-4 space-y-0.5">
                {isAE ? (
                    <>
                        <p className="text-sm font-medium">Auto-Entrepreneur Card: {business?.autoEntrepreneurCardNumber || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">NIF: {business?.nif || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">NIS: {business?.nis || "N/A"}</p>
                        <p className="text-sm text-muted-foreground">CASNOS: {business?.ssNumber || "N/A"}</p>
                    </>
                ) : (
                    <>
                        <p className="text-sm text-muted-foreground"><span className="font-semibold">RC:</span> {business?.rc || "N/A"}</p>
                        <p className="text-sm text-muted-foreground"><span className="font-semibold">NIF:</span> {business?.nif || "N/A"}</p>
                        <p className="text-sm text-muted-foreground"><span className="font-semibold">NIS:</span> {business?.nis || "N/A"}</p>
                        <p className="text-sm text-muted-foreground"><span className="font-semibold">AI:</span> {business?.ai || "N/A"}</p>
                        {business?.capital && (
                            <p className="text-sm text-muted-foreground"><span className="font-semibold">Capital social:</span> {business.capital.toLocaleString()} {business.currency}</p>
                        )}
                    </>
                )}
            </div>
          </div>
          <div className="text-right w-1/2">
            {logoUrl && (
              <img src={logoUrl} alt="Business Logo" className="h-20 object-contain mb-4 ml-auto" />
            )}
            <h1 className="text-3xl font-bold uppercase" style={{ color: primaryColor }}>
              {invoice.type === "quote" ? "DEVIS" : invoice.type === "credit_note" ? "AVOIR" : "FACTURE"}
            </h1>
            <p className="text-xl font-medium text-gray-600">N° {invoice.invoiceNumber}</p>
            
            <div className="mt-4 text-sm text-right">
                <div className="flex justify-end gap-2 mb-1">
                    <span className="font-bold">Date d'émission:</span>
                    <span>{new Date(invoice.issueDate).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-end gap-2 mb-1">
                    <span className="font-bold">Date d'échéance:</span>
                    <span>{new Date(invoice.dueDate).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex justify-end gap-2 mb-1">
                    <span className="font-bold">Lieu d'émission:</span>
                    <span>{business?.city || "Algérie"}</span>
                </div>
                <div className="flex justify-end gap-2 mb-1">
                    <span className="font-bold">Mode de paiement:</span>
                    <span>{invoice.paymentMethod || "Non spécifié"}</span>
                </div>
                <div className="flex justify-end gap-2">
                    <span className="font-bold">Conditions:</span>
                    <span>{paymentTerms}</span>
                </div>
            </div>
          </div>
        </div>

        <div className="border rounded-lg p-6 mb-8 bg-gray-50/50">
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Facturé à (Client)</h3>
            <h2 className="font-bold text-xl mb-1">{invoice.customer?.name}</h2>
            {invoice.customer?.contactPerson && <p className="text-sm text-gray-600 mb-2">Attn: {invoice.customer.contactPerson}</p>}
            
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <p className="text-muted-foreground whitespace-pre-line">{invoice.customer?.address}</p>
                    <p className="text-muted-foreground">{invoice.customer?.phone}</p>
                    <p className="text-muted-foreground">{invoice.customer?.email}</p>
                </div>
                <div className="space-y-1">
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
        <table className="w-full mb-8 text-sm">
          <thead>
            <tr className="border-b-2" style={{ borderColor: primaryColor }}>
              <th className="text-left py-3 pl-2" style={{ color: primaryColor }}>Désignation</th>
              <th className="text-right py-3" style={{ color: primaryColor }}>Qté</th>
              <th className="text-right py-3" style={{ color: primaryColor }}>Prix Unit. HT</th>
              {!isAE && <th className="text-right py-3" style={{ color: primaryColor }}>TVA</th>}
              <th className="text-right py-3 pr-2" style={{ color: primaryColor }}>Total HT</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items?.map((item, index) => (
              <tr key={index} className="border-b border-gray-100">
                <td className="py-3 pl-2">{item.description}</td>
                <td className="text-right py-3">{item.quantity}</td>
                <td className="text-right py-3">
                  {item.unitPrice.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </td>
                {!isAE && <td className="text-right py-3">{item.tvaRate}%</td>}
                <td className="text-right py-3 pr-2">
                  {item.lineTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex flex-col md:flex-row justify-between gap-8 mb-8">
            <div className="flex-1">
                <div className="bg-gray-50 p-4 rounded-lg border">
                    <p className="font-bold text-sm mb-2">Arrêté la présente facture à la somme de :</p>
                    <p className="italic text-gray-700 font-medium">
                        "{numberToWords(invoice.totalTtc)}"
                    </p>
                </div>
                
                {invoice.notes && (
                  <div className="mt-4 text-sm text-muted-foreground">
                    <p className="font-bold mb-1">Notes:</p>
                    <p>{invoice.notes}</p>
                  </div>
                )}
            </div>

            <div className="w-full md:w-80 space-y-2 text-sm">
                <div className="flex justify-between py-1">
                <span>Total HT:</span>
                <span className="font-medium">
                    {subtotalHt.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {invoice.currency}
                </span>
                </div>
                {!isAE && (
                <div className="flex justify-between py-1">
                <span>Total TVA:</span>
                <span className="font-medium">
                    {invoice.totalTva.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {invoice.currency}
                </span>
                </div>
                )}
                {stampDuty > 0 && (
                <div className="flex justify-between py-1">
                    <span>Timbre Fiscal:</span>
                    <span className="font-medium">{stampDuty.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {invoice.currency}</span>
                </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-3 mt-2" style={{ color: primaryColor }}>
                <span>Total TTC:</span>
                <span>
                    {invoice.totalTtc.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} {invoice.currency}
                </span>
                </div>
            </div>
        </div>

        {/* Legal Footer */}
        <div className="mt-12 pt-6 border-t text-center text-xs text-muted-foreground">
            <p className="mb-1">Facture émise conformément à la loi 04-02 et au décret exécutif 05-468 relatifs aux pratiques commerciales en Algérie.</p>
            {isAE ? (
                <p>TVA non applicable – Auto-Entrepreneur (IFU).</p>
            ) : business?.fiscalRegime === "IFU" || business?.fiscalRegime === "forfaitaire" ? (
                <p>TVA non applicable – régime forfaitaire (IFU).</p>
            ) : null}
        </div>
      </div>
    </DashboardLayout>
  );
}