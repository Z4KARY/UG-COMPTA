import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";

export function LandingPricing() {
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
    },
  ];

  return (
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
  );
}
