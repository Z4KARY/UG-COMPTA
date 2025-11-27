import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { FileText, Download } from "lucide-react";
import { useState } from "react";

export default function Declarations() {
  const business = useQuery(api.businesses.getMyBusiness);
  
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth().toString());

  const g50Data = useQuery(api.declarations.getG50Data, 
    business ? { 
        businessId: business._id, 
        month: parseInt(selectedMonth), 
        year: parseInt(selectedYear) 
    } : "skip"
  );

  const g12Data = useQuery(api.declarations.getG12Data,
    business ? {
        businessId: business._id,
        year: parseInt(selectedYear)
    } : "skip"
  );

  if (!business) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <p>Please set up your business profile first.</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Declarations</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* G50 Monthly Declaration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                G50 Monthly Declaration
            </CardTitle>
            <CardDescription>
              Monthly declaration of taxes (TVA, TAP, Stamp Duty).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent>
                        {Array.from({ length: 12 }).map((_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {g50Data ? (
                <div className="space-y-2 border rounded-md p-4 bg-muted/20">
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Turnover (HT):</span>
                        <span className="font-medium">{g50Data.turnoverHt.toLocaleString()} {business.currency}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">TVA Collected:</span>
                        <span className="font-medium">{g50Data.tvaCollected.toLocaleString()} {business.currency}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Stamp Duty (Cash):</span>
                        <span className="font-medium">{g50Data.stampDutyTotal.toLocaleString()} {business.currency}</span>
                    </div>
                    <div className="pt-2 border-t mt-2">
                        <Button variant="outline" className="w-full">
                            <Download className="mr-2 h-4 w-4" /> Export G50 Data
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="p-4 text-center text-muted-foreground">Loading data...</div>
            )}
          </CardContent>
        </Card>

        {/* G12 Annual Declaration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                G12 / G12bis Annual
            </CardTitle>
            <CardDescription>
              Annual turnover declaration for IFU or Real regime.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <div className="flex gap-4">
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="2024">2024</SelectItem>
                        <SelectItem value="2025">2025</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {g12Data ? (
                <div className="space-y-2 border rounded-md p-4 bg-muted/20">
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Fiscal Regime:</span>
                        <span className="font-medium">{g12Data.fiscalRegime}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Annual Turnover (HT):</span>
                        <span className="font-medium">{g12Data.turnoverHt.toLocaleString()} {business.currency}</span>
                    </div>
                    <div className="pt-2 border-t mt-2">
                        <Button variant="outline" className="w-full">
                            <Download className="mr-2 h-4 w-4" /> Export G12 Data
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="p-4 text-center text-muted-foreground">Loading data...</div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
