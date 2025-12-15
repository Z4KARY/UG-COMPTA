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
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, Loader2, Mail, UserX, Quote, Check } from "lucide-react";
import { Suspense, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";

interface AuthProps {
  redirectAfterAuth?: string;
}

function Auth({ redirectAfterAuth }: AuthProps = {}) {
  const { t } = useLanguage();
  const { isLoading: authLoading, isAuthenticated, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [authMode, setAuthMode] = useState<"signup" | "login">("signup");
  const [otp, setOtp] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states for signup
  const [phone, setPhone] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptMarketing, setAcceptMarketing] = useState(false);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      // Check for plan param
      const params = new URLSearchParams(location.search);
      const plan = params.get("plan");
      
      let redirect = redirectAfterAuth || "/";
      
      // If plan is present, override redirect to onboarding
      if (plan) {
        redirect = `/onboarding?plan=${plan}`;
      }
      
      navigate(redirect);
    }
  }, [authLoading, isAuthenticated, navigate, redirectAfterAuth, location.search]);

  const handleEmailSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (authMode === "signup" && !acceptTerms) {
      setError("Vous devez accepter les conditions générales.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const formData = new FormData(event.currentTarget);
      
      // Save extra fields to local storage for onboarding
      if (authMode === "signup") {
        if (phone) localStorage.setItem("signup_phone", phone);
        if (promoCode) localStorage.setItem("signup_promo", promoCode);
      }

      await signIn("email-otp", formData);
      setStep({ email: formData.get("email") as string });
      setIsLoading(false);
    } catch (error) {
      console.error("Email sign-in error:", error);
      setError(
        error instanceof Error
          ? error.message
          : t("auth.error.failedToSend"),
      );
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

      console.log("signed in");

      // Check for plan param
      const params = new URLSearchParams(location.search);
      const plan = params.get("plan");

      let redirect = redirectAfterAuth || "/";
      
      // If plan is present, override redirect to onboarding
      if (plan) {
        redirect = `/onboarding?plan=${plan}`;
      }

      navigate(redirect);
    } catch (error) {
      console.error("OTP verification error:", error);

      setError(t("auth.error.incorrectCode"));
      setIsLoading(false);

      setOtp("");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-blue-600 to-blue-800 p-12 text-white relative overflow-hidden">
        <div className="relative z-10">
          <div 
            className="flex items-center gap-2 cursor-pointer mb-12" 
            onClick={() => navigate("/")}
          >
             <img
                src="/logo.png"
                alt="Logo"
                className="h-10 w-auto brightness-0 invert"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
              <span className="text-2xl font-bold tracking-tight">UGCOMPTA</span>
          </div>
        </div>

        <div className="relative z-10 max-w-md">
          <Quote className="h-12 w-12 mb-6 opacity-50" />
          <blockquote className="text-2xl font-medium leading-relaxed mb-6">
            "Outil efficace, je travaille à l'aise dans le sens où je n'ai qu'à introduire mes données et il fait le tout. Il m'a fait gagner beaucoup de temps et d'effort."
          </blockquote>
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="font-bold">S</span>
            </div>
            <div>
              <p className="font-semibold">Samir B.</p>
              <p className="text-blue-200 text-sm">Entrepreneur</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-sm text-blue-200">
          © 2024 UGCOMPTA. All rights reserved.
        </div>

        {/* Decorative circles */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-blue-900/30 rounded-full blur-3xl" />
      </div>

      {/* Right Side - Form */}
      <div className="flex items-center justify-center p-6 lg:p-12 bg-background">
        <div className="w-full max-w-[450px] space-y-8">
          {step === "signIn" ? (
            <>
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {authMode === "signup" ? "Inscription" : "Connexion"}
                </h1>
                <p className="text-muted-foreground">
                  {authMode === "signup" 
                    ? "Créez votre compte pour commencer." 
                    : "Connectez-vous à votre compte."}
                </p>
              </div>

              <form onSubmit={handleEmailSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">ADRESSE EMAIL *</Label>
                    <Input
                      id="email"
                      name="email"
                      placeholder="john.doe@email.com"
                      type="email"
                      required
                      className="h-11"
                    />
                  </div>

                  {authMode === "signup" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="mobile">N° MOBILE *</Label>
                        <div className="flex gap-2">
                          <div className="flex-none w-[100px]">
                            <Select defaultValue="dz">
                              <SelectTrigger className="h-11">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="dz">🇩🇿 +213</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <Input
                            id="mobile"
                            placeholder="0551 23 45 67"
                            type="tel"
                            className="h-11 flex-1"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="promo">CODE PROMO</Label>
                        <Input
                          id="promo"
                          placeholder="Code promo"
                          className="h-11"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value)}
                        />
                      </div>

                      <div className="space-y-4 pt-2">
                        <div className="flex items-start space-x-3">
                          <Checkbox 
                            id="marketing" 
                            checked={acceptMarketing}
                            onCheckedChange={(c) => setAcceptMarketing(c as boolean)}
                          />
                          <label
                            htmlFor="marketing"
                            className="text-sm text-muted-foreground leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-0.5"
                          >
                            J'accepte de recevoir des e-mails de la part de UGCOMPTA
                          </label>
                        </div>
                        <div className="flex items-start space-x-3">
                          <Checkbox 
                            id="terms" 
                            checked={acceptTerms}
                            onCheckedChange={(c) => setAcceptTerms(c as boolean)}
                            required
                          />
                          <label
                            htmlFor="terms"
                            className="text-sm text-muted-foreground leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-70 pt-0.5"
                          >
                            En cochant cette case, vous déclarez avoir lu et accepté nos Conditions Générales de Vente et d'Utilisation.
                          </label>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {error && (
                  <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full h-11 text-base bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    authMode === "signup" ? "S'inscrire" : "Se connecter"
                  )}
                </Button>

                <div className="flex items-center justify-between pt-4">
                  <p className="text-sm text-muted-foreground">
                    {authMode === "signup" ? "Vous avez déjà un compte?" : "Pas encore de compte?"}
                    <button
                      type="button"
                      onClick={() => setAuthMode(authMode === "signup" ? "login" : "signup")}
                      className="ml-1 text-blue-600 hover:underline font-medium"
                    >
                      {authMode === "signup" ? "Se connecter" : "S'inscrire"}
                    </button>
                  </p>
                </div>
              </form>
            </>
          ) : (
            <>
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight">Vérification</h1>
                <p className="text-muted-foreground">
                  Nous avons envoyé un code à {step.email}
                </p>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-8">
                <input type="hidden" name="email" value={step.email} />
                <input type="hidden" name="code" value={otp} />

                <div className="flex justify-center">
                  <InputOTP
                    value={otp}
                    onChange={setOtp}
                    maxLength={6}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      {Array.from({ length: 6 }).map((_, index) => (
                        <InputOTPSlot key={index} index={index} className="h-12 w-12 text-lg" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {error && (
                  <p className="text-sm text-destructive text-center">
                    {error}
                  </p>
                )}

                <div className="space-y-4">
                  <Button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700"
                    disabled={isLoading || otp.length !== 6}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Vérifier"
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setStep("signIn")}
                    disabled={isLoading}
                    className="w-full"
                  >
                    Utiliser une autre adresse email
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuthPage(props: AuthProps) {
  return (
    <Suspense>
      <Auth {...props} />
    </Suspense>
  );
}