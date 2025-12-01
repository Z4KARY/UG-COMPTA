import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Link } from "react-router";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

export function LandingHero() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]" />
      <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />
      
      <div className="container mx-auto px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium bg-background/50 backdrop-blur-sm mb-8">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
            {t("landing.hero.badge")}
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent max-w-4xl mx-auto">
            {t("landing.hero.title")}
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t("landing.hero.description")}
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="h-12 px-8 text-base w-full sm:w-auto" asChild>
              <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                {t("landing.hero.startFree")} <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="h-12 px-8 text-base w-full sm:w-auto" asChild>
              <Link to="/auth">
                <PlayCircle className="mr-2 h-4 w-4" /> {t("landing.hero.viewDemo")}
              </Link>
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mt-16 relative mx-auto max-w-5xl"
        >
          <div className="rounded-xl border bg-background/50 backdrop-blur-sm p-2 shadow-2xl ring-1 ring-gray-900/10">
            <img
              src="https://harmless-tapir-303.convex.cloud/api/storage/ef75208c-7736-4b74-b7f4-a8a8aa9cc483"
              alt="Dashboard Preview"
              className="rounded-lg shadow-sm border"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}