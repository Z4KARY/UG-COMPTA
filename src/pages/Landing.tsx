import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, FileText } from "lucide-react";
import { Link } from "react-router";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <FileText className="h-6 w-6" />
            <span>InvoiceFlow</span>
          </div>
          <nav>
            {isAuthenticated ? (
              <Button asChild>
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <Button asChild>
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="py-20 px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Professional Invoicing for Algerian Businesses
            </h1>
            <p className="text-xl text-muted-foreground">
              Create compliant invoices, manage customers, and track your revenue
              with ease. The simple, PC-first solution for your business.
            </p>
            <div className="flex justify-center gap-4 pt-4">
              <Button size="lg" asChild>
                <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                  Get Started <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </motion.div>
        </section>

        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <CheckCircle2 className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Algerian Compliance</h3>
                <p className="text-muted-foreground">
                  Automatic calculation of Timbre Fiscal, TVA, and legal
                  requirements for Algerian businesses.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <CheckCircle2 className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Easy Management</h3>
                <p className="text-muted-foreground">
                  Manage customers, products, and invoices in one place with a
                  clean, intuitive interface.
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border shadow-sm">
                <CheckCircle2 className="h-10 w-10 text-primary mb-4" />
                <h3 className="text-xl font-bold mb-2">Instant PDF</h3>
                <p className="text-muted-foreground">
                  Generate professional PDF invoices instantly and share them with
                  your clients.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        <div className="container mx-auto px-4">
          <p>&copy; 2024 InvoiceFlow. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}