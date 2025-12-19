import { useSearchParams, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useState } from "react";
import { Loader2, CheckCircle2, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function PaymentSimulation() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const simulatePayment = useMutation(api.subscriptions.simulatePayment);
  
  const businessId = searchParams.get("businessId") as Id<"businesses">;
  const planId = searchParams.get("planId");
  const interval = searchParams.get("interval") as "month" | "year";
  const amount = searchParams.get("amount");
  const currency = searchParams.get("currency");

  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handlePayment = async () => {
    if (!businessId || !planId || !interval) return;
    
    setIsLoading(true);
    try {
      await simulatePayment({
        businessId,
        planId,
        interval,
      });
      setIsSuccess(true);
      toast.success("Payment simulated successfully");
      setTimeout(() => {
        navigate("/settings?payment=success");
      }, 2000);
    } catch (error) {
      console.error(error);
      toast.error("Payment simulation failed. Ensure you are the owner of this business.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!businessId || !planId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md border-destructive/50">
          <CardHeader>
            <CardTitle className="text-destructive">Invalid Parameters</CardTitle>
            <CardDescription>Missing business ID or plan ID.</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate("/")}>Go Home</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
              <CreditCard className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Chargily Test</span>
          </div>
          <CardTitle className="text-2xl">Payment Simulation</CardTitle>
          <CardDescription>
            This is a simulated payment page for testing purposes. No real money will be charged.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-muted/50 p-4 rounded-lg space-y-3 border">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Plan</span>
              <span className="font-semibold capitalize">{planId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground text-sm">Billing Cycle</span>
              <span className="font-semibold capitalize">{interval}ly</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3 mt-2">
              <span className="font-bold">Total Amount</span>
              <span className="font-bold text-lg text-primary">{amount} {currency}</span>
            </div>
          </div>
          
          {isSuccess && (
            <div className="flex items-center gap-3 text-green-600 bg-green-50 p-4 rounded-lg border border-green-100 animate-in fade-in slide-in-from-bottom-2">
              <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Payment Successful!</p>
                <p className="text-xs opacity-90">Redirecting back to application...</p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button 
            className="w-full h-11 text-base" 
            size="lg" 
            onClick={handlePayment}
            disabled={isLoading || isSuccess}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing Payment...
              </>
            ) : (
              `Pay ${amount} ${currency}`
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
