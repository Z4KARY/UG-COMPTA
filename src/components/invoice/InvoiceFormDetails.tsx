import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";

interface InvoiceFormDetailsProps {
  type: string;
  issueDate: Date;
  dueDate: Date;
  currency: string;
  language?: string;
  paymentMethod?: string;
  invoiceNumber?: string;
  isAutoNumber?: boolean;
  onTypeChange: (type: string) => void;
  onIssueDateChange: (date: Date | undefined) => void;
  onDueDateChange: (date: Date | undefined) => void;
  onCurrencyChange: (currency: string) => void;
  onLanguageChange?: (language: string) => void;
  onPaymentMethodChange?: (method: string) => void;
  onInvoiceNumberChange?: (number: string) => void;
  onAutoNumberChange?: (isAuto: boolean) => void;
}

export function InvoiceFormDetails({
  type,
  issueDate,
  dueDate,
  currency,
  language = "fr",
  paymentMethod,
  invoiceNumber,
  isAutoNumber = true,
  onTypeChange,
  onIssueDateChange,
  onDueDateChange,
  onCurrencyChange,
  onLanguageChange,
  onPaymentMethodChange,
  onInvoiceNumberChange,
  onAutoNumberChange,
}: InvoiceFormDetailsProps) {
  const { t } = useLanguage();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("invoiceForm.details.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2 col-span-2 md:col-span-2">
          <Label>{t("invoiceForm.details.type") || "Document Type"}</Label>
          <Select value={type} onValueChange={onTypeChange}>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="invoice">{t("invoiceForm.type.invoice") || "Invoice"}</SelectItem>
              <SelectItem value="quote">{t("invoiceForm.type.quote") || "Quote"}</SelectItem>
              <SelectItem value="credit_note">{t("invoiceForm.type.creditNote") || "Credit Note"}</SelectItem>
              <SelectItem value="pro_forma">{t("invoiceForm.type.proForma") || "Pro Forma"}</SelectItem>
              <SelectItem value="delivery_note">{t("invoiceForm.type.deliveryNote") || "Delivery Note"}</SelectItem>
              <SelectItem value="sale_order">{t("invoiceForm.type.saleOrder") || "Sale Order"}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 col-span-2 md:col-span-2">
          <div className="flex items-center justify-between">
            <Label>{t("invoiceForm.details.invoiceNumber")}</Label>
            <div className="flex items-center space-x-2">
              <Label htmlFor="auto-mode" className="text-sm font-normal text-muted-foreground">
                {isAutoNumber ? t("invoiceForm.details.autoNumber") : t("invoiceForm.details.manualNumber")}
              </Label>
              <Switch
                id="auto-mode"
                checked={isAutoNumber}
                onCheckedChange={onAutoNumberChange}
              />
            </div>
          </div>
          <Input
            value={isAutoNumber ? "AUTO" : invoiceNumber}
            onChange={(e) => onInvoiceNumberChange?.(e.target.value)}
            disabled={isAutoNumber}
            placeholder={t("invoiceForm.details.numberPlaceholder")}
            className={isAutoNumber ? "bg-muted text-muted-foreground font-mono" : "font-mono"}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("invoiceForm.details.issueDate")}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !issueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {issueDate ? format(issueDate, "PPP") : <span>{t("invoiceForm.details.pickDate")}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={issueDate}
                onSelect={onIssueDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>{t("invoiceForm.details.dueDate")}</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dueDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {dueDate ? format(dueDate, "PPP") : <span>{t("invoiceForm.details.pickDate")}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={dueDate}
                onSelect={onDueDateChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>{t("invoiceForm.details.currency")}</Label>
          <Select value={currency} onValueChange={onCurrencyChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("invoiceForm.details.selectCurrency")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="DZD">{t("invoiceForm.currency.dzd")}</SelectItem>
              <SelectItem value="EUR">{t("invoiceForm.currency.eur")}</SelectItem>
              <SelectItem value="USD">{t("invoiceForm.currency.usd")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("invoiceForm.details.paymentMethod")}</Label>
          <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("invoiceForm.details.selectPayment")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CASH">{t("invoiceForm.payment.cash")}</SelectItem>
              <SelectItem value="BANK_TRANSFER">{t("invoiceForm.payment.bankTransfer")}</SelectItem>
              <SelectItem value="CHEQUE">{t("invoiceForm.payment.cheque")}</SelectItem>
              <SelectItem value="CARD">{t("invoiceForm.payment.card")}</SelectItem>
              <SelectItem value="OTHER">{t("invoiceForm.payment.other")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("invoiceForm.details.language")}</Label>
          <Select value={language} onValueChange={onLanguageChange}>
            <SelectTrigger>
              <SelectValue placeholder={t("invoiceForm.details.selectLanguage")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fr">{t("invoiceForm.language.fr")}</SelectItem>
              <SelectItem value="ar">{t("invoiceForm.language.ar")}</SelectItem>
              <SelectItem value="en">{t("invoiceForm.language.en")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}