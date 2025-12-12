import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";

const localizedPricing = {
  en: [
    {
      id: "free",
      name: "Auto-Entrepreneur",
      description: "Perfect for freelancers and consultants.",
      price: "12,000 DZD",
      originalPrice: "24,000 DZD",
      period: "/year",
      billingNote: "Billed annually",
      features: [
        "Unlimited Invoices",
        "G12 Reports",
        "Client Management",
        "Digital stamp & signature",
        "Quote conversion",
        "Expense management",
        "Email sending",
        "Online support",
      ],
      userCount: "1 user",
      storage: "1 GB storage",
      cta: "Start free",
      popular: false,
    },
    {
      id: "startup",
      name: "Startup",
      description: "For small teams getting started.",
      price: "24,000 DZD",
      originalPrice: "36,000 DZD",
      period: "/year",
      billingNote: "Billed annually",
      features: [
        "Everything in Auto-Entrepreneur",
        "Up to 2 Users",
        "Basic Reporting",
        "Expense Tracking",
        "Payment Reminders",
        "Standard Support",
      ],
      userCount: "2 users",
      storage: "2 GB storage",
      cta: "Get Started",
      popular: false,
    },
    {
      id: "pro",
      name: "Small Business",
      description: "For growing businesses needing VAT workflows.",
      price: "39,000 DZD",
      originalPrice: "54,000 DZD",
      period: "/year",
      billingNote: "Billed annually",
      features: [
        "Everything in Startup",
        "G50 Declarations",
        "VAT Management",
        "Role management",
        "Transactions",
        "Priority Support",
        "Multi-user Access",
      ],
      userCount: "3 users",
      storage: "5 GB storage",
      cta: "Free trial",
      popular: true,
    },
    {
      id: "premium",
      name: "Premium",
      description: "Advanced tools for scaling companies.",
      price: "69,000 DZD",
      originalPrice: "89,000 DZD",
      period: "/year",
      billingNote: "Billed annually",
      features: [
        "Everything in Small Business",
        "Up to 5 Users",
        "Advanced Analytics",
        "Inventory Management",
        "Multi-currency",
        "Dedicated Support",
      ],
      userCount: "5 users",
      storage: "10 GB storage",
      cta: "Get Premium",
      popular: false,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For large organizations with specific needs.",
      price: "Custom",
      originalPrice: undefined,
      period: "/year",
      billingNote: "Billed annually",
      features: [
        "Unlimited users",
        "Custom Integrations",
        "Dedicated Account Manager",
        "SLA Support",
        "On-premise Options",
        "Advanced Security",
        "API Access",
        "Training & Onboarding",
      ],
      userCount: "Unlimited users",
      storage: "Unlimited storage",
      cta: "Contact sales",
      popular: false,
    },
  ],
  fr: [
    {
      id: "free",
      name: "Auto-Entrepreneur",
      description: "Parfait pour les freelances et consultants.",
      price: "12 000 DZD",
      originalPrice: "24 000 DZD",
      period: "/an",
      billingNote: "Facturation annuelle",
      features: [
        "Factures illimitées",
        "Rapports G12",
        "Gestion clients",
        "Cachet et signature numériques",
        "Conversion de devis",
        "Gestion des dépenses",
        "Envoi par email",
        "Support en ligne",
      ],
      userCount: "1 utilisateur",
      storage: "1 Go de stockage",
      cta: "Essai gratuit",
      popular: false,
    },
    {
      id: "startup",
      name: "Startup",
      description: "Pour les petites équipes qui démarrent.",
      price: "24 000 DZD",
      originalPrice: "36 000 DZD",
      period: "/an",
      billingNote: "Facturation annuelle",
      features: [
        "Tout dans Auto-Entrepreneur",
        "Jusqu'à 2 utilisateurs",
        "Rapports basiques",
        "Suivi des dépenses",
        "Rappels de paiement",
        "Support standard",
      ],
      userCount: "2 utilisateurs",
      storage: "2 Go de stockage",
      cta: "Commencer",
      popular: false,
    },
    {
      id: "pro",
      name: "Small Business",
      description: "Pour les entreprises en croissance nécessitant la TVA.",
      price: "39 000 DZD",
      originalPrice: "54 000 DZD",
      period: "/an",
      billingNote: "Facturation annuelle",
      features: [
        "Tout dans Startup",
        "Déclarations G50",
        "Gestion TVA",
        "Gestion des rôles",
        "Transactions",
        "Support prioritaire",
        "Accès multi-utilisateurs",
      ],
      userCount: "3 utilisateurs",
      storage: "5 Go de stockage",
      cta: "Essai gratuit",
      popular: true,
    },
    {
      id: "premium",
      name: "Premium",
      description: "Outils avancés pour les entreprises en expansion.",
      price: "69 000 DZD",
      originalPrice: "89 000 DZD",
      period: "/an",
      billingNote: "Facturation annuelle",
      features: [
        "Tout dans Small Business",
        "Jusqu'à 5 utilisateurs",
        "Analyses avancées",
        "Gestion de stock",
        "Multi-devises",
        "Support dédié",
      ],
      userCount: "5 utilisateurs",
      storage: "10 Go de stockage",
      cta: "Obtenir Premium",
      popular: false,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "Pour les grandes organisations aux besoins spécifiques.",
      price: "Sur mesure",
      originalPrice: undefined,
      period: "/an",
      billingNote: "Facturation annuelle",
      features: [
        "Utilisateurs illimités",
        "Intégrations personnalisées",
        "Gestionnaire de compte dédié",
        "Support SLA",
        "Options sur site",
        "Sécurité avancée",
        "Accès API",
        "Formation et intégration",
      ],
      userCount: "Utilisateurs illimités",
      storage: "Stockage illimité",
      cta: "Parler au service commercial",
      popular: false,
    },
  ],
  ar: [
    {
      id: "free",
      name: "مقاول ذاتي",
      description: "مثالي لأصحاب الأعمال الحرة والاستشاريين.",
      price: "12٬000 دج",
      originalPrice: "24٬000 دج",
      period: "/سنة",
      billingNote: "فوترة سنوية",
      features: [
        "فواتير غير محدودة",
        "تقارير G12",
        "إدارة العملاء",
        "الختم والتوقيع الرقمي",
        "تحويل عروض الأسعار",
        "إدارة المصاريف",
        "إرسال عبر البريد الإلكتروني",
        "دعم عبر الإنترنت",
      ],
      userCount: "مستخدم واحد",
      storage: "1 جيغابايت للتخزين",
      cta: "ابدأ مجانًا",
      popular: false,
    },
    {
      id: "startup",
      name: "ناشئة",
      description: "للفرق الصغيرة التي تبدأ.",
      price: "24٬000 دج",
      originalPrice: "36٬000 دج",
      period: "/سنة",
      billingNote: "فوترة سنوية",
      features: [
        "كل شيء في المقاول الذاتي",
        "ما يصل إلى 2 مستخدمين",
        "تقارير أساسية",
        "تتبع المصاريف",
        "تذكيرات الدفع",
        "دعم قياسي",
      ],
      userCount: "2 مستخدمين",
      storage: "2 جيغابايت للتخزين",
      cta: "ابدأ الآن",
      popular: false,
    },
    {
      id: "pro",
      name: "Small Business",
      description: "للشركات المتنامية التي تحتاج إلى إدارة ضريبة القيمة المضافة.",
      price: "39٬000 دج",
      originalPrice: "54٬000 دج",
      period: "/سنة",
      billingNote: "فوترة سنوية",
      features: [
        "كل شيء في الناشئة",
        "تصريحات G50",
        "إدارة ضريبة القيمة المضافة",
        "إدارة الصلاحيات",
        "المعاملات",
        "دعم ذو أولوية",
        "وصول متعدد المستخدمين",
      ],
      userCount: "3 مستخدمين",
      storage: "5 جيغابايت للتخزين",
      cta: "جرّب مجانًا",
      popular: true,
    },
    {
      id: "premium",
      name: "Premium",
      description: "أدوات متقدمة للشركات المتوسعة.",
      price: "69٬000 دج",
      originalPrice: "89٬000 دج",
      period: "/سنة",
      billingNote: "فوترة سنوية",
      features: [
        "كل شيء في Small Business",
        "ما يصل إلى 5 مستخدمين",
        "تحليلات متقدمة",
        "إدارة المخزون",
        "متعدد العملات",
        "دعم مخصص",
      ],
      userCount: "5 مستخدمين",
      storage: "10 جيغابايت للتخزين",
      cta: "احصل على بريميوم",
      popular: false,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "للمؤسسات الكبيرة ذات الاحتياجات الخاصة.",
      price: "حسب الطلب",
      originalPrice: undefined,
      period: "/سنة",
      billingNote: "فوترة سنوية",
      features: [
        "مستخدمين غير محدودين",
        "تكاملات مخصصة",
        "مدير حساب مخصص",
        "دعم SLA",
        "خيارات في الموقع",
        "أمان متقدم",
        "وصول API",
        "تدريب وتأهيل",
      ],
      userCount: "مستخدمين غير محدودين",
      storage: "تخزين غير محدود",
      cta: "تواصل مع المبيعات",
      popular: false,
    },
  ],
} as const;

interface LandingPricingProps {
  fromDashboard?: boolean;
}

export function LandingPricing({ fromDashboard = false }: LandingPricingProps) {
  const { t, language } = useLanguage();
  const pricing = localizedPricing[language] ?? localizedPricing.en;

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
              className={`relative flex flex-col w-full md:w-[350px] ${
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
                  <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                    {fromDashboard ? (
                      <Link to="/settings?tab=subscription">
                        {plan.price === "Custom" || plan.price === "Sur mesure" || plan.price === "حسب الطلب" 
                          ? t("landing.pricing.enterprise.cta") 
                          : t("settings.subscription.upgrade")}
                      </Link>
                    ) : (
                      <Link to={`/auth?plan=${plan.id}`}>
                        {plan.cta}
                      </Link>
                    )}
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