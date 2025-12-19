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
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { useLanguage } from "@/contexts/LanguageContext";

export function AdminFiscal() {
  const { t } = useLanguage();
  const globalParams = useQuery(api.admin.getGlobalFiscalParameters);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("admin.fiscal.title") || "Fiscal Configuration"}</CardTitle>
        <CardDescription>
          {t("admin.fiscal.description") || "Global fiscal parameters and tax rates"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("admin.table.code") || "Code"}</TableHead>
              <TableHead>{t("admin.table.effectiveFrom") || "Effective From"}</TableHead>
              <TableHead>{t("admin.table.value") || "Value"}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {globalParams?.map((p) => (
              <TableRow key={p._id}>
                <TableCell className="font-mono">{p.code}</TableCell>
                <TableCell>{new Date(p.effectiveFrom).toLocaleDateString()}</TableCell>
                <TableCell>
                  <pre className="text-xs bg-muted p-2 rounded overflow-auto max-w-[300px] max-h-[100px]">
                    {JSON.stringify(p.value, null, 2)}
                  </pre>
                </TableCell>
              </TableRow>
            ))}
            {globalParams?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  {t("admin.fiscal.empty") || "No global parameters defined"}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <div className="mt-4 p-4 bg-blue-50 text-blue-800 rounded-md text-sm">
          <p>{t("admin.fiscal.note") || "Note: These parameters apply to all businesses unless overridden."}</p>
        </div>
      </CardContent>
    </Card>
  );
}
