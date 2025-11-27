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
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function BusinessSettings() {
  const business = useQuery(api.businesses.getMyBusiness, {});
  const createBusiness = useMutation(api.businesses.create);
  const updateBusiness = useMutation(api.businesses.update);

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
    fiscalRegime: "VAT",
    bankName: "",
    bankIban: "",
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
        fiscalRegime: business.fiscalRegime || "VAT",
        bankName: business.bankName || "",
        bankIban: business.bankIban || "",
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
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (business) {
        await updateBusiness({
          id: business._id,
          ...formData,
          fiscalRegime: formData.fiscalRegime as "VAT" | "IFU" | "OTHER",
        });
        toast.success("Business profile updated");
      } else {
        await createBusiness({
          ...formData,
          fiscalRegime: formData.fiscalRegime as "VAT" | "IFU" | "OTHER",
        });
        toast.success("Business profile created");
      }
    } catch (error) {
      toast.error("Failed to save business profile");
      console.error(error);
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
                <Label htmlFor="name">Business Name (Raison Sociale)</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. SARL Tech Solutions"
                  required
                  className="bg-muted/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tradeName">Trade Name (Nom Commercial)</Label>
                <Input
                  id="tradeName"
                  name="tradeName"
                  value={formData.tradeName}
                  onChange={handleChange}
                  placeholder="Optional"
                  className="bg-muted/30"
                />
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
              <Separator className="my-2" />
              <div className="space-y-2">
                <Label htmlFor="fiscalRegime">Fiscal Regime</Label>
                <Select
                  value={formData.fiscalRegime}
                  onValueChange={(val) =>
                    handleSelectChange("fiscalRegime", val)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select regime" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="VAT">VAT (Réel)</SelectItem>
                    <SelectItem value="IFU">IFU (Simplifié)</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
        </form>
      </motion.div>
    </DashboardLayout>
  );
}