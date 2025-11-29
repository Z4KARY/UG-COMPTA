import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ImportDialog } from "@/components/ImportDialog";
import { CustomerDialog } from "@/components/CustomerDialog";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Trash2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";

export default function Customers() {
  const business = useQuery(api.businesses.getMyBusiness, {});
  const customers = useQuery(
    api.customers.list,
    business ? { businessId: business._id } : "skip"
  );
  const deleteCustomer = useMutation(api.customers.remove);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);

  const handleDelete = async (id: Id<"customers">) => {
    if (confirm("Are you sure you want to delete this customer?")) {
      try {
        await deleteCustomer({ id });
        toast.success("Customer deleted");
      } catch (error) {
        toast.error("Failed to delete customer");
      }
    }
  };

  const handleEdit = (customer: any) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsDialogOpen(true);
  };

  if (!business) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Please set up your business profile first.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground mt-1">
              Manage your client base and view their financial situation.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="w-full sm:w-auto">
              <ImportDialog businessId={business._id} type="CUSTOMERS" />
            </div>
            <Button onClick={handleCreate} className="w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Add Customer
            </Button>
          </div>
        </div>

        <CustomerDialog 
          businessId={business._id} 
          open={isDialogOpen} 
          onOpenChange={setIsDialogOpen}
          customer={selectedCustomer}
        />

        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
            <CardDescription>
              Overview of customers and their account balance.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-4">Name</TableHead>
                    <TableHead className="hidden md:table-cell">Contact</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Total Sales</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Paid</TableHead>
                    <TableHead className="text-right whitespace-nowrap">Balance Due</TableHead>
                    <TableHead className="text-right pr-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers?.map((customer) => (
                    <TableRow key={customer._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(customer)}>
                      <TableCell className="font-medium pl-4">
                        <div>{customer.name}</div>
                        <div className="text-xs text-muted-foreground md:hidden">
                            {customer.phone}
                        </div>
                        <div className="text-xs text-muted-foreground hidden md:block">
                            {[customer.taxId && `NIF: ${customer.taxId}`, customer.rc && `RC: ${customer.rc}`].filter(Boolean).join(" | ")}
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                          <div className="flex flex-col text-xs">
                              <span>{customer.phone}</span>
                              <span className="text-muted-foreground">{customer.email}</span>
                          </div>
                      </TableCell>
                      <TableCell className="text-right font-medium whitespace-nowrap">
                          {customer.financials?.totalSales.toLocaleString()} <span className="text-xs text-muted-foreground">{business.currency}</span>
                      </TableCell>
                      <TableCell className="text-right text-emerald-600 whitespace-nowrap">
                          {customer.financials?.totalPaid.toLocaleString()} <span className="text-xs text-muted-foreground">{business.currency}</span>
                      </TableCell>
                      <TableCell className="text-right whitespace-nowrap">
                          <span className={customer.financials?.balanceDue > 0 ? "text-red-600 font-bold" : "text-muted-foreground"}>
                              {customer.financials?.balanceDue.toLocaleString()} <span className="text-xs font-normal">{business.currency}</span>
                          </span>
                      </TableCell>
                      <TableCell className="text-right pr-4">
                        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(customer)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(customer._id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {customers?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No customers found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}