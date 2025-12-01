import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";

export function SetupRequired() {
  const { t } = useLanguage();
  
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md text-center shadow-lg border-2">
        <CardHeader className="flex flex-col items-center space-y-4 pb-6">
          <div className="rounded-full bg-primary/10 p-4 ring-1 ring-primary/20">
            <Building2 className="h-10 w-10 text-primary" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-2xl font-bold tracking-tight">
              {t("settings.setupRequired.title")}
            </CardTitle>
            <CardDescription className="text-base max-w-[300px] mx-auto">
              {t("settings.setupRequired.description")}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full" size="lg">
            <Link to="/settings" className="gap-2 font-semibold">
              {t("settings.setupRequired.button")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}