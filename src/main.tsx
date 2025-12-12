import { Toaster } from "@/components/ui/sonner";
import { InstrumentationProvider } from "@/instrumentation.tsx";
import { ConvexAuthProvider } from "@convex-dev/auth/react";
import { ConvexReactClient } from "convex/react";
import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Route, Routes, useLocation } from "react-router";
import "./index.css";
import "./types/global.d.ts";
import { LanguageProvider } from "@/contexts/LanguageContext";

// Pages
import Landing from "@/pages/Landing.tsx";
import AuthPage from "@/pages/Auth.tsx";
import Dashboard from "@/pages/Dashboard.tsx";
import BusinessSettings from "@/pages/BusinessSettings.tsx";
import Customers from "@/pages/Customers.tsx";
import Products from "@/pages/Products.tsx";
import Invoices from "@/pages/Invoices.tsx";
import InvoiceCreate from "@/pages/InvoiceCreate.tsx";
import InvoiceDetail from "@/pages/InvoiceDetail.tsx";
import Declarations from "@/pages/Declarations.tsx";
import Admin from "@/pages/Admin.tsx";
import Purchases from "@/pages/Purchases.tsx";
import PurchaseCreate from "@/pages/PurchaseCreate.tsx";
import PurchaseDetail from "@/pages/PurchaseDetail.tsx";
import Suppliers from "@/pages/Suppliers.tsx";
import NotFound from "@/pages/NotFound.tsx";
import Onboarding from "@/pages/Onboarding.tsx";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

function RouteSyncer() {
  const location = useLocation();
  useEffect(() => {
    window.parent.postMessage(
      { type: "iframe-route-change", path: location.pathname },
      "*",
    );
  }, [location.pathname]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.data?.type === "navigate") {
        if (event.data.direction === "back") window.history.back();
        if (event.data.direction === "forward") window.history.forward();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return null;
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <LanguageProvider>
      <InstrumentationProvider>
        <ConvexAuthProvider client={convex}>
          <BrowserRouter>
            <RouteSyncer />
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<AuthPage redirectAfterAuth="/dashboard" />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/settings" element={<BusinessSettings />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/products" element={<Products />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/new" element={<InvoiceCreate />} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/purchases/new" element={<PurchaseCreate />} />
              <Route path="/purchases/:id" element={<PurchaseDetail />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/declarations" element={<Declarations />} />
              <Route path="/admin" element={<Admin />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
          <Toaster />
        </ConvexAuthProvider>
      </InstrumentationProvider>
    </LanguageProvider>
  </StrictMode>,
);