import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, CreditCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface SubscriptionSettingsProps {
  businessId: Id<"businesses">;
  currentPlan?: "free" | "pro" | "enterprise";
  subscriptionEndsAt?: number;
}

export function SubscriptionSettings({ businessId, currentPlan = "free", subscriptionEndsAt }: SubscriptionSettingsProps) {
  const upgrade = useMutation(api.subscriptions.upgradeSubscription);
  const history = useQuery(api.subscriptions.getSubscriptionHistory, { businessId });
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleUpgrade = async (planId: "free" | "pro" | "enterprise") => {
    setIsLoading(planId);
    try {
      await upgrade({
        businessId,
        planId,
        interval: "month",
        paymentMethod: "simulated_card",
      });
      toast.success(`Successfully subscribed to ${planId.toUpperCase()} plan`);
    } catch (error) {
      toast.error("Failed to upgrade subscription");
      console.error(error);
    } finally {
      setIsLoading(null);
    }
  };

  const plans = [
    {
      id: "free",
      name: "Auto-Entrepreneur",
      price: "Free",
      features: ["Unlimited Invoices", "G12 Reports", "Basic Support"],
    },
    {
      id: "pro",
      name: "Small Business",
      price: "2000 DA/mo",
      features: ["Everything in Free", "G50 Declarations", "VAT Management", "Priority Support"],
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      features: ["Everything in Pro", "Custom Integrations", "Dedicated Account Manager"],
    },
  ] as const;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          return (
            <Card key={plan.id} className={`relative flex flex-col ${isCurrent ? "border-primary shadow-md" : ""}`}>
              {isCurrent && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <Badge>Current Plan</Badge>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.price}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <ul className="space-y-2 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={isCurrent ? "outline" : "default"}
                  disabled={isCurrent || isLoading !== null}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {isLoading === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    "Active"
                  ) : (
                    "Upgrade"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {subscriptionEndsAt && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Status</CardTitle>
            <CardDescription>Your current billing cycle</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-muted-foreground" />
                <span>
                    Plan renews on {new Date(subscriptionEndsAt).toLocaleDateString()}
                </span>
            </div>
          </CardContent>
        </Card>
      )}

      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {history.map((sub) => (
                <div key={sub._id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium capitalize">{sub.planId} Plan</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(sub.startDate).toLocaleDateString()} - {sub.endDate ? new Date(sub.endDate).toLocaleDateString() : "Ongoing"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{sub.amount} {sub.currency}</p>
                    <Badge variant={sub.status === "active" ? "default" : "secondary"}>
                      {sub.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
