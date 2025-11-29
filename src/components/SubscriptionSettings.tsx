import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Loader2, CreditCard, Zap, Shield, Star, LucideIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface SubscriptionSettingsProps {
  businessId: Id<"businesses">;
  currentPlan?: "free" | "pro" | "enterprise";
  subscriptionEndsAt?: number;
}

interface Plan {
  id: "free" | "pro" | "enterprise";
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  icon: LucideIcon;
  popular?: boolean;
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

  const plans: Plan[] = [
    {
      id: "free",
      name: "Auto-Entrepreneur",
      price: "Free",
      description: "Essential tools for solo entrepreneurs.",
      features: ["Unlimited Invoices", "Client Management", "G12 Reports", "Basic Support"],
      icon: Star,
    },
    {
      id: "pro",
      name: "Small Business",
      price: "2000 DA",
      period: "/month",
      description: "Perfect for growing companies.",
      features: ["Everything in Free", "G50 Declarations", "VAT Management", "Multi-user Access", "Priority Support"],
      icon: Zap,
      popular: true,
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations with specific needs.",
      features: ["Everything in Pro", "Custom Integrations", "Dedicated Account Manager", "SLA Support"],
      icon: Shield,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-6 lg:grid-cols-3">
        {plans.map((plan) => {
          const isCurrent = currentPlan === plan.id;
          const isPopular = plan.popular;
          const Icon = plan.icon;

          return (
            <Card 
              key={plan.id} 
              className={cn(
                "relative flex flex-col transition-all duration-200 hover:shadow-lg",
                isCurrent ? "border-primary shadow-md bg-primary/5" : "",
                isPopular && !isCurrent ? "border-blue-500/50 shadow-sm" : ""
              )}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <Badge className="bg-primary text-primary-foreground hover:bg-primary">Current Plan</Badge>
                </div>
              )}
              {isPopular && !isCurrent && (
                <div className="absolute -top-3 left-0 right-0 flex justify-center">
                  <Badge variant="secondary" className="bg-blue-500 text-white hover:bg-blue-600">Most Popular</Badge>
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("p-2 rounded-lg", isCurrent ? "bg-primary/10" : "bg-muted")}>
                    <Icon className={cn("h-5 w-5", isCurrent ? "text-primary" : "text-muted-foreground")} />
                  </div>
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="flex-1 space-y-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>

                <ul className="space-y-3 text-sm">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full" 
                  variant={isCurrent ? "outline" : isPopular ? "default" : "secondary"}
                  disabled={isCurrent || isLoading !== null}
                  onClick={() => handleUpgrade(plan.id)}
                >
                  {isLoading === plan.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : (
                    "Upgrade Plan"
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {subscriptionEndsAt && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                Subscription Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border">
                <div className="space-y-1">
                  <p className="font-medium">Current Billing Cycle</p>
                  <p className="text-sm text-muted-foreground">
                    Renews on {new Date(subscriptionEndsAt).toLocaleDateString(undefined, { dateStyle: 'long' })}
                  </p>
                </div>
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-200">Active</Badge>
              </div>
            </CardContent>
          </Card>
        )}

        {history && history.length > 0 && (
          <Card className={subscriptionEndsAt ? "" : "md:col-span-2"}>
            <CardHeader>
              <CardTitle className="text-lg">Billing History</CardTitle>
              <CardDescription>Recent transactions and invoices</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {history.map((sub) => (
                  <div key={sub._id} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition-colors border border-transparent hover:border-border">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium capitalize text-sm">{sub.planId} Plan</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sub.startDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{sub.amount > 0 ? `${sub.amount} ${sub.currency}` : "Free"}</p>
                      <Badge variant="secondary" className="text-[10px] h-5">
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
    </div>
  );
}