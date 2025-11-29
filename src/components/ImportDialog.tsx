import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

interface ImportDialogProps {
  businessId: Id<"businesses">;
  type: "CUSTOMERS" | "PRODUCTS" | "INVOICES";
}

export function ImportDialog({ businessId, type }: ImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const generateUploadUrl = useMutation(api.imports.generateUploadUrl);
  const createJob = useMutation(api.imports.createJob);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    try {
      // Step 1: Get a short-lived upload URL
      const postUrl = await generateUploadUrl();

      // Step 2: POST the file to the URL
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      // Step 3: Save the newly allocated storage id to the database
      await createJob({
        businessId,
        storageId,
        type,
        // We'll implement mapping logic later, for now passing empty/default
        mapping: "{}", 
      });

      toast.success("Import started. You will be notified when it completes.");
      setIsOpen(false);
      setFile(null);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload file");
    } finally {
      setIsUploading(false);
    }
  };

  const title = type === "CUSTOMERS" ? "Import Customers" : type === "PRODUCTS" ? "Import Products" : "Import Invoices";

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full sm:w-auto">
          <Upload className="mr-2 h-4 w-4" />
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Upload a CSV or Excel file to import your data.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="file">File</Label>
            <Input id="file" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} ref={fileInputRef} />
          </div>
          <div className="text-sm text-muted-foreground">
            <p>Supported formats: .csv, .xlsx</p>
            <p className="mt-2">
              <a href="#" className="text-primary hover:underline flex items-center">
                <FileSpreadsheet className="mr-1 h-3 w-3" />
                Download template
              </a>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleUpload} disabled={!file || isUploading}>
            {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}