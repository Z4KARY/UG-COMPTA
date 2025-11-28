import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, FileText, Shield, Zap, Globe } from "lucide-react";
import { Link } from "react-router";

export default function Landing() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <span>InvoiceFlow</span>
          </div>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <Button asChild variant="default" className="rounded-full shadow-lg shadow-primary/20">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link to="/auth" className="text-sm font-medium hover:text-primary transition-colors hidden sm:block">
                  Sign In
                </Link>
                <Button asChild className="rounded-full shadow-lg shadow-primary/20">
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20">
                New: AI-Powered OCR Support
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground">
                Invoicing for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Algerian Business</span>
                <br /> Made Simple.
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                The complete financial operating system for Algerian companies. 
                Handle TVA, Timbre Fiscal, and compliance effortlessly.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Button size="lg" className="rounded-full text-lg h-12 px-8 shadow-xl shadow-primary/20" asChild>
                  <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                    Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full text-lg h-12 px-8" asChild>
                   <Link to="/auth">View Demo</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to run your business</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Built specifically for the Algerian market, ensuring 100% compliance with local regulations.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: CheckCircle2,
                  title: "Algerian Compliance",
                  description: "Automatic calculation of Timbre Fiscal, TVA, and legal requirements tailored for DZ businesses."
                },
                {
                  icon: Zap,
                  title: "Lightning Fast",
                  description: "Create and send invoices in seconds. Streamlined workflow designed for efficiency."
                },
                {
                  icon: Shield,
                  title: "Secure & Reliable",
                  description: "Your data is encrypted and backed up automatically. Bank-grade security for your peace of mind."
                },
                {
                  icon: FileText,
                  title: "Professional PDF",
                  description: "Generate beautiful, branded PDF invoices that look professional on any device."
                },
                {
                  icon: Globe,
                  title: "Access Anywhere",
                  description: "Cloud-based platform allows you to manage your business from the office or on the go."
                },
                {
                  icon: CheckCircle2,
                  title: "Smart Management",
                  description: "Track payments, manage customers, and get insights into your revenue streams."
                }
              ].map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
                >
                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-3xl p-8 md:p-16 text-center text-primary-foreground relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]"></div>
              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to modernize your invoicing?</h2>
                <p className="text-primary-foreground/80 text-lg">
                  Join thousands of Algerian businesses using InvoiceFlow to streamline their operations.
                </p>
                <Button size="lg" variant="secondary" className="rounded-full h-12 px-8 text-primary font-bold shadow-lg" asChild>
                  <Link to="/auth">Get Started Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-xl mb-4">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                </div>
                <span>InvoiceFlow</span>
              </div>
              <p className="text-muted-foreground max-w-xs">
                The #1 invoicing solution for Algerian businesses. Simple, compliant, and powerful.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary">Features</Link></li>
                <li><Link to="#" className="hover:text-primary">Pricing</Link></li>
                <li><Link to="#" className="hover:text-primary">Security</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary">About</Link></li>
                <li><Link to="#" className="hover:text-primary">Contact</Link></li>
                <li><Link to="#" className="hover:text-primary">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 InvoiceFlow. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}