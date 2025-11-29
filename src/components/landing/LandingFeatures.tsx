import { motion } from "framer-motion";
import { CheckCircle2, Zap, Shield, FileText, Globe, Users } from "lucide-react";

export function LandingFeatures() {
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

  return (
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
  );
}
