import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";

export function LandingPricing() {
  const { t } = useLanguage();

  const pricing = [
    {
      name: t("landing.pricing.auto.name"),
      price: "Free",
      description: t("landing.pricing.auto.desc"),
      features: [
        t("landing.pricing.features.unlimited"),
        t("landing.pricing.features.clients"),
        t("landing.pricing.features.g12"),
        t("landing.pricing.features.timbre"),
        t("landing.pricing.features.pdf")
      ],
      cta: t("landing.pricing.auto.cta"),
      popular: false
    },
    {
      name: t("landing.pricing.small.name"),
      price: "2000 DA",
      period: "/month",
      description: t("landing.pricing.small.desc"),
      features: [
        t("landing.pricing.features.unlimited"),
        t("landing.pricing.features.g50"),
        t("landing.pricing.features.vat"),
        t("landing.pricing.features.expenses"),
        t("landing.pricing.features.support"),
        t("landing.pricing.features.multiuser")
      ],
      cta: t("landing.pricing.small.cta"),
      popular: true
    },
    {
      name: t("landing.pricing.enterprise.name"),
      price: "Custom",
      description: t("landing.pricing.enterprise.desc"),
      features: [
        t("landing.pricing.features.multiuser"),
        t("landing.pricing.features.custom"),
        t("landing.pricing.features.manager"),
        t("landing.pricing.features.sla"),
        t("landing.pricing.features.onprem")
      ],
      cta: t("landing.pricing.enterprise.cta"),
      popular: false
    },
  ];

  return (
    <section id="pricing" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{t("landing.pricing.title")}</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                {t("landing.pricing.subtitle")}
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
                      <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm">{t("landing.pricing.mostPopular")}</Badge>
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
  );
}