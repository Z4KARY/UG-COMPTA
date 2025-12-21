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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Lock, Unlock, Trash2, Plus, Building2, CreditCard, Eye, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";
import { PRICING_PLANS } from "@/lib/pricing";

const PLAN_NAMES: Record<string, string> = {
  free: "Auto-Entrepreneur",
  startup: "Startup",
  pro: "Small Business",
  premium: "Premium",
  enterprise: "Enterprise",
};

export function AdminBusinesses() {
  const { t } = useLanguage();
  const businesses = useQuery(api.admin.listBusinesses);
  const toggleBusiness = useMutation(api.admin.toggleBusinessSuspension);
  const deleteBusinesses = useMutation(api.admin.deleteBusinesses);
  const createBusiness = useMutation(api.admin.createBusiness);
  const createSubscription = useMutation(api.admin.createSubscription);
  const resetSubscription = useMutation(api.admin.resetBusinessSubscription);

  const [selectedBusinesses, setSelectedBusinesses] = useState<Id<"businesses">[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Details & Subscription State
  const [viewBusinessId, setViewBusinessId] = useState<Id<"businesses"> | null>(null);
  const businessDetails = useQuery(api.admin.getBusinessDetails, viewBusinessId ? { id: viewBusinessId } : "skip");
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [subPlan, setSubPlan] = useState<string>("");
  const [subDuration, setSubDuration] = useState<string>("");
  const [subAmount, setSubAmount] = useState<string>("");

  // Create Form State
  const [businessName, setBusinessName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [plan, setPlan] = useState<string>("");
  const [durationMonths, setDurationMonths] = useState<string>("");

  const handleToggleBusiness = async (id: Id<"businesses">, currentStatus: boolean | undefined) => {
    try {
      await toggleBusiness({ id, suspend: !currentStatus });
      toast.success(!currentStatus ? "Business suspended" : "Business activated");
    } catch (e) {
      toast.error("Error updating business status");
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && businesses) {
      setSelectedBusinesses(businesses.map(b => b._id));
    } else {
      setSelectedBusinesses([]);
    }
  };

  const handleSelectBusiness = (id: Id<"businesses">, checked: boolean) => {
    if (checked) {
      setSelectedBusinesses(prev => [...prev, id]);
    } else {
      setSelectedBusinesses(prev => prev.filter(bid => bid !== id));
    }
  };

  const handleDeleteSelected = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedBusinesses.length} businesses? This action cannot be undone.`)) return;
    
    try {
      await deleteBusinesses({ ids: selectedBusinesses });
      toast.success("Businesses deleted successfully");
      setSelectedBusinesses([]);
    } catch (e) {
      toast.error("Error deleting businesses");
    }
  };

  const handleCreateBusiness = async () => {
    if (!businessName || !ownerEmail) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!plan) {
      toast.error("Please select a subscription plan");
      return;
    }
    if (!durationMonths) {
      toast.error("Please select a duration");
      return;
    }

    try {
      await createBusiness({
        name: businessName,
        ownerEmail,
        ownerName: ownerName || undefined,
        plan: plan as any,
        durationMonths: parseInt(durationMonths),
      });
      toast.success("Business created successfully");
      setIsCreateOpen(false);
      // Reset form
      setBusinessName("");
      setOwnerEmail("");
      setOwnerName("");
      setPlan("");
      setDurationMonths("");
    } catch (e: any) {
      toast.error(e.message || "Error creating business");
    }
  };

  const handleAddSubscription = async () => {
    if (!viewBusinessId || !subPlan || !subDuration) return;
    try {
      await createSubscription({
        businessId: viewBusinessId,
        plan: subPlan as any,
        durationMonths: parseInt(subDuration),
        amount: subAmount ? parseFloat(subAmount) : 0,
      });
      toast.success("Subscription added successfully");
      setIsAddSubOpen(false);
      setSubPlan("");
      setSubDuration("");
      setSubAmount("");
    } catch (e) {
      toast.error("Failed to add subscription");
    }
  };

  const handleResetSubscription = async () => {
    if (!viewBusinessId) return;
    if (!confirm("Are you sure you want to reset this business to the Free plan? This will cancel any active subscriptions.")) return;
    
    try {
      await resetSubscription({ businessId: viewBusinessId });
      toast.success("Business subscription reset to Free");
    } catch (e) {
      toast.error("Failed to reset subscription");
    }
  };

  // Auto-fill price when plan changes
  useEffect(() => {
    if (subPlan) {
      const plan = PRICING_PLANS.en.find(p => p.id === subPlan);
      if (plan) {
        if (plan.price === "Custom") {
           // Keep existing or set to 0
        } else if (plan.price) {
           const priceNum = parseInt(plan.price.replace(/[^0-9]/g, ''));
           if (!isNaN(priceNum)) {
             setSubAmount(priceNum.toString());
           }
        }
      }
    }
  }, [subPlan]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{t("admin.businesses.title") || "Businesses"}</CardTitle>
          <CardDescription>{t("admin.businesses.description") || "Manage registered businesses"}</CardDescription>
        </div>
        <div className="flex gap-2">
          {selectedBusinesses.length > 0 && (
            <Button variant="destructive" size="sm" onClick={handleDeleteSelected}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete ({selectedBusinesses.length})
            </Button>
          )}
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create Business
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Business</DialogTitle>
                <DialogDescription>
                  Create a new business and assign it to a user. Enter an existing user's email to assign to them, or a new email to create a new user.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input 
                    id="businessName" 
                    value={businessName} 
                    onChange={(e) => setBusinessName(e.target.value)} 
                    placeholder="Company LLC" 
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ownerEmail">Owner Email *</Label>
                  <Input 
                    id="ownerEmail" 
                    type="email" 
                    value={ownerEmail} 
                    onChange={(e) => setOwnerEmail(e.target.value)} 
                    placeholder="owner@example.com" 
                  />
                  <p className="text-xs text-muted-foreground">
                    If user exists, business will be assigned to them. If not, a new user will be created.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="ownerName">Owner Name (Optional)</Label>
                  <Input 
                    id="ownerName" 
                    value={ownerName} 
                    onChange={(e) => setOwnerName(e.target.value)} 
                    placeholder="John Doe" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="plan">Subscription Plan *</Label>
                    <Select value={plan} onValueChange={setPlan}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Plan" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="free">Auto-Entrepreneur</SelectItem>
                        <SelectItem value="startup">Startup</SelectItem>
                        <SelectItem value="pro">Small Business</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration *</Label>
                    <Select value={durationMonths} onValueChange={setDurationMonths}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Month</SelectItem>
                        <SelectItem value="3">3 Months</SelectItem>
                        <SelectItem value="6">6 Months</SelectItem>
                        <SelectItem value="12">1 Year</SelectItem>
                        <SelectItem value="24">2 Years</SelectItem>
                        <SelectItem value="36">3 Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                <Button onClick={handleCreateBusiness}>Create Business</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox 
                  checked={businesses && businesses.length > 0 && selectedBusinesses.length === businesses.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>{t("admin.table.name") || "Name"}</TableHead>
              <TableHead>{t("admin.table.owner") || "Owner"}</TableHead>
              <TableHead>{t("admin.table.nif") || "NIF"}</TableHead>
              <TableHead>{t("admin.table.status") || "Status"}</TableHead>
              <TableHead className="text-right">{t("admin.table.actions") || "Actions"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {businesses?.map((b) => (
              <TableRow key={b._id} className="cursor-pointer hover:bg-muted/50" onClick={(e) => {
                // Prevent click when clicking checkbox or actions
                if ((e.target as HTMLElement).closest("button") || (e.target as HTMLElement).closest("[role='checkbox']")) return;
                setViewBusinessId(b._id);
              }}>
                <TableCell>
                  <Checkbox 
                    checked={selectedBusinesses.includes(b._id)}
                    onCheckedChange={(c) => handleSelectBusiness(b._id, !!c)}
                  />
                </TableCell>
                <TableCell className="font-medium">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {b.name}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    <span>{b.ownerName}</span>
                    <span className="text-xs text-muted-foreground">{b.ownerEmail}</span>
                  </div>
                </TableCell>
                <TableCell>{b.nif || "-"}</TableCell>
                <TableCell>
                  {b.isSuspended ? (
                    <Badge variant="destructive">{t("admin.status.suspended") || "Suspended"}</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">{t("admin.status.active") || "Active"}</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => setViewBusinessId(b._id)}>
                        <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={b.isSuspended ? "outline" : "destructive"}
                        size="sm"
                        onClick={() => handleToggleBusiness(b._id, b.isSuspended)}
                    >
                        {b.isSuspended ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {/* Business Details Dialog */}
        <Dialog open={!!viewBusinessId} onOpenChange={(open) => !open && setViewBusinessId(null)}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Business Details</DialogTitle>
                    <DialogDescription>Detailed information for {businessDetails?.name}</DialogDescription>
                </DialogHeader>
                
                {businessDetails ? (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Business Name</Label>
                                <p className="font-medium">{businessDetails.name}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Trade Name</Label>
                                <p className="font-medium">{businessDetails.tradeName || "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Owner</Label>
                                <div className="flex flex-col">
                                    <span className="font-medium">{businessDetails.owner?.name}</span>
                                    <span className="text-sm text-muted-foreground">{businessDetails.owner?.email}</span>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">Status</Label>
                                <div>
                                    {businessDetails.isSuspended ? (
                                        <Badge variant="destructive">Suspended</Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">NIF</Label>
                                <p className="font-medium">{businessDetails.nif || "-"}</p>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-muted-foreground">RC</Label>
                                <p className="font-medium">{businessDetails.rc || "-"}</p>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-lg font-semibold">Subscription</h3>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={handleResetSubscription} className="text-destructive hover:text-destructive">
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Reset to Free
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setIsAddSubOpen(true)}>
                                        <CreditCard className="h-4 w-4 mr-2" />
                                        Add/Update Subscription
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Current Plan</Label>
                                    <p className="font-medium capitalize">{PLAN_NAMES[businessDetails.plan || ""] || businessDetails.plan || "None"}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Status</Label>
                                    <p className="font-medium capitalize">{businessDetails.subscriptionStatus || "None"}</p>
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-muted-foreground">Ends At</Label>
                                    <p className="font-medium">
                                        {businessDetails.subscriptionEndsAt 
                                            ? new Date(businessDetails.subscriptionEndsAt).toLocaleDateString() 
                                            : "-"}
                                    </p>
                                </div>
                            </div>

                            <h4 className="text-sm font-semibold mb-2">History</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Plan</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Start Date</TableHead>
                                        <TableHead>End Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {businessDetails.subscriptions?.map((sub) => (
                                        <TableRow key={sub._id}>
                                            <TableCell className="capitalize">{PLAN_NAMES[sub.planId] || sub.planId}</TableCell>
                                            <TableCell className="capitalize">{sub.status}</TableCell>
                                            <TableCell>{new Date(sub.startDate).toLocaleDateString()}</TableCell>
                                            <TableCell>{sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "-"}</TableCell>
                                        </TableRow>
                                    ))}
                                    {(!businessDetails.subscriptions || businessDetails.subscriptions.length === 0) && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">No subscription history</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                ) : (
                    <div className="py-8 text-center">Loading details...</div>
                )}
            </DialogContent>
        </Dialog>

        {/* Add Subscription Dialog */}
        <Dialog open={isAddSubOpen} onOpenChange={setIsAddSubOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add Subscription</DialogTitle>
                    <DialogDescription>Add a new subscription to this business. This will update the current plan.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="subPlan">Plan</Label>
                        <Select value={subPlan} onValueChange={setSubPlan}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Plan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="free">Auto-Entrepreneur</SelectItem>
                                <SelectItem value="startup">Startup</SelectItem>
                                <SelectItem value="pro">Small Business</SelectItem>
                                <SelectItem value="premium">Premium</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="subAmount">Amount (DZD)</Label>
                        <Input 
                            id="subAmount" 
                            type="number" 
                            value={subAmount} 
                            onChange={(e) => setSubAmount(e.target.value)} 
                            placeholder="0"
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="subDuration">Duration</Label>
                        <Select value={subDuration} onValueChange={setSubDuration}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Duration" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1">1 Month</SelectItem>
                                <SelectItem value="3">3 Months</SelectItem>
                                <SelectItem value="6">6 Months</SelectItem>
                                <SelectItem value="12">1 Year</SelectItem>
                                <SelectItem value="24">2 Years</SelectItem>
                                <SelectItem value="36">3 Years</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddSubOpen(false)}>Cancel</Button>
                    <Button onClick={handleAddSubscription}>Add Subscription</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}