import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { WebhookSettings } from "@/components/WebhookSettings";
import { SubscriptionSettings } from "@/components/SubscriptionSettings";
import { BusinessDesignSettings } from "@/components/BusinessDesignSettings";
import { TeamSettings } from "@/components/TeamSettings";
import { BusinessGeneralSettings } from "@/components/BusinessGeneralSettings";
import { useLanguage } from "@/contexts/LanguageContext";

export default function BusinessSettings() {
  const { t } = useLanguage();
  const business = useQuery(api.businesses.getMyBusiness, {});

  if (business === undefined) {
    return (
      <DashboardLayout>
        <div className="flex h-[50vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {t("settings.title")}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t("settings.subtitle")}
            </p>
          </div>
        </div>

        <Tabs defaultValue="general" className="space-y-4">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="general">{t("settings.tab.general")}</TabsTrigger>
            <TabsTrigger value="design">{t("settings.tab.design")}</TabsTrigger>
            <TabsTrigger value="team">{t("settings.tab.team")}</TabsTrigger>
            <TabsTrigger value="webhooks">{t("settings.tab.webhooks")}</TabsTrigger>
            <TabsTrigger value="subscription">{t("settings.tab.subscription")}</TabsTrigger>
          </TabsList>

          <TabsContent value="general">
            <BusinessGeneralSettings business={business} />
          </TabsContent>

          <TabsContent value="design">
            <div className="md:col-span-2">
              {business && (
                <BusinessDesignSettings 
                  businessId={business._id} 
                  initialData={{
                    primaryColor: business.primaryColor,
                    secondaryColor: business.secondaryColor,
                    font: business.font,
                    template: business.template,
                    logoUrl: business.logoUrl,
                    logoStorageId: business.logoStorageId,
                  }}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="team">
            <div className="md:col-span-2">
              {business && <TeamSettings businessId={business._id} />}
            </div>
          </TabsContent>

          <TabsContent value="webhooks">
            <div className="md:col-span-2">
              {business && <WebhookSettings businessId={business._id} />}
            </div>
          </TabsContent>

          <TabsContent value="subscription">
            {business && (
              <SubscriptionSettings 
                businessId={business._id} 
                currentPlan={business.plan as "free" | "pro" | "enterprise" | undefined}
                subscriptionEndsAt={business.subscriptionEndsAt}
              />
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </DashboardLayout>
  );
}