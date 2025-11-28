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
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Palette, Upload, Image as ImageIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

interface BusinessDesignSettingsProps {
  businessId: Id<"businesses">;
  initialData: {
    primaryColor?: string;
    secondaryColor?: string;
    font?: string;
    template?: string;
    logoUrl?: string;
    logoStorageId?: Id<"_storage">;
  };
}

export function BusinessDesignSettings({ businessId, initialData }: BusinessDesignSettingsProps) {
  const updateBusiness = useMutation(api.businesses.update);
  const generateUploadUrl = useMutation(api.businesses.generateUploadUrl);
  
  const [formData, setFormData] = useState({
    primaryColor: initialData.primaryColor || "#000000",
    secondaryColor: initialData.secondaryColor || "#ffffff",
    font: initialData.font || "Inter",
    template: initialData.template || "modern",
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // 1. Get upload URL
      const postUrl = await generateUploadUrl();
      
      // 2. Upload file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      
      if (!result.ok) throw new Error("Upload failed");
      
      const { storageId } = await result.json();
      
      // 3. Update business with storage ID
      await updateBusiness({
        id: businessId,
        logoStorageId: storageId,
      });
      
      toast.success("Logo uploaded successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload logo");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateBusiness({
        id: businessId,
        ...formData,
      });
      toast.success("Design settings saved");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save design settings");
    }
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-pink-500/10 rounded-lg">
            <Palette className="h-5 w-5 text-pink-600 dark:text-pink-400" />
          </div>
          <div>
            <CardTitle>Invoice Design</CardTitle>
            <CardDescription>
              Customize the look and feel of your documents.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Section */}
        <div className="space-y-4">
          <Label>Company Logo</Label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-lg border border-dashed flex items-center justify-center bg-muted/50 overflow-hidden relative">
              {initialData.logoUrl ? (
                <img 
                  src={initialData.logoUrl} 
                  alt="Logo" 
                  className="h-full w-full object-contain" 
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="mr-2 h-4 w-4" />
                {isUploading ? "Uploading..." : "Upload Logo"}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleLogoUpload}
              />
              <p className="text-xs text-muted-foreground">
                Recommended: PNG or JPG, max 2MB.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colors */}
          <div className="space-y-2">
            <Label htmlFor="primaryColor">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                id="primaryColor"
                name="primaryColor"
                type="color"
                value={formData.primaryColor}
                onChange={handleChange}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={formData.primaryColor}
                onChange={handleChange}
                name="primaryColor"
                className="font-mono uppercase"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryColor">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                id="secondaryColor"
                name="secondaryColor"
                type="color"
                value={formData.secondaryColor}
                onChange={handleChange}
                className="w-12 h-10 p-1 cursor-pointer"
              />
              <Input
                value={formData.secondaryColor}
                onChange={handleChange}
                name="secondaryColor"
                className="font-mono uppercase"
              />
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-2">
            <Label htmlFor="font">Font Family</Label>
            <Select
              value={formData.font}
              onValueChange={(val) => handleSelectChange("font", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select font" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inter">Inter (Default)</SelectItem>
                <SelectItem value="Roboto">Roboto</SelectItem>
                <SelectItem value="Open Sans">Open Sans</SelectItem>
                <SelectItem value="Lato">Lato</SelectItem>
                <SelectItem value="Montserrat">Montserrat</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template */}
          <div className="space-y-2">
            <Label htmlFor="template">Template Style</Label>
            <Select
              value={formData.template}
              onValueChange={(val) => handleSelectChange("template", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern">Modern</SelectItem>
                <SelectItem value="classic">Classic</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end">
          <Button onClick={handleSave}>Save Design Settings</Button>
        </div>
      </CardContent>
    </Card>
  );
}
