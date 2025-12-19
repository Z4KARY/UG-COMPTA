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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { SetupRequired } from "@/components/SetupRequired";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Invoices() {
  const { t } = useLanguage();
  const business = useQuery(api.businesses.getMyBusiness, {});
  const invoices = useQuery(
    api.invoices.list,
    business ? { businessId: business._id } : "skip"
  );
  const deleteInvoice = useMutation(api.invoices.remove);

  // Pagination & Sorting State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: "asc" | "desc" } | null>(null);
  const [filterType, setFilterType] = useState<string>("all");

  const handleDelete = async (id: Id<"invoices">) => {
    if (confirm(t("invoices.deleteConfirm"))) {
      try {
        await deleteInvoice({ id });
        toast.success(t("invoices.deleteSuccess"));
      } catch (error) {
        toast.error(t("invoices.deleteError"));
      }
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-green-500/10 text-green-500 hover:bg-green-500/20";
      case "issued":
        return "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20";
      case "overdue":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      case "draft":
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
      case "cancelled":
        return "bg-red-500/10 text-red-500 hover:bg-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-500 hover:bg-gray-500/20";
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "invoice":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-200";
      case "quote":
        return "bg-orange-500/10 text-orange-500 border-orange-200";
      case "credit_note":
        return "bg-red-500/10 text-red-500 border-red-200";
      case "pro_forma":
        return "bg-blue-500/10 text-blue-500 border-blue-200";
      case "delivery_note":
        return "bg-emerald-500/10 text-emerald-500 border-emerald-200";
      case "sale_order":
        return "bg-violet-500/10 text-violet-500 border-violet-200";
      default:
        return "bg-gray-500/10 text-gray-500 border-gray-200";
    }
  };

  // Filtering Logic
  const filteredInvoices = (invoices || []).filter((invoice) => {
    if (filterType === "all") return true;
    return invoice.type === filterType;
  });

  // Sorting Logic
  const sortedInvoices = [...filteredInvoices].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    
    let aValue: any = a[key as keyof typeof a];
    let bValue: any = b[key as keyof typeof b];

    // Handle nested or specific keys
    if (key === "customerName") {
        aValue = a.customerName?.toLowerCase() || "";
        bValue = b.customerName?.toLowerCase() || "";
    } else if (key === "totalTtc") {
        aValue = a.totalTtc;
        bValue = b.totalTtc;
    } else if (key === "issueDate") {
        aValue = a.issueDate;
        bValue = b.issueDate;
    }

    if (aValue < bValue) return direction === "asc" ? -1 : 1;
    if (aValue > bValue) return direction === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(sortedInvoices.length / itemsPerPage);
  const paginatedInvoices = sortedInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (sortConfig && sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  if (business === undefined) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (business === null || !business.type) {
    return <SetupRequired />;
  }

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("invoices.title")}</h1>
          <p className="text-muted-foreground">{t("invoices.description")}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder={t("invoices.filterByType")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("invoices.filterAll")}</SelectItem>
              <SelectItem value="invoice">{t("invoiceForm.type.invoice")}</SelectItem>
              <SelectItem value="quote">{t("invoiceForm.type.quote")}</SelectItem>
              <SelectItem value="credit_note">{t("invoiceForm.type.creditNote")}</SelectItem>
              <SelectItem value="pro_forma">{t("invoiceForm.type.proForma")}</SelectItem>
              <SelectItem value="delivery_note">{t("invoiceForm.type.deliveryNote")}</SelectItem>
              <SelectItem value="sale_order">{t("invoiceForm.type.saleOrder")}</SelectItem>
            </SelectContent>
          </Select>
          <Button asChild className="w-full sm:w-auto">
            <Link to="/invoices/new">
              <Plus className="mr-2 h-4 w-4" /> {t("invoices.createNew")}
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("invoices.documents")}</CardTitle>
          <CardDescription>
            {t("invoices.listDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden md:table-cell">{t("invoices.type")}</TableHead>
                  <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort("invoiceNumber")}>
                      {t("invoices.number")} <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort("customerName")}>
                      {t("invoices.customer")} <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead className="cursor-pointer whitespace-nowrap hidden md:table-cell" onClick={() => handleSort("issueDate")}>
                      {t("invoices.date")} <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead className="cursor-pointer whitespace-nowrap" onClick={() => handleSort("totalTtc")}>
                      {t("invoices.amount")} <ArrowUpDown className="ml-2 h-4 w-4 inline" />
                  </TableHead>
                  <TableHead>{t("invoices.status")}</TableHead>
                  <TableHead className="text-right">{t("invoices.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedInvoices.map((invoice) => (
                  <TableRow key={invoice._id}>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className={`capitalize whitespace-nowrap ${getTypeColor(invoice.type || 'invoice')}`}>
                        {t(`invoiceForm.type.${invoice.type || 'invoice'}` as any)}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium whitespace-nowrap text-xs sm:text-sm">
                      {invoice.invoiceNumber}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs sm:text-sm max-w-[100px] truncate sm:max-w-none" title={invoice.customerName}>
                      {invoice.customerName}
                    </TableCell>
                    <TableCell className="whitespace-nowrap hidden md:table-cell">
                      {new Date(invoice.issueDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-xs sm:text-sm">
                      {invoice.totalTtc.toLocaleString()} {invoice.currency}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${getStatusColor(invoice.status)} text-[10px] sm:text-xs px-1 sm:px-2`}
                      >
                        {t(`invoices.status.${invoice.status}` as any) || invoice.status.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" asChild className="h-8 px-2 text-xs sm:text-sm">
                          <Link to={`/invoices/${invoice._id}`}>{t("invoices.view")}</Link>
                          </Button>
                          <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive hover:text-destructive hidden sm:inline-flex"
                              onClick={() => handleDelete(invoice._id)}
                          >
                              <Trash2 className="h-4 w-4" />
                          </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {invoices?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      {t("invoices.empty")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    <ChevronLeft className="h-4 w-4" />
                    {t("common.previous") || "Previous"}
                </Button>
                <div className="text-sm font-medium">
                    {t("common.pageOf") ? t("common.pageOf").replace("{current}", currentPage.toString()).replace("{total}", totalPages.toString()) : `Page ${currentPage} of ${totalPages}`}
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    {t("common.next") || "Next"}
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}