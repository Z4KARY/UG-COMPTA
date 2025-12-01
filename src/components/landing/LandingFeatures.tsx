import { motion } from "framer-motion";
import { CheckCircle2, Zap, Shield, FileText, Globe, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

export function LandingFeatures() {
  const { t } = useLanguage();
  
  const features = [
    {
      icon: CheckCircle2,
      title: t("landing.features.compliance.title"),
      description: t("landing.features.compliance.desc")
    },
    {
      icon: Zap,
      title: t("landing.features.fast.title"),
      description: t("landing.features.fast.desc")
    },
    {
      icon: Shield,
      title: t("landing.features.secure.title"),
      description: t("landing.features.secure.desc")
    },
    {
      icon: FileText,
      title: t("landing.features.pdf.title"),
      description: t("landing.features.pdf.desc")
    },
    {
      icon: Globe,
      title: t("landing.features.access.title"),
      description: t("landing.features.access.desc")
    },
    {
      icon: Users,
      title: t("landing.features.clients.title"),
      description: t("landing.features.clients.desc")
    }
  ];

  return (
    <section id="features" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{t("landing.features.title")}</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {t("landing.features.subtitle")}
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