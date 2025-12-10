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
      name: "Auto entrepreneur",
      description: "Perfect for freelancers and consultants.",
      price: "12,000 DZD",
      originalPrice: "24,000 DZD",
      period: "/year",
      billingNote: "Billed annually",
      features: [
        "Billing automation",
        "Transactions",
        "Role management",
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
      name: "Starter",
      description: "For growing businesses needing VAT workflows.",
      price: "39,000 DZD",
      originalPrice: "54,000 DZD",
      period: "/year",
      billingNote: "Billed annually",
      features: [
        "Billing automation",
        "Transactions",
        "Role management",
        "Digital stamp & signature",
        "Quote conversion",
        "Expense management",
        "Email sending",
        "Online support",
      ],
      userCount: "3 users",
      storage: "1 GB storage",
      cta: "Free trial",
      popular: true,
    },
    {
      name: "Basic",
      description: "For structured teams automating daily flows.",
      price: "49,000 DZD",
      originalPrice: "69,000 DZD",
      period: "/year",
      billingNote: "Billed annually",
      features: [
        "Billing automation",
        "Transactions",
        "Role management",
        "Digital stamp & signature",
        "Quote conversion",
        "Expense management",
        "Email sending",
        "Online support",
      ],
      userCount: "6 users",
      storage: "2 GB storage",
      cta: "Free trial",
      popular: false,
    },
    {
      name: "Company",
      description: "For large organizations with specific needs.",
      price: "69,000 DZD",
      originalPrice: "89,000 DZD",
      period: "/year",
      billingNote: "Billed annually",
      features: [
        "Billing automation",
        "Transactions",
        "Role management",
        "Digital stamp & signature",
        "Quote conversion",
        "Expense management",
        "Email sending",
        "Online support",
      ],
      userCount: "10 users",
      storage: "4 GB storage",
      cta: "Contact sales",
      popular: false,
    },
  ],
  fr: [
    {
      name: "Auto entrepreneur",
      description: "Parfait pour les freelances et consultants.",
      price: "12 000 DZD",
      originalPrice: "24 000 DZD",
      period: "/an",
      billingNote: "Facturation annuelle",
      features: [
        "Facturation",
        "Transactions",
        "Gestion des rôles",
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
      name: "Starter",
      description: "Pour les entreprises en croissance nécessitant la TVA.",
      price: "39 000 DZD",
      originalPrice: "54 000 DZD",
      period: "/an",
      billingNote: "Facturation annuelle",
      features: [
        "Facturation",
        "Transactions",
        "Gestion des rôles",
        "Cachet et signature numériques",
        "Conversion de devis",
        "Gestion des dépenses",
        "Envoi par email",
        "Support en ligne",
      ],
      userCount: "3 utilisateurs",
      storage: "1 Go de stockage",
      cta: "Essai gratuit",
      popular: true,
    },
    {
      name: "Basic",
      description: "Pour les équipes structurées qui automatisent leurs flux.",
      price: "49 000 DZD",
      originalPrice: "69 000 DZD",
      period: "/an",
      billingNote: "Facturation annuelle",
      features: [
        "Facturation",
        "Transactions",
        "Gestion des rôles",
        "Cachet et signature numériques",
        "Conversion de devis",
        "Gestion des dépenses",
        "Envoi par email",
        "Support en ligne",
      ],
      userCount: "6 utilisateurs",
      storage: "2 Go de stockage",
      cta: "Essai gratuit",
      popular: false,
    },
    {
      name: "Company",
      description: "Pour les grandes organisations aux besoins spécifiques.",
      price: "69 000 DZD",
      originalPrice: "89 000 DZD",
      period: "/an",
      billingNote: "Facturation annuelle",
      features: [
        "Facturation",
        "Transactions",
        "Gestion des rôles",
        "Cachet et signature numériques",
        "Conversion de devis",
        "Gestion des dépenses",
        "Envoi par email",
        "Support en ligne",
      ],
      userCount: "10 utilisateurs",
      storage: "4 Go de stockage",
      cta: "Parler au service commercial",
      popular: false,
    },
  ],
  ar: [
    {
      name: "مقاول ذاتي",
      description: "مثالي لأصحاب الأعمال الحرة والاستشاريين.",
      price: "12٬000 دج",
      originalPrice: "24٬000 دج",
      period: "/سنة",
      billingNote: "فوترة سنوية",
      features: [
        "الفوترة",
        "المعاملات",
        "إدارة الصلاحيات",
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
      name: "Starter",
      description: "للشركات المتنامية التي تحتاج إلى إدارة ضريبة القيمة المضافة.",
      price: "39٬000 دج",
      originalPrice: "54٬000 دج",
      period: "/سنة",
      billingNote: "فوترة سنوية",
      features: [
        "الفوترة",
        "المعاملات",
        "إدارة الصلاحيات",
        "الختم والتوقيع الرقمي",
        "تحويل عروض الأسعار",
        "إدارة المصاريف",
        "إرسال عبر البريد الإلكتروني",
        "دعم عبر الإنترنت",
      ],
      userCount: "3 مستخدمين",
      storage: "1 جيغابايت للتخزين",
      cta: "جرّب مجانًا",
      popular: true,
    },
    {
      name: "Basic",
      description: "للفرق المنظمة التي ترغب في أتمتة سير العمل.",
      price: "49٬000 دج",
      originalPrice: "69٬000 دج",
      period: "/سنة",
      billingNote: "فوترة سنوية",
      features: [
        "الفوترة",
        "المعاملات",
        "إدارة الصلاحيات",
        "الختم والتوقيع الرقمي",
        "تحويل عروض الأسعار",
        "إدارة المصاريف",
        "إرسال عبر البريد الإلكتروني",
        "دعم عبر الإنترنت",
      ],
      userCount: "6 مستخدمين",
      storage: "2 جيغابايت للتخزين",
      cta: "جرّب مجانًا",
      popular: false,
    },
    {
      name: "Company",
      description: "للمؤسسات الكبيرة ذات الاحتياجات الخاصة.",
      price: "69٬000 دج",
      originalPrice: "89٬000 دج",
      period: "/سنة",
      billingNote: "فوترة سنوية",
      features: [
        "الفوترة",
        "المعاملات",
        "إدارة الصلاحيات",
        "الختم والتوقيع الرقمي",
        "تحويل عروض الأسعار",
        "إدارة المصاريف",
        "إرسال عبر البريد الإلكتروني",
        "دعم عبر الإنترنت",
      ],
      userCount: "10 مستخدمين",
      storage: "4 جيغابايت للتخزين",
      cta: "تواصل مع المبيعات",
      popular: false,
    },
  ],
} as const;

export function LandingPricing() {
  const { t, language } = useLanguage();
  const pricing = localizedPricing[language] ?? localizedPricing.en;

  return (
    <section id="pricing" className="py-24 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            {t("landing.pricing.title")}
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            {t("landing.pricing.subtitle")}
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
          {pricing.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className={`relative flex flex-col ${
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
                      <span className="line-through opacity-70">{plan.originalPrice}</span>
                      <span className="ml-2">{plan.billingNote}</span>
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