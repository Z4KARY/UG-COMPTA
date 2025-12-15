import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreateCustomerDialog } from "@/components/CreateCustomerDialog";
import { useFormContext } from "react-hook-form";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/contexts/LanguageContext";

interface InvoiceFormCustomerProps {
  customers: any[];
  businessId: Id<"businesses">;
  onCustomerSelect: (id: string) => void;
}

export function InvoiceFormCustomer({ customers, businessId, onCustomerSelect }: InvoiceFormCustomerProps) {
  const form = useFormContext();
  const { t } = useLanguage();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("invoiceForm.customer.title")}</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="customerId"
          render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>{t("invoiceForm.customer.title")}</FormLabel>
              <div className="flex gap-2">
                <Select 
                  value={field.value} 
                  onValueChange={(val) => { 
                    field.onChange(val); 
                    onCustomerSelect(val); 
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("invoiceForm.customer.select")} />
                  </SelectTrigger>
                  <SelectContent>
                    {customers?.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <CreateCustomerDialog 
                    businessId={businessId} 
                    onCustomerCreated={(id) => { 
                      onCustomerSelect(id); 
                      field.onChange(id); 
                    }}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </CardContent>
    </Card>
  );
}
