import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Info } from "lucide-react";
import { useFormContext } from "react-hook-form";

interface InvoiceFormSummaryProps {
  business: any;
  subtotalHt: number;
  totalTva: number;
  totalTtc: number;
  stampDutyAmount: number;
  paymentMethod: string;
  stampDutyConfig: any;
  notes: string;
  setNotes: (notes: string) => void;
  onAction: (status: "draft" | "issued") => void;
}

export function InvoiceFormSummary({
  business,
  subtotalHt,
  totalTva,
  totalTtc,
  stampDutyAmount,
  paymentMethod,
  stampDutyConfig,
  notes,
  setNotes,
  onAction
}: InvoiceFormSummaryProps) {
  const form = useFormContext();

  return (
    <div className="space-y-6">
      {/* Totals */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total {business?.type === "auto_entrepreneur" ? "" : "HT"}</span>
            <span>
              {subtotalHt.toFixed(2)} {business.currency}
            </span>
          </div>
          {business?.type !== "auto_entrepreneur" && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Total TVA</span>
            <span>
              {totalTva.toFixed(2)} {business.currency}
            </span>
          </div>
          )}
          
          {stampDutyAmount > 0 && (
            <div className="flex items-center justify-between text-sm pt-2 border-t text-orange-600">
              <div className="flex items-center gap-2">
                <Label>Timbre Fiscal (Cash)</Label>
              </div>
              <span>
                {stampDutyAmount.toFixed(2)} {business.currency}
              </span>
            </div>
          )}

          <div className="border-t pt-4 flex justify-between font-bold text-lg">
            <span>Total TTC</span>
            <span>
              {totalTtc.toFixed(2)} {business.currency}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Fiscal Alerts */}
      {paymentMethod === "CASH" && (
        <Alert className="bg-orange-50 border-orange-200">
          <Info className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800">Stamp Duty Applied</AlertTitle>
          <AlertDescription className="text-orange-700 text-xs">
            Cash payments are subject to stamp duty (Min {stampDutyConfig?.MIN_DUTY || 5} DA, Max {stampDutyConfig?.MAX_DUTY || 10000} DA).
            <br />
            Ref: Code du Timbre Art. 258.
          </AlertDescription>
        </Alert>
      )}
      
      {paymentMethod !== "CASH" && paymentMethod !== "OTHER" && (
         <Alert className="bg-green-50 border-green-200">
          <Info className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Stamp Duty Exempt</AlertTitle>
          <AlertDescription className="text-green-700 text-xs">
            Electronic payments (Cheque, Transfer, Card) are exempt from stamp duty.
            <br />
            Ref: Loi de Finances 2025, Art. 258 quinquies.
          </AlertDescription>
        </Alert>
      )}

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); form.setValue("notes", e.target.value); }}
              placeholder="Payment terms, notes, etc."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => onAction("draft")}>
                Save Draft
            </Button>
            <Button onClick={() => onAction("issued")}>
                Issue Invoice
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}