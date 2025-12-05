import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Download, Lock, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface G50DeclarationProps {
    business: any;
    month: string;
    year: string;
    data: any;
}

export function G50Declaration({ business, month, year, data }: G50DeclarationProps) {
    const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
    const [importValue, setImportValue] = useState("");
    const [importVat, setImportVat] = useState("");
    const [importDesc, setImportDesc] = useState("");

    // Manual Fields State
    const [manualFields, setManualFields] = useState({
        ibsAdvance: 0,
        irgSalaries: 0,
        irgEmployees: 0,
        irgDividends: 0,
        irgRcdc: 0,
        its: 0,
        tfp: 0
    });

    const addImport = useMutation(api.declarations.addImportEntry);
    const deleteImport = useMutation(api.declarations.deleteImportEntry);
    const finalize = useMutation(api.declarations.finalizeG50);
    const imports = useQuery(api.declarations.getImportEntries, {
        businessId: business._id,
        month: parseInt(month),
        year: parseInt(year)
    });

    const handleAddImport = async () => {
        if (!importValue || !importVat) return;
        await addImport({
            businessId: business._id,
            month: parseInt(month),
            year: parseInt(year),
            customsValue: parseFloat(importValue),
            vatPaid: parseFloat(importVat),
            description: importDesc,
        });
        setIsImportDialogOpen(false);
        setImportValue("");
        setImportVat("");
        setImportDesc("");
        toast.success("Import entry added");
    };

    const handleFinalize = async () => {
        if (!confirm("Are you sure you want to finalize this declaration? This will lock the data and update your VAT credit.")) return;
        try {
            await finalize({
                businessId: business._id,
                month: parseInt(month),
                year: parseInt(year),
                ...manualFields
            });
            toast.success("Declaration finalized successfully");
        } catch (e: any) {
            toast.error(e.message);
        }
    };

    const downloadCSV = () => {
        if (!data) return;
        const headers = [
            "period_month", "period_year", "business_name", "nif", "rc_number", "ai_number",
            "turnover_19_ht", "vat_19_collected", "turnover_9_ht", "vat_9_collected", "turnover_export_ht", "turnover_exempt_ht",
            "purchase_vat_19", "purchase_vat_9", "import_vat", "regularization_vat", "total_vat_deductible",
            "vat_collected_total", "vat_net_before_credit", "vat_credit_carried_forward", "vat_net_after_credit",
            "stamp_duty_total", "invoice_count", "purchase_invoice_count", "generated_at"
        ];
        
        const row = [
            data.month + 1, data.year, `"${data.businessName}"`, `"${data.businessNif}"`, `"${data.businessRc || ""}"`, `"${data.businessAi || ""}"`,
            data.turnover19.toFixed(2), data.vatCollected19.toFixed(2), data.turnover9.toFixed(2), data.vatCollected9.toFixed(2), data.turnoverExport.toFixed(2), data.turnoverExempt.toFixed(2),
            data.purchaseVat19.toFixed(2), data.purchaseVat9.toFixed(2), data.importVat.toFixed(2), data.regularizationVat.toFixed(2), data.vatDeductibleTotal.toFixed(2),
            data.vatCollectedTotal.toFixed(2), data.vatNetBeforeCredit.toFixed(2), data.previousCredit.toFixed(2), data.vatNetAfterCredit.toFixed(2),
            data.stampDutyTotal.toFixed(2), data.totalInvoicesCount, data.totalPurchasesCount, new Date().toISOString()
        ];

        const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + row.join(",");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `G50_EXPORT_${data.month + 1}_${data.year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (!data) return <div>Loading...</div>;

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">VAT Payable</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-red-600">{data.vatPayable.toLocaleString()} {business.currency}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">VAT Credit</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-green-600">{data.newCredit.toLocaleString()} {business.currency}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">TAP (0%)</CardTitle></CardHeader>
                    <CardContent><div className="text-2xl font-bold text-gray-600">0 {business.currency}</div></CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total to Pay</CardTitle></CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-primary">
                            {(data.vatPayable + data.stampDutyTotal + manualFields.ibsAdvance + manualFields.irgSalaries + manualFields.its + manualFields.tfp).toLocaleString()} {business.currency}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Manual Declarations (Page 1 & 2) */}
            <Card>
                <CardHeader><CardTitle>Other Taxes (G50 Page 1 & 2)</CardTitle></CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>IBS Advance (Acomptes)</Label>
                            <Input 
                                type="number" 
                                value={manualFields.ibsAdvance} 
                                onChange={e => setManualFields({...manualFields, ibsAdvance: parseFloat(e.target.value) || 0})}
                                disabled={data.isFinalized}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>IRG Salaries</Label>
                            <Input 
                                type="number" 
                                value={manualFields.irgSalaries} 
                                onChange={e => setManualFields({...manualFields, irgSalaries: parseFloat(e.target.value) || 0})}
                                disabled={data.isFinalized}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>ITS (1%)</Label>
                            <Input 
                                type="number" 
                                value={manualFields.its} 
                                onChange={e => setManualFields({...manualFields, its: parseFloat(e.target.value) || 0})}
                                disabled={data.isFinalized}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>TFP (1%)</Label>
                            <Input 
                                type="number" 
                                value={manualFields.tfp} 
                                onChange={e => setManualFields({...manualFields, tfp: parseFloat(e.target.value) || 0})}
                                disabled={data.isFinalized}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>IRG Dividends</Label>
                            <Input 
                                type="number" 
                                value={manualFields.irgDividends} 
                                onChange={e => setManualFields({...manualFields, irgDividends: parseFloat(e.target.value) || 0})}
                                disabled={data.isFinalized}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Detailed Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Sales */}
                <Card>
                    <CardHeader><CardTitle>Sales (Operations Taxables)</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow><TableHead>Type</TableHead><TableHead className="text-right">HT</TableHead><TableHead className="text-right">VAT</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>19% Rate</TableCell>
                                    <TableCell className="text-right">{data.turnover19.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{data.vatCollected19.toLocaleString()}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>9% Rate</TableCell>
                                    <TableCell className="text-right">{data.turnover9.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">{data.vatCollected9.toLocaleString()}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Export</TableCell>
                                    <TableCell className="text-right">{data.turnoverExport.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">0</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Exempt</TableCell>
                                    <TableCell className="text-right">{data.turnoverExempt.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">0</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Purchases */}
                <Card>
                    <CardHeader><CardTitle>Purchases & Deductions</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow><TableHead>Type</TableHead><TableHead className="text-right">VAT Amount</TableHead></TableRow>
                            </TableHeader>
                            <TableBody>
                                <TableRow>
                                    <TableCell>Purchases 19%</TableCell>
                                    <TableCell className="text-right">{data.purchaseVat19.toLocaleString()}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Purchases 9%</TableCell>
                                    <TableCell className="text-right">{data.purchaseVat9.toLocaleString()}</TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell>Imports (Customs)</TableCell>
                                    <TableCell className="text-right">{data.importVat.toLocaleString()}</TableCell>
                                </TableRow>
                            </TableBody>
                        </Table>
                        
                        {/* Imports Management */}
                        <div className="mt-4 border-t pt-4">
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="text-sm font-semibold">Import Entries</h4>
                                {!data.isFinalized && (
                                    <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                                        <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="h-3 w-3 mr-1"/> Add</Button></DialogTrigger>
                                        <DialogContent>
                                            <DialogHeader><DialogTitle>Add Import VAT</DialogTitle></DialogHeader>
                                            <div className="space-y-4 py-4">
                                                <div className="space-y-2"><Label>Description</Label><Input value={importDesc} onChange={e => setImportDesc(e.target.value)} placeholder="e.g. Customs Declaration #123" /></div>
                                                <div className="space-y-2"><Label>Customs Value (DA)</Label><Input type="number" value={importValue} onChange={e => setImportValue(e.target.value)} /></div>
                                                <div className="space-y-2"><Label>VAT Paid (DA)</Label><Input type="number" value={importVat} onChange={e => setImportVat(e.target.value)} /></div>
                                                <Button onClick={handleAddImport} className="w-full">Add Entry</Button>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                )}
                            </div>
                            {imports && imports.length > 0 ? (
                                <div className="space-y-2">
                                    {imports.map((imp: any) => (
                                        <div key={imp._id} className="flex justify-between items-center text-sm bg-muted/50 p-2 rounded">
                                            <span>{imp.description || "Import"}</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono">{imp.vatPaid.toLocaleString()} DA</span>
                                                {!data.isFinalized && (
                                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => deleteImport({ id: imp._id })}><Trash2 className="h-3 w-3" /></Button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="text-xs text-muted-foreground">No manual import entries.</p>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Stamp Duty */}
            <Card>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Stamp Duty (Droit de Timbre)</CardTitle></CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total on Cash Payments:</span>
                        <span className="text-xl font-bold">{data.stampDutyTotal.toLocaleString()} {business.currency}</span>
                    </div>
                </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-end gap-4 print:hidden">
                <Button variant="outline" onClick={downloadCSV}>
                    <Download className="mr-2 h-4 w-4" /> Export Professional CSV
                </Button>
                {!data.isFinalized ? (
                    <Button onClick={handleFinalize} variant="default">
                        <Lock className="mr-2 h-4 w-4" /> Finalize Declaration
                    </Button>
                ) : (
                    <Button disabled variant="secondary">
                        <Lock className="mr-2 h-4 w-4" /> Finalized
                    </Button>
                )}
            </div>
        </div>
    );
}