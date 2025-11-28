import { DashboardLayout } from "@/components/DashboardLayout";
import { CreateCustomerDialog } from "@/components/CreateCustomerDialog";
import { ImportDialog } from "@/components/ImportDialog";

export default function Products() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [business, setBusiness] = useState(null);

  useEffect(() => {
    // ... existing code
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Products & Services</h1>
            <p className="text-muted-foreground mt-1">
              Manage your catalog of goods and services.
            </p>
          </div>
          <div className="flex gap-2">
            {business && <ImportDialog businessId={business._id} type="PRODUCTS" />}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <CreateCustomerDialog businessId={business?._id} />
            </Dialog>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}