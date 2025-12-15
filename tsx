interface PurchaseInvoiceDocumentProps {
  invoice: any;
  business: any;
  supplier: any;
}

const purchaseSummary = useMemo(() => {
  // ...
}, [invoice.invoiceDate, supplier, business, status]);

{invoice.items?.map((item, index) => (

{new Date(invoice.invoiceDate).toLocaleDateString("en-GB")}
</initial_code>