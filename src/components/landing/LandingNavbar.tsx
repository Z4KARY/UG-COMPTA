import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Link } from "react-router";
import { useState } from "react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

export function LandingNavbar() {
  const { isAuthenticated } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <img 
              src="https://harmless-tapir-303.convex.cloud/api/storage/cd920389-f399-4cbc-87e9-aa7031824d01" 
              alt="UpGrowth" 
              className="h-8 w-auto object-contain" 
            />
            <span>UGCOMPTA</span>
          </div>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm font-medium hover:text-primary transition-colors">{t("nav.features")}</a>
            <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">{t("nav.pricing")}</a>
            <a href="#testimonials" className="text-sm font-medium hover:text-primary transition-colors">{t("nav.testimonials")}</a>
            <a href="#faq" className="text-sm font-medium hover:text-primary transition-colors">{t("nav.faq")}</a>
            <LanguageSelector />
            {isAuthenticated ? (
              <Button asChild variant="default" className="rounded-full shadow-lg shadow-primary/20">
                <Link to="/dashboard">{t("nav.dashboard")}</Link>
              </Button>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/auth" className="text-sm font-medium hover:text-primary transition-colors">
                  {t("nav.signin")}
                </Link>
                <Button asChild className="rounded-full shadow-lg shadow-primary/20">
                  <Link to="/auth">{t("nav.getStarted")}</Link>
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Toggle */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSelector />
            <button className="p-2" onClick={toggleMenu}>
              {isMobileMenuOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-16 left-0 w-full bg-background border-b p-4 flex flex-col gap-4 shadow-xl"
          >
            <a href="#features" className="text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={toggleMenu}>{t("nav.features")}</a>
            <a href="#pricing" className="text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={toggleMenu}>{t("nav.pricing")}</a>
            <a href="#testimonials" className="text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={toggleMenu}>{t("nav.testimonials")}</a>
            <Link to="/auth" className="text-sm font-medium p-2 hover:bg-muted rounded-md" onClick={toggleMenu}>{t("nav.signin")}</Link>
            <Button asChild className="w-full">
              <Link to="/auth">{t("nav.getStarted")}</Link>
            </Button>
          </motion.div>
        )}
        </AnimatePresence>
      </header>
  );
}