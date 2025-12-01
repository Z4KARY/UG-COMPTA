import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";

export function SetupRequired() {
  const { t } = useLanguage();
  
  return (
    <div className="flex h-[60vh] items-center justify-center p-4">
      <Card className="border-dashed max-w-md w-full bg-muted/30">
        <CardContent className="flex flex-col items-center justify-center py-12 text-center space-y-4">
          <div className="p-4 bg-background rounded-full shadow-sm">
            <Building2 className="h-8 w-8 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{t("settings.setupRequired.title")}</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {t("settings.setupRequired.description")}
            </p>
          </div>
          <Button asChild>
            <Link to="/settings">
              {t("settings.setupRequired.button")}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
