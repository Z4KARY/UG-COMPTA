import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Info, Calculator } from "lucide-react";
import { useFormContext } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { calculateReverseStampDuty } from "@/convex/fiscal";
import { InvoiceItem } from "@/types/invoice";
import { useState, useEffect } from "react";

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
  language: string;
  setLanguage: (lang: string) => void;
  items: InvoiceItem[];
  setItems: (items: InvoiceItem[]) => void;
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
  onAction,
  language,
  setLanguage,
  items,
  setItems
}: InvoiceFormSummaryProps) {
  const form = useFormContext();
  const [targetTotal, setTargetTotal] = useState<string>("");

  // Sync target total input with actual total when it changes externally
  useEffect(() => {
    if (document.activeElement !== document.getElementById("target-total-input")) {
        setTargetTotal(totalTtc.toFixed(2));
    }
  }, [totalTtc]);

  const handleTargetTotalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetTotal(e.target.value);
  };

  const applyTargetTotal = () => {
    const target = parseFloat(targetTotal);
    if (isNaN(target) || target < 0) return;

    // 1. Calculate required Total TTC (before stamp)
    let requiredTtcBeforeStamp = target;
    if (paymentMethod === "CASH") {
        requiredTtcBeforeStamp = calculateReverseStampDuty(target, stampDutyConfig);
    }

    // 2. Calculate current Total TTC (before stamp)
    // We sum up the TTC of all items
    let currentTtcBeforeStamp = 0;
    items.forEach(item => {
        const basePrice = item.unitPrice * item.quantity;
        const discountAmount = basePrice * ((item.discountRate || 0) / 100);
        const ht = basePrice - discountAmount;
        const tva = ht * (item.tvaRate / 100);
        currentTtcBeforeStamp += (ht + tva);
    });

    // 3. Find difference
    const diff = requiredTtcBeforeStamp - currentTtcBeforeStamp;

    if (Math.abs(diff) < 0.01) return; // No change needed

    // 4. Adjust the first item (or create a new one if needed, but adjusting first is standard)
    if (items.length === 0) return;

    const newItems = [...items];
    const itemToAdjust = { ...newItems[0] };

    // Calculate current item TTC
    const itemBasePrice = itemToAdjust.unitPrice * itemToAdjust.quantity;
    const itemDiscount = itemBasePrice * ((itemToAdjust.discountRate || 0) / 100);
    const itemHt = itemBasePrice - itemDiscount;
    const itemTva = itemHt * (itemToAdjust.tvaRate / 100);
    const itemTtc = itemHt + itemTva;

    // New Item TTC
    const newItemTtc = itemTtc + diff;

    if (newItemTtc < 0) {
        // Cannot achieve target with this item (negative price)
        return;
    }

    // Reverse calculate Unit Price from New Item TTC
    // TTC = (UnitPrice * Qty * (1 - Disc)) * (1 + TVA)
    // UnitPrice = TTC / (Qty * (1 - Disc) * (1 + TVA))
    
    const tvaMultiplier = 1 + (itemToAdjust.tvaRate / 100);
    const discountMultiplier = 1 - ((itemToAdjust.discountRate || 0) / 100);
    const quantity = itemToAdjust.quantity || 1;

    if (quantity === 0) return;

    const newUnitPrice = newItemTtc / (quantity * discountMultiplier * tvaMultiplier);

    // Update item
    itemToAdjust.unitPrice = Math.round((newUnitPrice + Number.EPSILON) * 100) / 100;
    
    // Update line total for display (HT)
    const newBase = itemToAdjust.unitPrice * quantity;
    const newDisc = newBase * ((itemToAdjust.discountRate || 0) / 100);
    itemToAdjust.lineTotal = newBase - newDisc;

    newItems[0] = itemToAdjust;
    setItems(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        applyTargetTotal();
    }
  };

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

          <div className="border-t pt-4">
            <div className="flex justify-between font-bold text-lg items-center mb-2">
                <span>Total TTC</span>
                <span>
                {totalTtc.toFixed(2)} {business.currency}
                </span>
            </div>
            
            {/* Target Total Input */}
            <div className="flex items-center gap-2 mt-2">
                <div className="relative w-full">
                    <Calculator className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                        id="target-total-input"
                        value={targetTotal}
                        onChange={handleTargetTotalChange}
                        onBlur={applyTargetTotal}
                        onKeyDown={handleKeyDown}
                        className="pl-8"
                        placeholder="Set target total..."
                    />
                </div>
                <Button variant="outline" size="icon" onClick={applyTargetTotal} title="Calculate reverse">
                    <Calculator className="h-4 w-4" />
                </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
                Enter a target amount to reverse-calculate the unit price.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Language Selection */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Document Language</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={language} onValueChange={(val) => { setLanguage(val); form.setValue("language", val); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">Français</SelectItem>
              <SelectItem value="ar">العربية</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-2">
            This will determine the language of the generated invoice PDF.
          </p>
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