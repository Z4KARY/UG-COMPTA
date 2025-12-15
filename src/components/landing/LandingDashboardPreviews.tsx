import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { FileText, Users, Package, TrendingUp, Receipt, FileBarChart } from "lucide-react";

export function LandingDashboardPreviews() {
  const { t } = useLanguage();

  const previews = [
    {
      icon: TrendingUp,
      title: t("landing.previews.dashboard.title") || "Dashboard Overview",
      description: t("landing.previews.dashboard.desc") || "Real-time financial insights and KPIs at a glance",
      image: "https://harmless-tapir-303.convex.cloud/api/storage/ef75208c-7736-4b74-b7f4-a8a8aa9cc483",
      gradient: "from-blue-500/10 to-cyan-500/10"
    },
    {
      icon: FileText,
      title: t("landing.previews.invoicing.title") || "Smart Invoicing",
      description: t("landing.previews.invoicing.desc") || "Create professional invoices with automatic TVA and Timbre Fiscal calculations",
      image: "https://harmless-tapir-303.convex.cloud/api/storage/ef75208c-7736-4b74-b7f4-a8a8aa9cc483",
      gradient: "from-purple-500/10 to-pink-500/10"
    },
    {
      icon: Users,
      title: t("landing.previews.customers.title") || "Customer Management",
      description: t("landing.previews.customers.desc") || "Organize and track all your customer information in one place",
      image: "https://harmless-tapir-303.convex.cloud/api/storage/ef75208c-7736-4b74-b7f4-a8a8aa9cc483",
      gradient: "from-green-500/10 to-emerald-500/10"
    },
    {
      icon: Receipt,
      title: t("landing.previews.purchases.title") || "Purchase Tracking",
      description: t("landing.previews.purchases.desc") || "Monitor expenses and supplier invoices with VAT deduction tracking",
      image: "https://harmless-tapir-303.convex.cloud/api/storage/ef75208c-7736-4b74-b7f4-a8a8aa9cc483",
      gradient: "from-orange-500/10 to-red-500/10"
    },
    {
      icon: FileBarChart,
      title: t("landing.previews.declarations.title") || "Fiscal Declarations",
      description: t("landing.previews.declarations.desc") || "Automated G50 and G12 declaration generation with compliance checks",
      image: "https://harmless-tapir-303.convex.cloud/api/storage/ef75208c-7736-4b74-b7f4-a8a8aa9cc483",
      gradient: "from-indigo-500/10 to-violet-500/10"
    },
    {
      icon: Package,
      title: t("landing.previews.products.title") || "Product Catalog",
      description: t("landing.previews.products.desc") || "Manage your product inventory with pricing and tax configurations",
      image: "https://harmless-tapir-303.convex.cloud/api/storage/ef75208c-7736-4b74-b7f4-a8a8aa9cc483",
      gradient: "from-yellow-500/10 to-amber-500/10"
    }
  ];

  return (
    <section id="previews" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              {t("landing.previews.title") || "Powerful Features in Action"}
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("landing.previews.subtitle") || "Explore how UGCOMPTA streamlines your business operations"}
            </p>
          </motion.div>
        </div>

        <div className="space-y-24">
          {previews.map((preview, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-8 lg:gap-12 items-center`}
            >
              {/* Content Side */}
              <div className="flex-1 space-y-6">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br ${preview.gradient} border shadow-sm`}>
                  <preview.icon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-2xl md:text-3xl font-bold mb-3">{preview.title}</h3>
                  <p className="text-muted-foreground text-lg leading-relaxed">
                    {preview.description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-primary"></span>
                    {t("landing.previews.badge.compliant") || "Algerian Compliant"}
                  </div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-medium">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    {t("landing.previews.badge.realtime") || "Real-time Updates"}
                  </div>
                </div>
              </div>

              {/* Preview Image Side */}
              <div className="flex-1 w-full">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                  className="relative group"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${preview.gradient} rounded-2xl blur-2xl opacity-50 group-hover:opacity-70 transition-opacity`}></div>
                  <div className="relative rounded-2xl border-2 bg-background/50 backdrop-blur-sm p-2 shadow-2xl overflow-hidden">
                    <div className="aspect-video rounded-lg overflow-hidden bg-muted/50 flex items-center justify-center">
                      <img
                        src={preview.image}
                        alt={preview.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
