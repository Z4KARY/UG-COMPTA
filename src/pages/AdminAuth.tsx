import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AdminAuth() {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const verifyPassword = useAction(api.adminActions.verifyAdminPassword);
  const navigate = useNavigate();
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/admin");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      const password = formData.get("password") as string;
      
      // Verify password first
      const isValid = await verifyPassword({ password });
      if (!isValid) {
        setError("Invalid admin password");
        setIsLoading(false);
        return;
      }

      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError("Failed to send verification code");
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      await signIn("email-otp", formData);
      navigate("/admin");
    } catch (error) {
      console.error("OTP verification error:", error);
      setError("Incorrect code");
      setIsLoading(false);
      setOtp("");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md border-destructive/20 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
            <ShieldCheck className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">Admin Portal</CardTitle>
          <CardDescription>
            Restricted access. Please sign in to continue.
          </CardDescription>
        </CardHeader>
        {step === "signIn" ? (
          <form onSubmit={handleEmailSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  name="email"
                  placeholder="admin@example.com"
                  type="email"
                  disabled={isLoading}
                  required
                  className="text-center"
                />
                <Input
                  name="password"
                  placeholder="Admin Password"
                  type="password"
                  disabled={isLoading}
                  required
                  className="text-center"
                />
              </div>
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                type="submit" 
                className="w-full" 
                variant="destructive"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign In <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit}>
            <CardContent className="space-y-4">
              <input type="hidden" name="email" value={step.email} />
              <input type="hidden" name="code" value={otp} />
              
              <div className="text-center text-sm text-muted-foreground mb-4">
                Code sent to <span className="font-medium text-foreground">{step.email}</span>
              </div>

              <div className="flex justify-center">
                <InputOTP
                  value={otp}
                  onChange={setOtp}
                  maxLength={6}
                  disabled={isLoading}
                >
                  <InputOTPGroup>
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot key={index} index={index} />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>
              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}
            </CardContent>
            <CardFooter className="flex-col gap-2">
              <Button
                type="submit"
                className="w-full"
                variant="destructive"
                disabled={isLoading || otp.length !== 6}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Verify Access"
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setStep("signIn")}
                disabled={isLoading}
                className="w-full"
              >
                Back to Email
              </Button>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}