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
import { Palette, Upload, Image as ImageIcon, FileSignature, Stamp, Wand2 } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { removeBackground } from "@imgly/background-removal";

interface BusinessDesignSettingsProps {
  businessId: Id<"businesses">;
  initialData: {
    primaryColor?: string;
    secondaryColor?: string;
    font?: string;
    template?: string;
    logoUrl?: string;
    logoStorageId?: Id<"_storage">;
    signatureUrl?: string;
    signatureStorageId?: Id<"_storage">;
    stampUrl?: string;
    stampStorageId?: Id<"_storage">;
  };
}

export function BusinessDesignSettings({ businessId, initialData }: BusinessDesignSettingsProps) {
  const { t } = useLanguage();
  const updateBusiness = useMutation(api.businesses.update);
  const generateUploadUrl = useMutation(api.businesses.generateUploadUrl);
  
  const [formData, setFormData] = useState({
    primaryColor: initialData.primaryColor || "#000000",
    secondaryColor: initialData.secondaryColor || "#ffffff",
    font: initialData.font || "Inter",
    template: initialData.template || "modern",
  });
  
  const [isUploading, setIsUploading] = useState(false);
  const [isRemovingBg, setIsRemovingBg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const signatureInputRef = useRef<HTMLInputElement>(null);
  const stampInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "logo" | "signature" | "stamp") => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let fileToUpload = file;

      // Auto-remove background for signature and stamp
      if (type === "signature" || type === "stamp") {
        setIsRemovingBg(true);
        toast.info("Removing background...", { duration: 2000 });
        try {
          const blob = await removeBackground(file);
          fileToUpload = new File([blob], file.name, { type: "image/png" });
          toast.success("Background removed successfully");
        } catch (bgError) {
          console.error("Background removal failed:", bgError);
          toast.warning("Could not remove background, uploading original image.");
        } finally {
          setIsRemovingBg(false);
        }
      }

      // 1. Get upload URL
      const postUrl = await generateUploadUrl();
      
      // 2. Upload file
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": fileToUpload.type },
        body: fileToUpload,
      });
      
      if (!result.ok) throw new Error("Upload failed");
      
      const { storageId } = await result.json();
      
      // 3. Update business with storage ID
      const updateField = type === "logo" ? "logoStorageId" : type === "signature" ? "signatureStorageId" : "stampStorageId";
      
      await updateBusiness({
        id: businessId,
        [updateField]: storageId,
      });
      
      toast.success(t("settings.design.toast.saveSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(t("settings.design.toast.saveError"));
    } finally {
      setIsUploading(false);
      setIsRemovingBg(false);
    }
  };

  const handleSave = async () => {
    try {
      await updateBusiness({
        id: businessId,
        ...formData,
      });
      toast.success(t("settings.design.toast.saveSuccess"));
    } catch (error) {
      console.error(error);
      toast.error(t("settings.design.toast.saveError"));
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
            <CardTitle>{t("settings.design.title")}</CardTitle>
            <CardDescription>
              {t("settings.design.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Section */}
        <div className="space-y-4">
          <Label>{t("settings.design.logo")}</Label>
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
                {isUploading ? t("settings.design.uploading") : t("settings.design.upload")}
              </Button>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleUpload(e, "logo")}
              />
              <p className="text-xs text-muted-foreground">
                {t("settings.design.recommended")}
              </p>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="space-y-4">
          <Label>Digital Signature</Label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-40 rounded-lg border border-dashed flex items-center justify-center bg-muted/50 overflow-hidden relative">
              {initialData.signatureUrl ? (
                <img 
                  src={initialData.signatureUrl} 
                  alt="Signature" 
                  className="h-full w-full object-contain" 
                />
              ) : (
                <FileSignature className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => signatureInputRef.current?.click()}
                disabled={isUploading || isRemovingBg}
              >
                {isRemovingBg ? (
                  <Wand2 className="mr-2 h-4 w-4 animate-pulse" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isRemovingBg ? "Removing Background..." : isUploading ? "Uploading..." : "Upload Signature"}
              </Button>
              <input
                type="file"
                ref={signatureInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleUpload(e, "signature")}
              />
              <p className="text-xs text-muted-foreground">
                Background will be automatically removed.
              </p>
            </div>
          </div>
        </div>

        {/* Stamp Section */}
        <div className="space-y-4">
          <Label>Digital Stamp (Cachet)</Label>
          <div className="flex items-center gap-4">
            <div className="h-20 w-20 rounded-lg border border-dashed flex items-center justify-center bg-muted/50 overflow-hidden relative">
              {initialData.stampUrl ? (
                <img 
                  src={initialData.stampUrl} 
                  alt="Stamp" 
                  className="h-full w-full object-contain" 
                />
              ) : (
                <Stamp className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => stampInputRef.current?.click()}
                disabled={isUploading || isRemovingBg}
              >
                {isRemovingBg ? (
                  <Wand2 className="mr-2 h-4 w-4 animate-pulse" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isRemovingBg ? "Removing Background..." : isUploading ? "Uploading..." : "Upload Stamp"}
              </Button>
              <input
                type="file"
                ref={stampInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleUpload(e, "stamp")}
              />
              <p className="text-xs text-muted-foreground">
                Background will be automatically removed.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Colors */}
          <div className="space-y-2">
            <Label htmlFor="primaryColor">{t("settings.design.primaryColor")}</Label>
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
            <Label htmlFor="secondaryColor">{t("settings.design.secondaryColor")}</Label>
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
            <Label htmlFor="font">{t("settings.design.font")}</Label>
            <Select
              value={formData.font}
              onValueChange={(val) => handleSelectChange("font", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("settings.design.selectFont")} />
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
            <Label htmlFor="template">{t("settings.design.template")}</Label>
            <Select
              value={formData.template}
              onValueChange={(val) => handleSelectChange("template", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("settings.design.selectTemplate")} />
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
          <Button onClick={handleSave}>{t("settings.design.save")}</Button>
        </div>
      </CardContent>
    </Card>
  );
}