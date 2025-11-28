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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { Upload, FileSpreadsheet, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface ImportDialogProps {
  businessId: string;
  type: "CUSTOMERS" | "PRODUCTS";
  trigger?: React.ReactNode;
}

const FIELD_MAPPINGS = {
  CUSTOMERS: [
    { key: "name", label: "Name (Required)" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Phone" },
    { key: "address", label: "Address" },
    { key: "taxId", label: "NIF (Tax ID)" },
    { key: "rc", label: "RC" },
    { key: "ai", label: "AI" },
    { key: "nis", label: "NIS" },
    { key: "contactPerson", label: "Contact Person" },
  ],
  PRODUCTS: [
    { key: "name", label: "Name (Required)" },
    { key: "unitPrice", label: "Price (Required)" },
    { key: "tvaRate", label: "TVA Rate (%)" },
    { key: "description", label: "Description" },
    { key: "unitLabel", label: "Unit (e.g. kg, hr)" },
  ],
};

export function ImportDialog({ businessId, type, trigger }: ImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"UPLOAD" | "MAP" | "PROCESSING">("UPLOAD");
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);

  const generateUploadUrl = useMutation(api.imports.generateUploadUrl);
  const createJob = useMutation(api.imports.createJob);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    
    // Parse headers for mapping
    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: "binary" });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
      if (data && data.length > 0) {
        setHeaders(data[0] as string[]);
        setStep("MAP");
        
        // Auto-guess mapping
        const initialMapping: Record<string, string> = {};
        (data[0] as string[]).forEach(header => {
            const lower = header.toLowerCase();
            const found = FIELD_MAPPINGS[type].find(f => lower.includes(f.key.toLowerCase()) || lower.includes(f.label.toLowerCase()));
            if (found) {
                initialMapping[header] = found.key;
            } else {
                initialMapping[header] = "__ignore";
            }
        });
        setMapping(initialMapping);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const handleMappingChange = (header: string, field: string) => {
    setMapping(prev => ({ ...prev, [header]: field }));
  };

  const handleImport = async () => {
    if (!file || !businessId) return;
    setIsUploading(true);

    try {
      // 1. Get Upload URL
      const postUrl = await generateUploadUrl();
      
      // 2. Upload File
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": file.type },
        body: file,
      });
      const { storageId } = await result.json();

      // 3. Create Job
      await createJob({
        businessId: businessId as any,
        type,
        storageId,
        mapping: JSON.stringify(mapping),
      });

      toast.success("Import job started");
      setStep("PROCESSING");
      setTimeout(() => {
          setIsOpen(false);
          setStep("UPLOAD");
          setFile(null);
      }, 2000);

    } catch (error) {
      console.error(error);
      toast.error("Failed to start import");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
            <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import {type === "CUSTOMERS" ? "Customers" : "Products"}
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Import {type === "CUSTOMERS" ? "Customers" : "Products"}</DialogTitle>
          <DialogDescription>
            Upload an Excel or CSV file to bulk import data.
          </DialogDescription>
        </DialogHeader>

        {step === "UPLOAD" && (
            <div className="grid gap-4 py-4">
                <div className="border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center hover:bg-muted/50 transition-colors">
                    <FileSpreadsheet className="h-10 w-10 text-muted-foreground mb-4" />
                    <Label htmlFor="file-upload" className="cursor-pointer">
                        <span className="text-primary font-medium">Click to upload</span> or drag and drop
                        <br />
                        <span className="text-xs text-muted-foreground">XLSX, CSV (max 5MB)</span>
                    </Label>
                    <Input 
                        id="file-upload" 
                        type="file" 
                        accept=".csv, .xlsx, .xls" 
                        className="hidden" 
                        onChange={handleFileSelect}
                    />
                </div>
                <div className="text-xs text-muted-foreground">
                    <p>Supported columns:</p>
                    <p>{FIELD_MAPPINGS[type].map(f => f.label).join(", ")}</p>
                </div>
            </div>
        )}

        {step === "MAP" && (
            <div className="grid gap-4 py-4">
                <div className="text-sm font-medium">Map columns from your file to database fields:</div>
                <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                    {headers.map((header) => (
                        <div key={header} className="grid grid-cols-2 gap-4 items-center">
                            <div className="text-sm truncate" title={header}>{header}</div>
                            <Select 
                                value={mapping[header]} 
                                onValueChange={(val) => handleMappingChange(header, val)}
                            >
                                <SelectTrigger className="h-8">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="__ignore" className="text-muted-foreground">-- Ignore --</SelectItem>
                                    {FIELD_MAPPINGS[type].map(field => (
                                        <SelectItem key={field.key} value={field.key}>
                                            {field.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {step === "PROCESSING" && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <CheckCircle className="h-12 w-12 text-green-500" />
                <div className="text-center">
                    <h3 className="font-medium">Import Queued!</h3>
                    <p className="text-sm text-muted-foreground">Your file is being processed in the background.</p>
                </div>
            </div>
        )}

        <DialogFooter>
            {step === "MAP" && (
                <>
                    <Button variant="outline" onClick={() => setStep("UPLOAD")}>Back</Button>
                    <Button onClick={handleImport} disabled={isUploading}>
                        {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Start Import
                    </Button>
                </>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
