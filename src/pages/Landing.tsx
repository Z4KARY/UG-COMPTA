import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { 
  ArrowRight, 
  CheckCircle2, 
  FileText, 
  Shield, 
  Zap, 
  Globe, 
  Star,
  Building2,
  Users,
  CreditCard,
  Menu,
  X,
  ChevronDown
} from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export default function Landing() {
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  const features = [
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
      icon: Users,
      title: "Client Management",
      description: "Keep track of your customers, their history, and outstanding balances in one place."
    }
  ];

  const testimonials = [
    {
      name: "Amine Benali",
      role: "Auto-Entrepreneur",
      content: "InvoiceFlow changed how I manage my freelance work. The G12 export saved me hours during tax season.",
      avatar: "AB"
    },
    {
      name: "Sarah Khelil",
      role: "CEO, TechDz",
      content: "Finally, software that understands Algerian tax laws. The support for Timbre Fiscal is spot on.",
      avatar: "SK"
    },
    {
      name: "Mohamed Idir",
      role: "Founder, StartUp Algiers",
      content: "Beautiful interface and very easy to use. My accountant loves the export features.",
      avatar: "MI"
    }
  ];

  const pricing = [
    {
      name: "Auto-Entrepreneur",
      price: "Free",
      description: "Perfect for freelancers and consultants.",
      features: [
        "Unlimited Invoices",
        "Client Management",
        "G12 Reports",
        "Timbre Fiscal Calculation",
        "PDF Exports"
      ],
      cta: "Get Started",
      popular: false
    },
    {
      name: "Small Business",
      price: "2000 DA",
      period: "/month",
      description: "For growing companies with VAT needs.",
      features: [
        "Everything in Free",
        "G50 Declarations",
        "VAT Management",
        "Expense Tracking",
        "Priority Support",
        "Multi-user Access"
      ],
      cta: "Start Free Trial",
      popular: true
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations with specific needs.",
      features: [
        "Everything in Small Business",
        "Custom Integrations",
        "Dedicated Account Manager",
        "SLA Support",
        "On-premise Options"
      ],
      cta: "Contact Sales",
      popular: false
    }
  ];

  const faqs = [
    {
      question: "Is InvoiceFlow compliant with Algerian tax laws?",
      answer: "Yes, InvoiceFlow is built specifically for the Algerian market. We handle TVA, Timbre Fiscal, and generate data for G50 and G12 declarations."
    },
    {
      question: "Can I use it as an Auto-Entrepreneur?",
      answer: "Absolutely! We have a dedicated mode for Auto-Entrepreneurs that simplifies the interface, removes VAT fields, and handles the specific reporting requirements."
    },
    {
      question: "Is my data secure?",
      answer: "We use bank-grade encryption to store your data. Your information is backed up daily and we strictly adhere to data privacy regulations."
    },
    {
      question: "Can I export my data?",
      answer: "Yes, you can export your invoices, customers, and reports to PDF, Excel, or CSV formats at any time."
    }
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-primary/20 overflow-x-hidden">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <span>InvoiceFlow</span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">Features</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">Pricing</a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">Testimonials</a>
            <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">FAQ</a>
            {isAuthenticated ? (
              <Button asChild variant="default" className="rounded-full shadow-lg shadow-primary/20">
                <Link to="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/auth" className="text-sm font-medium hover:text-primary transition-colors">
                  Sign In
                </Link>
                <Button asChild className="rounded-full shadow-lg shadow-primary/20">
                  <Link to="/auth">Get Started</Link>
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2" onClick={toggleMenu}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden absolute top-16 left-0 w-full bg-background border-b p-4 flex flex-col gap-4 shadow-xl"
          >
            <a href="#features" className="text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={toggleMenu}>Features</a>
            <a href="#pricing" className="text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={toggleMenu}>Pricing</a>
            <a href="#testimonials" className="text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={toggleMenu}>Testimonials</a>
            <Link to="/auth" className="text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={toggleMenu}>Sign In</Link>
            <Button asChild className="w-full">
              <Link to="/auth">Get Started</Link>
            </Button>
          </motion.div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-1/2 top-0 -z-10 m-auto h-[310px] w-[310px] -translate-x-1/2 rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              style={{ opacity, scale }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20"
              >
                New: AI-Powered OCR Support
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground"
              >
                Invoicing for <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">Algerian Business</span>
                <br /> Made Simple.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              >
                The complete financial operating system for Algerian companies. 
                Handle TVA, Timbre Fiscal, and compliance effortlessly.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
              >
                <Button size="lg" className="rounded-full text-lg h-12 px-8 shadow-xl shadow-primary/20 transition-transform hover:scale-105" asChild>
                  <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                    Start for Free <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full text-lg h-12 px-8 transition-transform hover:scale-105" asChild>
                   <Link to="/auth">View Demo</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* Trusted By Section */}
        <section className="py-16 border-y bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm font-bold text-muted-foreground/80 mb-10 uppercase tracking-widest">Trusted by forward-thinking companies</p>
            <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-24">
              <img 
                src="https://harmless-tapir-303.convex.cloud/api/storage/4e7cc034-a414-43c2-a72f-cfea36b14e8e" 
                alt="UpGrowth" 
                className="h-12 md:h-14 w-auto object-contain transition-transform hover:scale-105"
              />
              <img 
                src="https://harmless-tapir-303.convex.cloud/api/storage/360ad36b-e195-467f-80b4-05af3785761f" 
                alt="UpGrowth Connect" 
                className="h-8 md:h-10 w-auto object-contain transition-transform hover:scale-105"
              />
              <img 
                src="https://harmless-tapir-303.convex.cloud/api/storage/ef75208c-7736-4b74-b7f4-a8a8aa9cc483" 
                alt="FA Management Solutions" 
                className="h-32 md:h-40 w-auto object-contain transition-transform hover:scale-105"
              />
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Everything you need to run your business</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Built specifically for the Algerian market, ensuring 100% compliance with local regulations.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className="bg-card p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1 group"
                >
                  <div className="h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 group-hover:bg-primary/20 transition-colors">
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

        {/* Pricing Section */}
        <section id="pricing" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Simple, Transparent Pricing</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Choose the plan that fits your business stage. No hidden fees.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {pricing.map((plan, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative flex flex-col ${plan.popular ? 'md:-mt-4 md:mb-4 z-10' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-0 right-0 flex justify-center">
                      <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm">Most Popular</Badge>
                    </div>
                  )}
                  <Card className={`flex-1 flex flex-col ${plan.popular ? 'border-primary shadow-lg' : ''}`}>
                    <CardHeader>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <div className="mb-6">
                        <span className="text-4xl font-bold">{plan.price}</span>
                        {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                      </div>
                      <ul className="space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter>
                      <Button 
                        className="w-full" 
                        variant={plan.popular ? "default" : "outline"}
                        asChild
                      >
                        <Link to="/auth">{plan.cta}</Link>
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Loved by Algerian Businesses</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Don't just take our word for it. Here's what our users have to say.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-muted relative shrink-0 border">
                          <img 
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${testimonial.avatar}`} 
                            alt={testimonial.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{testimonial.name}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground text-lg">
                Everything you need to know about InvoiceFlow.
              </p>
            </div>

            <div className="w-full max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-border">
                  <button
                    className="flex flex-1 items-center justify-between py-4 font-medium transition-all hover:text-primary w-full text-left"
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  >
                    {faq.question}
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${openFaqIndex === index ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {openFaqIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-4 pt-0 text-muted-foreground">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-3xl p-8 md:p-16 text-center text-primary-foreground relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]"></div>
              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to modernize your invoicing?</h2>
                <p className="text-primary-foreground/80 text-lg">
                  Join thousands of Algerian businesses using InvoiceFlow to streamline their operations.
                </p>
                <Button size="lg" variant="secondary" className="rounded-full h-12 px-8 text-primary font-bold shadow-lg transition-transform hover:scale-105" asChild>
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
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">Login</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary transition-colors">About</Link></li>
                <li><Link to="#" className="hover:text-primary transition-colors">Contact</Link></li>
                <li><Link to="#" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
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