import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { motion } from "framer-motion";
import {
  Building2,
  CreditCard,
  FileText,
  Landmark,
  MapPin,
  Save,
  Wallet,
  Download,
  Archive,
  Lock,
  Unlock,
  Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { WebhookSettings } from "@/components/WebhookSettings";
import { useAction } from "convex/react";

export default function BusinessSettings() {
  const business = useQuery(api.businesses.getMyBusiness, {});
  const createBusiness = useMutation(api.businesses.create);
  const updateBusiness = useMutation(api.businesses.update);
  
  // Period Closures
  const periods = useQuery(api.periods.list, business ? { businessId: business._id } : "skip");
  const closePeriod = useMutation(api.periods.close);
  const openPeriod = useMutation(api.periods.remove);
  
  // Export Action
  const generateZip = useAction(api.exportActions.generateZip);
  const [isExporting, setIsExporting] = useState(false);

  const [closureData, setClosureData] = useState({
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
  });

  // For export functionality
  const exportData = useQuery(api.businesses.exportData, business ? { businessId: business._id } : "skip");

  const [formData, setFormData] = useState({
    name: "",
    tradeName: "",
    address: "",
    city: "",
    rc: "",
    nif: "",
    ai: "",
    currency: "DZD",
    tvaDefault: 19,
    type: "societe", // Default
    fiscalRegime: "reel",
    legalForm: "SARL",
    bankName: "",
    bankIban: "",
    // AE Fields
    autoEntrepreneurCardNumber: "",
    ssNumber: "",
    activityCodes: "", // We'll handle as comma separated string in UI
  });

  useEffect(() => {
    if (business) {
      setFormData({
        name: business.name,
        tradeName: business.tradeName || "",
        address: business.address,
        city: business.city || "",
        rc: business.rc || "",
        nif: business.nif || "",
        ai: business.ai || "",
        currency: business.currency,
        tvaDefault: business.tvaDefault,
        type: business.type || "societe",
        fiscalRegime: business.fiscalRegime || "reel",
        legalForm: business.legalForm || "SARL",
        bankName: business.bankName || "",
        bankIban: business.bankIban || "",
        autoEntrepreneurCardNumber: business.autoEntrepreneurCardNumber || "",
        ssNumber: business.ssNumber || "",
        activityCodes: business.activityCodes?.join(", ") || "",
      });
    }
  }, [business]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "tvaDefault" ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
        const newData = { ...prev, [name]: value };
        
        // Logic Binding
        if (name === "type") {
            if (value === "societe") {
                newData.fiscalRegime = "reel";
                newData.tvaDefault = 19;
                newData.legalForm = "SARL"; // Default
            } else if (value === "auto_entrepreneur") {
                newData.fiscalRegime = "auto_entrepreneur";
                newData.tvaDefault = 0;
                newData.legalForm = "PERSONNE_PHYSIQUE"; // Technically AE is a PP
                newData.rc = ""; // Clear RC
                newData.ai = ""; // Clear AI
            } else if (value === "personne_physique") {
                newData.fiscalRegime = "forfaitaire"; // Default to IFU
                newData.tvaDefault = 0;
                newData.legalForm = "PERSONNE_PHYSIQUE";
            }
        }
        
        if (name === "fiscalRegime") {
            if (value === "forfaitaire" || value === "auto_entrepreneur") {
                newData.tvaDefault = 0;
            } else if (value === "reel") {
                newData.tvaDefault = 19;
            }
        }

        return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
          ...formData,
          type: formData.type as "societe" | "personne_physique" | "auto_entrepreneur",
          fiscalRegime: formData.fiscalRegime as "reel" | "forfaitaire" | "auto_entrepreneur",
          legalForm: formData.legalForm as any,
          activityCodes: formData.activityCodes.split(",").map(s => s.trim()).filter(s => s !== ""),
      };

      if (business) {
        await updateBusiness({
          id: business._id,
          ...payload,
        });
        toast.success("Business profile updated");
      } else {
        await createBusiness(payload);
        toast.success("Business profile created");
      }
    } catch (error) {
      toast.error("Failed to save business profile");
      console.error(error);
    }
  };

  const handleExport = () => {
    if (!exportData) {
        toast.error("Data not ready for export yet");
        return;
    }
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `invoiceflow_backup_${business?.name || "data"}_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Backup downloaded successfully");
  };

  const handleFullExport = async () => {
    if (!business || !business.userId) return;
    
    setIsExporting(true);
    try {
        const zipBuffer = await generateZip({
            businessId: business._id,
            userId: business.userId, // Pass owner ID (or current user ID if we had it in context, but action checks auth)
            includePdfs: true
        });
        
        const blob = new Blob([zipBuffer], { type: "application/zip" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `invoiceflow_full_backup_${business.name}_${new Date().toISOString().split('T')[0]}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Full archive downloaded successfully");
    } catch (error) {
        toast.error("Failed to generate full export");
        console.error(error);
    } finally {
        setIsExporting(false);
    }
  };

  const handleClosePeriod = async () => {
      if (!business) return;
      
      // Calculate start and end of month
      const startDate = new Date(closureData.year, closureData.month, 1).getTime();
      const endDate = new Date(closureData.year, closureData.month + 1, 0, 23, 59, 59).getTime();
      
      try {
          await closePeriod({
              businessId: business._id,
              periodType: "MONTH",
              startDate,
              endDate,
              notes: `Closed ${closureData.month + 1}/${closureData.year}`,
          });
          toast.success("Period closed successfully");
      } catch (error) {
          toast.error("Failed to close period");
          console.error(error);
      }
  };

  const handleReopenPeriod = async (id: any) => {
      if (confirm("Are you sure you want to reopen this period? This will allow modifications.")) {
          try {
              await openPeriod({ id });
              toast.success("Period reopened");
          } catch (error) {
              toast.error("Failed to reopen period");
          }
      }
  };

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Business Settings
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your company profile, fiscal parameters, and banking details.
            </p>
          </div>
          <Button onClick={handleSubmit} size="lg" className="shadow-sm">
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-6 md:grid-cols-2">
          {/* Company Identity Section */}
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>Company Identity</CardTitle>
                  <CardDescription>
                    Basic information about your business entity.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">
                  {formData.type === "societe" 
                    ? "Business Name (Raison Sociale)" 
                    : "Full Name (Nom & Prénom)"}
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={formData.type === "societe" ? "e.g. SARL Tech Solutions" : "e.g. Ahmed Benali"}
                  required
                  className="bg-muted/30"
                />
                {formData.type !== "societe" && (
                  <p className="text-[0.8rem] text-muted-foreground">
                    Enter your full legal name as it appears on your documents.
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradeName">Trade Name (Nom Commercial)</Label>
                <Input
                  id="tradeName"
                  name="tradeName"
                  value={formData.tradeName}
                  onChange={handleChange}
                  placeholder={formData.type === "societe" ? "Optional" : "e.g. My Shop"}
                  className="bg-muted/30"
                />
                {formData.type !== "societe" && (
                  <p className="text-[0.8rem] text-muted-foreground">
                    Do not include legal prefixes (EURL, SARL, etc.) in the trade name.
                  </p>
                )}
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Full business address"
                    required
                    className="pl-9 bg-muted/30"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City (Wilaya/Commune)</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="e.g. Algiers"
                  className="bg-muted/30"
                />
              </div>
            </CardContent>
          </Card>

          {/* Fiscal Information Section */}
          <Card className="shadow-sm h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <CardTitle>Fiscal & Legal</CardTitle>
                  <CardDescription>
                    Tax identification and registration details.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                  <Label htmlFor="type">Business Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(val) => handleSelectChange("type", val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="societe">Société (SARL, EURL, SPA...)</SelectItem>
                      <SelectItem value="personne_physique">Personne Physique (Entreprise Individuelle)</SelectItem>
                      <SelectItem value="auto_entrepreneur">Auto-Entrepreneur</SelectItem>
                    </SelectContent>
                  </Select>
              </div>

              {formData.type === "personne_physique" && (
                  <div className="space-y-2">
                    <Label htmlFor="fiscalRegime">Fiscal Regime</Label>
                    <Select
                        value={formData.fiscalRegime}
                        onValueChange={(val) => handleSelectChange("fiscalRegime", val)}
                    >
                        <SelectTrigger>
                        <SelectValue placeholder="Select regime" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="forfaitaire">Régime Forfaitaire (IFU)</SelectItem>
                        <SelectItem value="reel">Régime Réel Simplifié</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
              )}

              {formData.type === "societe" && (
                  <div className="space-y-2">
                    <Label htmlFor="legalForm">Legal Form</Label>
                    <Select
                        value={formData.legalForm}
                        onValueChange={(val) => handleSelectChange("legalForm", val)}
                    >
                        <SelectTrigger>
                        <SelectValue placeholder="Select form" />
                        </SelectTrigger>
                        <SelectContent>
                        <SelectItem value="SARL">SARL</SelectItem>
                        <SelectItem value="EURL">EURL</SelectItem>
                        <SelectItem value="SPA">SPA</SelectItem>
                        <SelectItem value="SNC">SNC</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>
                  </div>
              )}

              <Separator className="my-2" />
              
              {formData.type === "auto_entrepreneur" ? (
                  <div className="space-y-4 bg-blue-50/50 p-4 rounded-md border border-blue-100">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="autoEntrepreneurCardNumber">AE Card Number</Label>
                            <Input
                                id="autoEntrepreneurCardNumber"
                                name="autoEntrepreneurCardNumber"
                                value={formData.autoEntrepreneurCardNumber}
                                onChange={handleChange}
                                placeholder="National Registration Number"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="nif">NIF</Label>
                            <Input
                                id="nif"
                                name="nif"
                                value={formData.nif}
                                onChange={handleChange}
                                placeholder="Numéro Id. Fiscale"
                                required
                            />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="activityCodes">Activity Codes (ANAE)</Label>
                        <Input
                            id="activityCodes"
                            name="activityCodes"
                            value={formData.activityCodes}
                            onChange={handleChange}
                            placeholder="e.g. 072100, 072300 (Comma separated)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ssNumber">CASNOS Number (Optional)</Label>
                        <Input
                            id="ssNumber"
                            name="ssNumber"
                            value={formData.ssNumber}
                            onChange={handleChange}
                            placeholder="Social Security Number"
                        />
                      </div>
                  </div>
              ) : (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                        <Label htmlFor="rc">RC No.</Label>
                        <Input
                            id="rc"
                            name="rc"
                            value={formData.rc}
                            onChange={handleChange}
                            placeholder="Registre Commerce"
                        />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="nif">NIF</Label>
                        <Input
                            id="nif"
                            name="nif"
                            value={formData.nif}
                            onChange={handleChange}
                            placeholder="Numéro Id. Fiscale"
                        />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="ai">Article d'Imposition (AI)</Label>
                        <Input
                        id="ai"
                        name="ai"
                        value={formData.ai}
                        onChange={handleChange}
                        placeholder="Article Imposition"
                        />
                    </div>
                  </>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="currency">Currency</Label>
                  <Input
                    id="currency"
                    name="currency"
                    value={formData.currency}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tvaDefault">Default TVA (%)</Label>
                  <Input
                    id="tvaDefault"
                    name="tvaDefault"
                    type="number"
                    value={formData.tvaDefault}
                    onChange={handleChange}
                    required
                    disabled={formData.fiscalRegime === "auto_entrepreneur" || formData.fiscalRegime === "forfaitaire"}
                    className={formData.fiscalRegime === "auto_entrepreneur" || formData.fiscalRegime === "forfaitaire" ? "bg-muted text-muted-foreground" : ""}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Banking Information Section */}
          <Card className="shadow-sm h-full">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <Landmark className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <CardTitle>Banking Details</CardTitle>
                  <CardDescription>
                    Bank account information for invoices.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <div className="relative">
                  <Wallet className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bankName"
                    name="bankName"
                    value={formData.bankName}
                    onChange={handleChange}
                    placeholder="e.g. CPA, BNA, AGB"
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankIban">IBAN / RIP</Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="bankIban"
                    name="bankIban"
                    value={formData.bankIban}
                    onChange={handleChange}
                    placeholder="Account number"
                    className="pl-9 font-mono"
                  />
                </div>
              </div>
              <div className="rounded-md bg-muted p-4 mt-6">
                <p className="text-sm text-muted-foreground">
                  These details will appear on your invoices to help customers
                  make payments directly to your account.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Management / Archiving Section */}
          <Card className="md:col-span-2 shadow-sm border-dashed">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-500/10 rounded-lg">
                  <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <CardTitle>Legal Archiving & Data Export</CardTitle>
                  <CardDescription>
                    Download a full backup of your business data for legal retention (10 years).
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between border-b pb-4">
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Quick Data Backup (JSON)</p>
                        <p className="text-xs text-muted-foreground">
                            Instant download of all database records.
                        </p>
                    </div>
                    <Button type="button" variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export JSON
                    </Button>
                </div>
                <div className="flex items-center justify-between">
                    <div className="space-y-1">
                        <p className="text-sm font-medium">Full Archive (ZIP)</p>
                        <p className="text-xs text-muted-foreground">
                            Includes all data plus PDF files (Invoices & Purchases).
                        </p>
                    </div>
                    <Button type="button" variant="default" onClick={handleFullExport} disabled={isExporting}>
                        {isExporting ? (
                            <span className="animate-spin mr-2">⏳</span>
                        ) : (
                            <Archive className="mr-2 h-4 w-4" />
                        )}
                        {isExporting ? "Generating..." : "Download Archive"}
                    </Button>
                </div>
            </CardContent>
          </Card>

          {/* Accounting Periods Section */}
          <Card className="md:col-span-2 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <CardTitle>Accounting Periods</CardTitle>
                  <CardDescription>
                    Close fiscal periods to prevent modifications to invoices and purchases.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-end gap-4 border-b pb-6">
                    <div className="space-y-2">
                        <Label>Month</Label>
                        <Select 
                            value={closureData.month.toString()} 
                            onValueChange={(v) => setClosureData({...closureData, month: parseInt(v)})}
                        >
                            <SelectTrigger className="w-[180px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <SelectItem key={i} value={i.toString()}>
                                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Year</Label>
                        <Input 
                            type="number" 
                            value={closureData.year} 
                            onChange={(e) => setClosureData({...closureData, year: parseInt(e.target.value)})}
                            className="w-[100px]"
                        />
                    </div>
                    <Button type="button" onClick={handleClosePeriod}>
                        <Lock className="mr-2 h-4 w-4" />
                        Close Period
                    </Button>
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-medium text-muted-foreground">Closed Periods</h3>
                    {periods?.length === 0 && (
                        <p className="text-sm text-muted-foreground italic">No closed periods.</p>
                    )}
                    <div className="grid gap-2">
                        {periods?.map((period) => (
                            <div key={period._id} className="flex items-center justify-between p-3 bg-muted/30 rounded-md border">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">
                                        {format(period.startDate, "MMM yyyy")}
                                    </span>
                                    <span className="text-xs text-muted-foreground">
                                        ({format(period.startDate, "dd/MM/yyyy")} - {format(period.endDate, "dd/MM/yyyy")})
                                    </span>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 text-destructive hover:text-destructive"
                                    onClick={() => handleReopenPeriod(period._id)}
                                >
                                    <Unlock className="mr-2 h-3 w-3" />
                                    Reopen
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </CardContent>
          </Card>

          {/* Webhooks Section */}
          <div className="md:col-span-2">
            {business && <WebhookSettings businessId={business._id} />}
          </div>

        </form>
      </motion.div>
    </DashboardLayout>
  );
}