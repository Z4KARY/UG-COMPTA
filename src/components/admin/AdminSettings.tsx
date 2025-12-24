import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function AdminSettings() {
  const settings = useQuery(api.admin.system.getPlatformSettings);
  const updateSetting = useMutation(api.admin.system.updatePlatformSetting);

  const getSettingValue = (key: string, defaultValue: any) => {
    const setting = settings?.find((s) => s.key === key);
    return setting ? setting.value : defaultValue;
  };

  const handleToggle = async (key: string, currentValue: boolean) => {
    try {
      await updateSetting({ key, value: !currentValue });
      toast.success("Setting updated");
    } catch (error) {
      toast.error("Failed to update setting");
    }
  };

  if (!settings) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Platform Controls</CardTitle>
          <CardDescription>Global system settings and switches</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label className="text-base">Maintenance Mode</Label>
              <p className="text-sm text-muted-foreground">
                Disable access for all non-admin users.
              </p>
            </div>
            <Switch
              checked={getSettingValue("maintenance_mode", false)}
              onCheckedChange={() => handleToggle("maintenance_mode", getSettingValue("maintenance_mode", false))}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label className="text-base">Allow New Signups</Label>
              <p className="text-sm text-muted-foreground">
                Enable or disable new user registrations.
              </p>
            </div>
            <Switch
              checked={getSettingValue("allow_signups", true)}
              onCheckedChange={() => handleToggle("allow_signups", getSettingValue("allow_signups", true))}
            />
          </div>
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label className="text-base">Beta Features</Label>
              <p className="text-sm text-muted-foreground">
                Enable experimental features globally.
              </p>
            </div>
            <Switch
              checked={getSettingValue("enable_beta", false)}
              onCheckedChange={() => handleToggle("enable_beta", getSettingValue("enable_beta", false))}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}