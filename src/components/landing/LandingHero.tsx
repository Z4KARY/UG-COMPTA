import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { useLanguage } from "@/contexts/LanguageContext";

export function LandingHero() {
  const { isAuthenticated } = useAuth();
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);
  const { t } = useLanguage();

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]"></div>
          <div className="absolute left-1/2 top-0 -z-10 m-auto h-[310px] w-[310px] -translate-x-1/2 rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
          
          <div className="container mx-auto px-4 text-center relative z-10">
            <motion.div
              style={{ opacity, scale }}
              className="max-w-4xl mx-auto space-y-8"
            >
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary hover:bg-primary/20"
              >
                {t("hero.new")}
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-5xl md:text-7xl font-extrabold tracking-tight text-foreground"
              >
                {t("hero.title.start")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-600">{t("hero.title.highlight")}</span>
                <br /> {t("hero.title.end")}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed"
              >
                {t("hero.description")}
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col sm:flex-row justify-center gap-4 pt-4"
              >
                <Button size="lg" className="rounded-full text-lg h-12 px-8 shadow-xl shadow-primary/20 transition-transform hover:scale-105" asChild>
                  <Link to={isAuthenticated ? "/dashboard" : "/auth"}>
                    {t("hero.startFree")} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-full text-lg h-12 px-8 transition-transform hover:scale-105" asChild>
                   <Link to="/auth">{t("hero.viewDemo")}</Link>
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </section>
  );
}