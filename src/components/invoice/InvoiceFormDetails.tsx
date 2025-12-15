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
import { useLanguage } from "@/contexts/LanguageContext";

interface InvoiceFormDetailsProps {
  issueDate: Date;
  dueDate: Date;
  currency: string;
  language?: string;
  paymentMethod?: string;
  onIssueDateChange: (date: Date | undefined) => void;
  onDueDateChange: (date: Date | undefined) => void;
  onCurrencyChange: (currency: string) => void;
  onLanguageChange?: (language: string) => void;
  onPaymentMethodChange?: (method: string) => void;
}

export function InvoiceFormDetails({
  issueDate,
  dueDate,
  currency,
  language = "fr",
  paymentMethod,
  onIssueDateChange,
  onDueDateChange,
  onCurrencyChange,
  onLanguageChange,
  onPaymentMethodChange,
}: InvoiceFormDetailsProps) {
  const { t } = useLanguage();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("invoiceForm.details.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2">
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