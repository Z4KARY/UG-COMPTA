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
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AdminAuth() {
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const setAdminRole = useMutation(api.adminAuth.setAdminRole);
  const user = useQuery(api.users.currentUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldUpgrade, setShouldUpgrade] = useState(false);
  
  useEffect(() => {
    // Only redirect if the user is actually an admin
    if (!authLoading && isAuthenticated && user?.role === "admin") {
      navigate("/admin");
    }
  }, [authLoading, isAuthenticated, user, navigate]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!isAuthenticated) {
        console.log("Signing in anonymously...");
        await signIn("anonymous");
        // Trigger upgrade after auth state updates
        setShouldUpgrade(true);
      } else {
        // Already authenticated, trigger upgrade immediately
        setShouldUpgrade(true);
      }
    } catch (error) {
      console.error("Sign-in error:", error);
      setError("Failed to sign in");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const performUpgrade = async () => {
      if (shouldUpgrade && isAuthenticated) {
        try {
          console.log("Setting admin role...");
          await setAdminRole({ password });
          // Success is handled by the redirect useEffect when user role updates
        } catch (error) {
          console.error("Upgrade error:", error);
          const errorMessage = error instanceof Error ? error.message : "Invalid password";
          setError(errorMessage);
          setIsLoading(false);
          setShouldUpgrade(false);
        }
      }
    };

    performUpgrade();
  }, [shouldUpgrade, isAuthenticated, password, setAdminRole]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-muted/30">
      <Card className="w-full max-w-md border-destructive/20 shadow-lg">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-destructive/10 p-3 rounded-full w-fit">
            <ShieldCheck className="h-8 w-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl font-bold text-destructive">Admin Portal</CardTitle>
          <CardDescription>
            Enter your admin credentials to access the dashboard.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <Input
                name="email"
                placeholder="admin@example.com"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
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

            {error && (
              <p className="text-sm text-destructive text-center font-medium">{error}</p>
            )}
          </CardContent>
          <CardFooter>
            <Button 
              type="submit" 
              className="w-full" 
              variant="destructive"
              disabled={isLoading || !email || !password}
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
      </Card>
    </div>
  );
}