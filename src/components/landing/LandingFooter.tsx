import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";

export function LandingFooter() {
  const { t } = useLanguage();

  return (
    <footer className="bg-muted/30 border-t py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <img 
                src="https://harmless-tapir-303.convex.cloud/api/storage/cd920389-f399-4cbc-87e9-aa7031824d01" 
                alt="InvoiceFlow Logo" 
                className="h-6 w-6"
              />
              <span className="font-bold">InvoiceFlow</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t("landing.hero.description")}
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t("landing.footer.product")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-primary">{t("landing.nav.features")}</a></li>
              <li><a href="#pricing" className="hover:text-primary">{t("landing.nav.pricing")}</a></li>
              <li><Link to="/auth" className="hover:text-primary">{t("landing.nav.signIn")}</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">{t("landing.footer.company")}</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="#" className="hover:text-primary">{t("landing.footer.about")}</Link></li>
              <li><Link to="#" className="hover:text-primary">{t("landing.footer.contact")}</Link></li>
              <li><Link to="#" className="hover:text-primary">{t("landing.footer.privacy")}</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} InvoiceFlow. {t("landing.footer.rights")}</p>
        </div>
      </div>
    </footer>
  );
}