import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { useLocation, useNavigate } from "react-router";
import { useAuth } from "@/hooks/use-auth";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const pathSegments = location.pathname.split("/").filter(Boolean);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/auth");
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-muted/30">
        <div className="print:hidden">
          <AppSidebar />
        </div>
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden transition-all duration-300 ease-in-out print:h-auto print:overflow-visible">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b bg-background/50 backdrop-blur-sm px-4 sticky top-0 z-10 print:hidden">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <Breadcrumb className="overflow-hidden">
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="/dashboard">InvoiceFlow</BreadcrumbLink>
                    </BreadcrumbItem>
                    {pathSegments.map((segment, index) => {
                      const isLast = index === pathSegments.length - 1;
                      // Check if segment is likely an ID (long alphanumeric)
                      const isId = segment.length > 20 && /^[a-zA-Z0-9]+$/.test(segment);
                      const displayName = isId ? "Details" : segment.replace(/-/g, " ");

                      return (
                        <div key={segment} className="flex items-center">
                          <BreadcrumbSeparator className="hidden md:block" />
                          <BreadcrumbItem>
                            {isLast ? (
                              <BreadcrumbPage className="capitalize">{displayName}</BreadcrumbPage>
                            ) : (
                              <BreadcrumbLink href={`/${pathSegments.slice(0, index + 1).join("/")}`} className="capitalize">
                                {displayName}
                              </BreadcrumbLink>
                            )}
                          </BreadcrumbItem>
                        </div>
                      );
                    })}
                  </BreadcrumbList>
                </Breadcrumb>
            </header>
            <div className="flex-1 overflow-auto p-4 md:p-8 pt-6 print:p-0 print:overflow-visible">
                <div className="mx-auto max-w-7xl w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 print:max-w-none print:w-full print:m-0 print:space-y-0">
                    {children}
                </div>
            </div>
        </main>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}