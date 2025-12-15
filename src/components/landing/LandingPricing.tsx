import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { ContactSalesDialog } from "@/components/ContactSalesDialog";
import { PRICING_PLANS } from "@/lib/pricing";

interface LandingPricingProps {
  fromDashboard?: boolean;
}

export function LandingPricing({ fromDashboard = false }: LandingPricingProps) {
  const { t, language } = useLanguage();
  const pricing = PRICING_PLANS[language as keyof typeof PRICING_PLANS] ?? PRICING_PLANS.en;

  return (
    <section id="pricing" className={`py-24 ${fromDashboard ? "" : "bg-muted/30"}`}>
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t("landing.pricing.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("landing.pricing.subtitle")}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto">
          {pricing.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative flex flex-col w-full md:w-[300px] ${
                plan.popular ? "md:-mt-4 md:mb-4 z-10" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-0 right-0 flex justify-center">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1 text-sm">
                    {t("landing.pricing.mostPopular")}
                  </Badge>
                </div>
              )}
              <Card className={`flex-1 flex flex-col ${plan.popular ? "border-primary shadow-lg" : ""}`}>
                <CardHeader>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-6 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {plan.originalPrice && (
                        <span className="line-through opacity-70 mr-2">{plan.originalPrice}</span>
                      )}
                      <span>{plan.billingNote}</span>
                    </div>
                  </div>
                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feature, i) => (
                      <li key={feature + i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 space-y-1 text-sm font-semibold">
                    <p>{plan.userCount}</p>
                    <p>{plan.storage}</p>
                  </div>
                </CardContent>
                <CardFooter>
                  {plan.id === "enterprise" ? (
                    <ContactSalesDialog planName={plan.name}>
                      <Button className="w-full" variant={plan.popular ? "default" : "outline"}>
                        {plan.cta}
                      </Button>
                    </ContactSalesDialog>
                  ) : (
                    <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                      {fromDashboard ? (
                        <Link to="/settings?tab=subscription">
                          {t("settings.subscription.upgrade")}
                        </Link>
                      ) : (
                        <Link to={`/auth?plan=${plan.id}`}>
                          {plan.cta}
                        </Link>
                      )}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}