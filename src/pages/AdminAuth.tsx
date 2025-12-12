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

export default function AdminAuth() {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/admin");
    }
  }, [authLoading, isAuthenticated, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (otp.length !== 6) {
        setError("Please enter a valid 6-digit code");
        setIsLoading(false);
        return;
    }

    try {
      // Combine password and OTP for the custom provider
      const combinedCredential = `${password}|${otp}`;
      
      await signIn("admin-password", { 
        password: combinedCredential,
        flow: "signIn" 
      });
      
      // If successful, the useEffect will redirect
    } catch (error) {
      console.error("Sign-in error:", error);
      setError("Invalid password or verification code");
      setIsLoading(false);
      setOtp(""); // Clear OTP on failure
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
            Enter your admin password and authenticator code.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium">Admin Password</label>
              <Input
                name="password"
                placeholder="Enter admin password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            
            <div className="space-y-2 flex flex-col items-center">
              <label className="text-sm font-medium w-full text-left">Authenticator Code</label>
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
              <p className="text-sm text-destructive text-center font-medium">{error}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              variant="destructive"
              disabled={isLoading || !password || otp.length !== 6}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Verify & Sign In <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}