import { Button } from "@/components/ui/button";
import { Building2 } from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";

export function SetupRequired() {
  const { t } = useLanguage();
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="mb-4 rounded-full bg-muted p-4">
        <Building2 className="h-8 w-8 text-primary" />
      </div>
      <h1 className="mb-2 text-2xl font-bold tracking-tight">
        {t("settings.setupRequired.title")}
      </h1>
      <p className="mb-6 max-w-sm text-muted-foreground">
        {t("settings.setupRequired.description")}
      </p>
      <Button asChild>
        <Link to="/settings">
          {t("settings.setupRequired.button")}
        </Link>
      </Button>
    </div>
  );
}