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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground mt-1">
              Manage your client base and their details.
            </p>
          </div>
          <div className="flex gap-2">
            <ImportDialog businessId={business._id} type="CUSTOMERS" />
            <Button onClick={handleCreate}>
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
              Manage your customers and their contact information.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>NIF</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers?.map((customer) => (
                  <TableRow key={customer._id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(customer)}>
                    <TableCell className="font-medium">
                      <div>{customer.name}</div>
                      <div className="text-xs text-muted-foreground">
                          {[customer.rc && `RC: ${customer.rc}`, customer.ai && `AI: ${customer.ai}`].filter(Boolean).join(" | ")}
                      </div>
                    </TableCell>
                    <TableCell>{customer.taxId || "-"}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.address}</TableCell>
                    <TableCell className="text-right">
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
                    <TableCell colSpan={5} className="text-center">
                      No customers found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}