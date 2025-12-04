import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Archive, Download } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ArchivingSectionProps {
  handleExport: () => void;
  handleFullExport: () => void;
  isExporting: boolean;
}

export function ArchivingSection({ handleExport, handleFullExport, isExporting }: ArchivingSectionProps) {
  const { t } = useLanguage();

  return (
    <Card className="md:col-span-2 shadow-sm border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Archive className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <CardTitle>{t("settings.archiving.title")}</CardTitle>
            <CardDescription>
              {t("settings.archiving.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
          <div className="flex items-center justify-between border-b pb-4">
              <div className="space-y-1">
                  <p className="text-sm font-medium">{t("settings.archiving.jsonTitle")}</p>
                  <p className="text-xs text-muted-foreground">
                      {t("settings.archiving.jsonDesc")}
                  </p>
              </div>
              <Button type="button" variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  {t("settings.archiving.exportJson")}
              </Button>
          </div>
          <div className="flex items-center justify-between">
              <div className="space-y-1">
                  <p className="text-sm font-medium">{t("settings.archiving.zipTitle")}</p>
                  <p className="text-xs text-muted-foreground">
                      {t("settings.archiving.zipDesc")}
                  </p>
              </div>
              <Button type="button" variant="default" onClick={handleFullExport} disabled={isExporting}>
                  {isExporting ? (
                      <span className="animate-spin mr-2">⏳</span>
                  ) : (
                      <Archive className="mr-2 h-4 w-4" />
                  )}
                  {isExporting ? t("settings.archiving.generating") : t("settings.archiving.downloadZip")}
              </Button>
          </div>
      </CardContent>
    </Card>
  );
}
