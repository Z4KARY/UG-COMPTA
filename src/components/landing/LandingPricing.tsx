import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";
import { ContactSalesDialog } from "@/components/ContactSalesDialog";

const localizedPricing = {
  en: [
    {
      id: "free",
      name: "Auto-Entrepreneur",
      description: "Perfect for freelancers. 3 months free trial.",
      price: "12,000 DZD",
      originalPrice: "24,000 DZD",
      period: "/year",
      billingNote: "Billed annually",
      features: [
        "Invoicing",
        "Transactions",
        "Role Management",
        "Digital Stamp & Signature",
        "Quote Conversion",
        "Expense Management",
        "Email Sending",
        "Online Support",
      ],
      userCount: "1 User",
      storage: "1 GB Storage",
      cta: "Start Free Trial",
      popular: false,
    },
    {
      id: "startup",
      name: "Startup",
      description: "For small teams. 1 month free trial.",
      price: "39,000 DZD",
      originalPrice: undefined,
      period: "/year",
      billingNote: "Billed annually",
      features: [
        "Invoicing",
        "Transactions",
        "Role Management",
        "Digital Stamp & Signature",
        "Quote Conversion",
        "Expense Management",
        "Email Sending",
        "Online Support",
      ],
      userCount: "3 Users",
      storage: "1 GB Storage",
      cta: "Start Free Trial",
      popular: false,
    },
    {
      id: "pro",
      name: "Small Business",
      description: "For growing businesses. 1 month free trial.",
      price: "49,000 DZD",
      originalPrice: undefined,
      period: "/year",
      billingNote: "Billed annually",
      features: [
        "Invoicing",
        "Transactions",
        "Role Management",
        "Digital Stamp & Signature",
        "Quote Conversion",
        "Expense Management",
        "Email Sending",
        "Online Support",
      ],
      userCount: "6 Users",
      storage: "2 GB Storage",
      cta: "Start Free Trial",
      popular: true,
    },
    {
      id: "premium",
      name: "Premium",
      description: "For established companies. 1 month free trial.",
      price: "69,000 DZD",
      originalPrice: undefined,
      period: "/year",
      billingNote: "Billed annually",
      features: [
        "Invoicing",
        "Transactions",
        "Role Management",
        "Digital Stamp & Signature",
        "Quote Conversion",
        "Expense Management",
        "Email Sending",
        "Online Support",
      ],
      userCount: "10 Users",
      storage: "4 GB Storage",
      cta: "Start Free Trial",
      popular: false,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      description: "For large organizations with specific needs.",
      price: "Custom",
      originalPrice: undefined,
      period: "/year",
      billingNote: "Custom billing",
      features: [
        "Unlimited Users",
        "Unlimited Storage",
        "Custom Integrations",
        "Dedicated Support",
        "SLA",
        "On-premise Option",
      ],
      userCount: "Unlimited Users",
      storage: "Unlimited Storage",
      cta: "Contact Sales",
      popular: false,
    },
  ],
  fr: [
    {
      id: "free",
      name: "Auto-Entrepreneur",
      description: "Parfait pour les freelances. 3 mois d'essai gratuit.",
      price: "12 000 DZD",
      originalPrice: "24 000 DZD",
      period: "/an",
      billingNote: "Facturation annuelle",
      features: [
        "Facturation",
        "Transactions",
        "Gestion de rôle",
        "Cachet et signature numérique",
        "Conversion de devis",
        "Gestion de dépenses",
        "Envoi par email",
        "Support en ligne",
      ],
      userCount: "1 Utilisateur",
      storage: "1 Go de stockage",
      cta: "Essai gratuit",
      popular: false,
    },
    {
      id: "startup",
      name: "Startup",
      description: "Pour les petites équipes. 1 mois d'essai gratuit.",
      price: "39 000 DZD",
      originalPrice: undefined,
      period: "/an",
      billingNote: "Facturation annuelle",
      features: [
        "Facturation",
        "Transactions",
        "Gestion de rôle",
        "Cachet et signature numérique",
        "Conversion de devis",
        "Gestion de dépenses",
        "Envoi par email",
        "Support en ligne",
      ],
      userCount: "3 Utilisateurs",
      storage: "1 Go de stockage",
      cta: "Essai gratuit",
      popular: false,
    },
    {
      id: "pro",
      name: "Small Business",
      description: "Pour les entreprises en croissance. 1 mois d'essai gratuit.",
      price: "49 000 DZD",
      originalPrice: undefined,
      period: "/an",
      billingNote: "Facturation annuelle",
      features: [
        "Facturation",
        "Transactions",
        "Gestion de rôle",
        "Cachet et signature numérique",
        "Conversion de devis",
        "Gestion de dépenses",
        "Envoi par email",
        "Support en ligne",
      ],
      userCount: "6 Utilisateurs",
      storage: "2 Go de stockage",
      cta: "Essai gratuit",
      popular: true,
    },
    {
      id: "premium",
      name: "Premium",
      description: "Pour les entreprises établies. 1 mois d'essai gratuit.",
      price: "69 000 DZD",
      originalPrice: undefined,
      period: "/an",
      billingNote: "Facturation annuelle",
      features: [
        "Facturation",
        "Transactions",
        "Gestion de rôle",
        "Cachet et signature numérique",
        "Conversion de devis",
        "Gestion de dépenses",
        "Envoi par email",
        "Support en ligne",
      ],
      userCount: "10 Utilisateurs",
      storage: "4 Go de stockage",
      cta: "Essai gratuit",
      popular: false,
    },
    {
      id: "enterprise",
      name: "Entreprise",
      description: "Pour les grandes organisations avec des besoins spécifiques.",
      price: "Sur mesure",
      originalPrice: undefined,
      period: "/an",
      billingNote: "Facturation personnalisée",
      features: [
        "Utilisateurs illimités",
        "Stockage illimité",
        "Intégrations personnalisées",
        "Support dédié",
        "SLA",
        "Option sur site",
      ],
      userCount: "Utilisateurs illimités",
      storage: "Stockage illimité",
      cta: "Contacter les ventes",
      popular: false,
    },
  ],
  ar: [
    {
      id: "free",
      name: "مقاول ذاتي",
      description: "مثالي للمستقلين. تجربة مجانية لمدة 3 أشهر.",
      price: "12٬000 دج",
      originalPrice: "24٬000 دج",
      period: "/سنة",
      billingNote: "فوترة سنوية",
      features: [
        "الفوترة",
        "المعاملات",
        "إدارة الأدوار",
        "الختم والتوقيع الرقمي",
        "تحويل عروض الأسعار",
        "إدارة المصاريف",
        "إرسال عبر البريد الإلكتروني",
        "دعم عبر الإنترنت",
      ],
      userCount: "مستخدم واحد",
      storage: "1 جيغابايت تخزين",
      cta: "ابدأ مجانًا",
      popular: false,
    },
    {
      id: "startup",
      name: "ناشئة",
      description: "للفرق الصغيرة. تجربة مجانية لمدة شهر.",
      price: "39٬000 دج",
      originalPrice: undefined,
      period: "/سنة",
      billingNote: "فوترة سنوية",
      features: [
        "الفوترة",
        "المعاملات",
        "إدارة الأدوار",
        "الختم والتوقيع الرقمي",
        "تحويل عروض الأسعار",
        "إدارة المصاريف",
        "إرسال عبر البريد الإلكتروني",
        "دعم عبر الإنترنت",
      ],
      userCount: "3 مستخدمين",
      storage: "1 جيغابايت تخزين",
      cta: "ابدأ الآن",
      popular: false,
    },
    {
      id: "pro",
      name: "Small Business",
      description: "للشركات النامية. تجربة مجانية لمدة شهر.",
      price: "49٬000 دج",
      originalPrice: undefined,
      period: "/سنة",
      billingNote: "فوترة سنوية",
      features: [
        "الفوترة",
        "المعاملات",
        "إدارة الأدوار",
        "الختم والتوقيع الرقمي",
        "تحويل عروض الأسعار",
        "إدارة المصاريف",
        "إرسال عبر البريد الإلكتروني",
        "دعم عبر الإنترنت",
      ],
      userCount: "6 مستخدمين",
      storage: "2 جيغابايت تخزين",
      cta: "جرّب مجانًا",
      popular: true,
    },
    {
      id: "premium",
      name: "Premium",
      description: "للشركات القائمة. تجربة مجانية لمدة شهر.",
      price: "69٬000 دج",
      originalPrice: undefined,
      period: "/سنة",
      billingNote: "فوترة سنوية",
      features: [
        "الفوترة",
        "المعاملات",
        "إدارة الأدوار",
        "الختم والتوقيع الرقمي",
        "تحويل عروض الأسعار",
        "إدارة المصاريف",
        "إرسال عبر البريد الإلكتروني",
        "دعم عبر الإنترنت",
      ],
      userCount: "10 مستخدمين",
      storage: "4 جيغابايت تخزين",
      cta: "احصل على بريميوم",
      popular: false,
    },
    {
      id: "enterprise",
      name: "مؤسسة",
      description: "للمؤسسات الكبيرة ذات الاحتياجات الخاصة.",
      price: "حسب الطلب",
      originalPrice: undefined,
      period: "/سنة",
      billingNote: "فوترة مخصصة",
      features: [
        "مستخدمين غير محدودين",
        "تخزين غير محدود",
        "تكاملات مخصصة",
        "دعم مخصص",
        "اتفاقية مستوى الخدمة",
        "خيار محلي",
      ],
      userCount: "مستخدمين غير محدودين",
      storage: "تخزين غير محدود",
      cta: "اتصل بالمبيعات",
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