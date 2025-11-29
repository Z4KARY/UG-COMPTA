import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";

interface CustomerDialogProps {
  businessId: Id<"businesses">;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: any; // Using any for simplicity, but ideally should be Doc<"customers">
  onSuccess?: () => void;
}

export function CustomerDialog({ businessId, open, onOpenChange, customer, onSuccess }: CustomerDialogProps) {
  const createCustomer = useMutation(api.customers.create);
  const updateCustomer = useMutation(api.customers.update);
  
  // Fetch invoices if customer exists
  const invoices = useQuery(api.invoices.listByCustomer, 
    customer ? { businessId, customerId: customer._id } : "skip"
  );
  
  const [formData, setFormData] = useState({
    name: "",
    contactPerson: "",
    email: "",
    phone: "",
    address: "",
    taxId: "",
    rc: "",
    ai: "",
    nis: "",
    notes: "",
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        contactPerson: customer.contactPerson || "",
        email: customer.email || "",
        phone: customer.phone || "",
        address: customer.address || "",
        taxId: customer.taxId || "",
        rc: customer.rc || "",
        ai: customer.ai || "",
        nis: customer.nis || "",
        notes: customer.notes || "",
      });
    } else {
      setFormData({
        name: "",
        contactPerson: "",
        email: "",
        phone: "",
        address: "",
        taxId: "",
        rc: "",
        ai: "",
        nis: "",
        notes: "",
      });
    }
  }, [customer, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (customer) {
        await updateCustomer({
          id: customer._id,
          ...formData,
        });
        toast.success("Customer updated successfully");
      } else {
        await createCustomer({
          businessId,
          ...formData,
        });
        toast.success("Customer created successfully");
      }
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(customer ? "Failed to update customer" : "Failed to create customer");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{customer ? "Edit Customer" : "Add New Customer"}</DialogTitle>
          <DialogDescription>
            {customer ? "Update customer details and view history." : "Quickly add a new customer to your business."}
          </DialogDescription>
        </DialogHeader>

        {customer ? (
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="invoices">Invoices ({invoices?.length || 0})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="details">
              <form onSubmit={handleSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Company/Customer Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactPerson">Contact Person</Label>
                      <Input
                        id="contactPerson"
                        name="contactPerson"
                        value={formData.contactPerson}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="taxId">NIF (Tax ID)</Label>
                      <Input
                        id="taxId"
                        name="taxId"
                        value={formData.taxId}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rc">RC</Label>
                      <Input
                        id="rc"
                        name="rc"
                        value={formData.rc}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ai">AI (Article d'Imposition)</Label>
                      <Input
                        id="ai"
                        name="ai"
                        value={formData.ai}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="nis">NIS</Label>
                      <Input
                        id="nis"
                        name="nis"
                        value={formData.nis}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">Save Changes</Button>
                </DialogFooter>
              </form>
            </TabsContent>

            <TabsContent value="invoices">
              <div className="max-h-[400px] overflow-y-auto overflow-x-auto border rounded-md mt-4">
                <Table className="min-w-[400px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Number</TableHead>
                      <TableHead className="hidden sm:table-cell">Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices?.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No invoices found for this customer.
                        </TableCell>
                      </TableRow>
                    )}
                    {invoices?.map((invoice) => (
                      <TableRow key={invoice._id}>
                        <TableCell className="font-medium text-xs sm:text-sm whitespace-nowrap">{invoice.invoiceNumber}</TableCell>
                        <TableCell className="hidden sm:table-cell text-xs sm:text-sm whitespace-nowrap">{format(new Date(invoice.issueDate), "dd/MM/yyyy")}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] sm:text-xs font-medium capitalize
                            ${invoice.status === 'paid' ? 'bg-green-100 text-green-800' : 
                              invoice.status === 'overdue' ? 'bg-red-100 text-red-800' : 
                              'bg-gray-100 text-gray-800'}`}>
                            {invoice.status}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium text-xs sm:text-sm whitespace-nowrap">
                          {invoice.totalTtc.toLocaleString()} DZD
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company/Customer Name *</Label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactPerson">Contact Person</Label>
                  <Input
                    id="contactPerson"
                    name="contactPerson"
                    value={formData.contactPerson}
                    onChange={handleChange}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="taxId">NIF (Tax ID)</Label>
                  <Input
                    id="taxId"
                    name="taxId"
                    value={formData.taxId}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rc">RC</Label>
                  <Input
                    id="rc"
                    name="rc"
                    value={formData.rc}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ai">AI (Article d'Imposition)</Label>
                  <Input
                    id="ai"
                    name="ai"
                    value={formData.ai}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nis">NIS</Label>
                  <Input
                    id="nis"
                    name="nis"
                    value={formData.nis}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="submit">Create Customer</Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}