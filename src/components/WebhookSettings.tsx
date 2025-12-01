import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Network, Plus, Trash2, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Id } from "@/convex/_generated/dataModel";
import { useLanguage } from "@/contexts/LanguageContext";

interface WebhookSettingsProps {
  businessId: Id<"businesses">;
}

const AVAILABLE_EVENTS = [
  { id: "invoice.created", label: "Invoice Created" },
  { id: "invoice.issued", label: "Invoice Issued" },
  { id: "invoice.paid", label: "Invoice Paid" },
  { id: "purchase_invoice.created", label: "Purchase Recorded" },
];

export function WebhookSettings({ businessId }: WebhookSettingsProps) {
  const { t } = useLanguage();
  const subscriptions = useQuery(api.webhooks.list, { businessId });
  const createSubscription = useMutation(api.webhooks.create);
  const deleteSubscription = useMutation(api.webhooks.remove);
  const updateSubscription = useMutation(api.webhooks.update);

  const [newUrl, setNewUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [copiedSecret, setCopiedSecret] = useState<string | null>(null);

  const handleAdd = async () => {
    if (!newUrl) {
        toast.error(t("settings.webhooks.toast.urlRequired"));
        return;
    }
    if (selectedEvents.length === 0) {
        toast.error(t("settings.webhooks.toast.eventRequired"));
        return;
    }

    try {
        await createSubscription({
            businessId,
            targetUrl: newUrl,
            events: selectedEvents,
        });
        toast.success(t("settings.webhooks.toast.addSuccess"));
        setNewUrl("");
        setSelectedEvents([]);
    } catch (error) {
        toast.error(t("settings.webhooks.toast.addError"));
    }
  };

  const handleDelete = async (id: Id<"webhookSubscriptions">) => {
    if (confirm(t("settings.webhooks.confirmDelete"))) {
        await deleteSubscription({ id });
        toast.success(t("settings.webhooks.toast.deleteSuccess"));
    }
  };

  const toggleEvent = (eventId: string) => {
    setSelectedEvents(prev => 
        prev.includes(eventId) 
            ? prev.filter(e => e !== eventId)
            : [...prev, eventId]
    );
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSecret(id);
    setTimeout(() => setCopiedSecret(null), 2000);
    toast.success(t("settings.webhooks.toast.copySuccess"));
  };

  return (
    <Card className="shadow-sm border-dashed">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg">
            <Network className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <CardTitle>{t("settings.webhooks.title")}</CardTitle>
            <CardDescription>
              {t("settings.webhooks.description")}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
            <h3 className="text-sm font-medium">{t("settings.webhooks.addTitle")}</h3>
            <div className="space-y-2">
                <Label>{t("settings.webhooks.url")}</Label>
                <Input 
                    placeholder="https://api.yoursystem.com/webhook" 
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                />
            </div>
            <div className="space-y-2">
                <Label>{t("settings.webhooks.events")}</Label>
                <div className="grid grid-cols-2 gap-2">
                    {AVAILABLE_EVENTS.map(event => (
                        <div key={event.id} className="flex items-center space-x-2">
                            <Checkbox 
                                id={`event-${event.id}`} 
                                checked={selectedEvents.includes(event.id)}
                                onCheckedChange={() => toggleEvent(event.id)}
                            />
                            <label 
                                htmlFor={`event-${event.id}`} 
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                            >
                                {event.label}
                            </label>
                        </div>
                    ))}
                </div>
            </div>
            <Button onClick={handleAdd} disabled={!newUrl || selectedEvents.length === 0}>
                <Plus className="mr-2 h-4 w-4" />
                {t("settings.webhooks.addBtn")}
            </Button>
        </div>

        <div className="space-y-2">
            <h3 className="text-sm font-medium">{t("settings.webhooks.activeTitle")}</h3>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>{t("settings.webhooks.url")}</TableHead>
                        <TableHead>{t("settings.webhooks.events")}</TableHead>
                        <TableHead>{t("settings.webhooks.secret")}</TableHead>
                        <TableHead className="text-right">{t("settings.webhooks.actions")}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {subscriptions?.map(sub => (
                        <TableRow key={sub._id}>
                            <TableCell className="font-mono text-xs">{sub.targetUrl}</TableCell>
                            <TableCell>
                                <div className="flex flex-wrap gap-1">
                                    {sub.events.map(e => (
                                        <span key={e} className="px-1.5 py-0.5 bg-primary/10 text-primary rounded text-[10px] font-medium">
                                            {e}
                                        </span>
                                    ))}
                                </div>
                            </TableCell>
                            <TableCell>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-6 text-xs"
                                    onClick={() => copyToClipboard(sub.secret, sub._id)}
                                >
                                    {copiedSecret === sub._id ? <Check className="h-3 w-3 mr-1" /> : <Copy className="h-3 w-3 mr-1" />}
                                    {t("settings.webhooks.copy")}
                                </Button>
                            </TableCell>
                            <TableCell className="text-right">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => handleDelete(sub._id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                    {subscriptions?.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={4} className="text-center text-muted-foreground text-sm">
                                {t("settings.webhooks.empty")}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
      </CardContent>
    </Card>
  );
}