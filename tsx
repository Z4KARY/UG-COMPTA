function AlertDialogPortal({
  ...props
}: React.ComponentProps<typeof AlertDialogPrimitive.Portal>) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

const confirmDelete = (id: Id<"invoices">) => {
  console.log("Confirm delete for invoice:", id);
  setInvoiceToDelete(id);
};