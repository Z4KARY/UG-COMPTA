import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router";
import { useMutation, useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, CheckCircle2, Building2, User, CreditCard } from "lucide-react";
import { toast } from "sonner";
import { PlanId } from "@/lib/pricing";

export default function Onboarding() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const updateUser = useMutation(api.users.update);
  const createBusiness = useMutation(api.businesses.create);
  const createCheckout = useAction(api.chargilyActions.createCheckoutSession);

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [planId, setPlanId] = useState<PlanId>("free");

  // Form States
  const [fullName, setFullName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState<"auto_entrepreneur" | "personne_physique" | "societe">("auto_entrepreneur");
  const [phoneNumber, setPhoneNumber] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const plan = params.get("plan");
    if (plan && ["free", "startup", "pro", "premium", "enterprise"].includes(plan)) {
      setPlanId(plan as PlanId);
    }
    
    // Pre-fill phone from signup if available
    const signupPhone = localStorage.getItem("signup_phone");
    if (signupPhone) {
      setPhoneNumber(signupPhone);
      // Optional: Clear it so it doesn't persist forever
      // localStorage.removeItem("signup_phone"); 
    }
  }, [location]);

  useEffect(() => {
    if (user?.name) {
      setFullName(user.name);
    }
  }, [user]);

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateUser({ name: fullName });
      setStep(2);
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Create Business
      const businessId = await createBusiness({
        name: businessName,
        type: businessType,
        address: "To be updated", // Default placeholder
        currency: "DZD",
        tvaDefault: businessType === "societe" ? 19 : 0,
        phone: phoneNumber,
      });

      // If plan is free, we are done. If paid, go to payment step
      if (planId === "free") {
        toast.success("Setup complete!");
        navigate("/dashboard");
      } else {
        // Initiate Chargily Checkout
        try {
            const result = await createCheckout({
                businessId,
                planId: planId,
                interval: "year",
            });
            
            if (result.checkoutUrl) {
                window.location.href = result.checkoutUrl;
            } else {
                toast.error("Failed to start payment");
                // Optionally stay on this step or show error
            }
        } catch (err) {
            console.error(err);
            toast.error("Payment initiation failed");
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to create business");
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-3xl mb-8">
        {/* Progress Steps */}
        <div className="flex justify-between items-center relative">
          <div className="absolute left-0 top-1/2 w-full h-0.5 bg-muted -z-10" />
          <div className={`flex flex-col items-center gap-2 bg-background p-2 rounded-full border-2 ${step >= 1 ? "border-primary text-primary" : "border-muted text-muted-foreground"}`}>
            <User className="h-6 w-6" />
          </div>
          <div className={`flex flex-col items-center gap-2 bg-background p-2 rounded-full border-2 ${step >= 2 ? "border-primary text-primary" : "border-muted text-muted-foreground"}`}>
            <Building2 className="h-6 w-6" />
          </div>
          <div className={`flex flex-col items-center gap-2 bg-background p-2 rounded-full border-2 ${step >= 3 ? "border-primary text-primary" : "border-muted text-muted-foreground"}`}>
            <CreditCard className="h-6 w-6" />
          </div>
        </div>
        <div className="flex justify-between mt-2 text-sm font-medium text-muted-foreground px-2">
          <span>Personal Info</span>
          <span>Business Details</span>
          <span>Payment & Review</span>
        </div>
      </div>

      <Card className="w-full max-w-md shadow-lg">
        {step === 1 && (
          <form onSubmit={handleStep1Submit}>
            <CardHeader>
              <CardTitle>Welcome! Let's get to know you.</CardTitle>
              <CardDescription>Enter your personal details to create your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input 
                  id="fullName" 
                  placeholder="John Doe" 
                  value={fullName} 
                  onChange={(e) => setFullName(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user?.email || ""} disabled />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Next Step"}
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleStep2Submit}>
            <CardHeader>
              <CardTitle>Tell us about your business</CardTitle>
              <CardDescription>We'll set up your workspace based on this.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name</Label>
                <Input 
                  id="businessName" 
                  placeholder="Acme Corp" 
                  value={businessName} 
                  onChange={(e) => setBusinessName(e.target.value)} 
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  placeholder="+213..." 
                  value={phoneNumber} 
                  onChange={(e) => setPhoneNumber(e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Legal Form</Label>
                <Select value={businessType} onValueChange={(v: any) => setBusinessType(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto_entrepreneur">Auto-Entrepreneur</SelectItem>
                    <SelectItem value="personne_physique">Personne Physique</SelectItem>
                    <SelectItem value="societe">Société (SARL, EURL, etc.)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (planId === "free" ? "Complete Setup" : "Continue to Payment")}
              </Button>
            </CardFooter>
          </form>
        )}

        {step === 3 && (
          <div>
            <CardHeader>
              <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-center">Payment Successful!</CardTitle>
              <CardDescription className="text-center">
                Your subscription to the <strong>{planId}</strong> plan is active.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted p-4 rounded-lg text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plan</span>
                  <span className="font-medium capitalize">{planId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-medium">
                    {planId === "free" ? "0 DZD" : 
                     planId === "startup" ? "39,000 DZD" :
                     planId === "pro" ? "49,000 DZD" :
                     planId === "premium" ? "69,000 DZD" : "Custom"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Billing Cycle</span>
                  <span className="font-medium">Yearly</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </CardFooter>
          </div>
        )}
      </Card>
    </div>
  );
}