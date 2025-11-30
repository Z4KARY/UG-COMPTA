import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";

export function LandingFooter() {
  const { t } = useLanguage();
  return (
    <footer className="border-t py-12 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 font-bold text-xl mb-4">
                <img 
                  src="https://harmless-tapir-303.convex.cloud/api/storage/cd920389-f399-4cbc-87e9-aa7031824d01" 
                  alt="UpGrowth" 
                  className="h-8 w-auto object-contain" 
                />
                <span>UGCOMPTA</span>
              </div>
              <p className="text-muted-foreground max-w-xs">
                {t("footer.description")}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t("footer.product")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">{t("nav.features")}</a></li>
                <li><a href="#pricing" className="hover:text-primary transition-colors">{t("nav.pricing")}</a></li>
                <li><Link to="/auth" className="hover:text-primary transition-colors">{t("nav.signin")}</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">{t("footer.company")}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#" className="hover:text-primary transition-colors">{t("footer.about")}</Link></li>
                <li><Link to="#" className="hover:text-primary transition-colors">{t("footer.contact")}</Link></li>
                <li><Link to="#" className="hover:text-primary transition-colors">{t("footer.privacy")}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 UGCOMPTA. {t("footer.rights")}</p>
          </div>
        </div>
      </footer>
  );
}