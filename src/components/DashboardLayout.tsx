import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
            <div className="flex items-center p-4 border-b">
                <SidebarTrigger />
                <div className="ml-4 font-semibold">InvoiceFlow</div>
            </div>
            <div className="flex-1 overflow-auto p-6">
                <div className="mx-auto max-w-7xl w-full">
                    {children}
                </div>
            </div>
        </main>
        <Toaster />
      </div>
    </SidebarProvider>
  );
}