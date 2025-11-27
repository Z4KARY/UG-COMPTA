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
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Business Settings</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Business Profile</CardTitle>
          <CardDescription>
            Manage your business details, address, and tax information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Business Name (Raison Sociale)</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
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
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City (Wilaya/Commune)</Label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rc">RC (Registre de Commerce)</Label>
                <Input
                  id="rc"
                  name="rc"
                  value={formData.rc}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nif">NIF (Numéro d'Identification Fiscale)</Label>
                <Input
                  id="nif"
                  name="nif"
                  value={formData.nif}
                  onChange={handleChange}
                />
              </div>
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
                <Label htmlFor="fiscalRegime">Fiscal Regime</Label>
                <Select 
                    value={formData.fiscalRegime} 
                    onValueChange={(val) => handleSelectChange("fiscalRegime", val)}
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
                <Label htmlFor="tvaDefault">Default TVA Rate (%)</Label>
                <Input
                  id="tvaDefault"
                  name="tvaDefault"
                  type="number"
                  value={formData.tvaDefault}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  name="bankName"
                  value={formData.bankName}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bankIban">IBAN / RIP</Label>
                <Input
                  id="bankIban"
                  name="bankIban"
                  value={formData.bankIban}
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}