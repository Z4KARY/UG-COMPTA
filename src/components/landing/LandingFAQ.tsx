import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";

export function LandingFAQ() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const { t } = useLanguage();

  const faqs = [
    {
      question: t("landing.faq.q1"),
      answer: t("landing.faq.a1")
    },
    {
      question: t("landing.faq.q2"),
      answer: t("landing.faq.a2")
    },
    {
      question: t("landing.faq.q3"),
      answer: t("landing.faq.a3")
    },
    {
      question: t("landing.faq.q4"),
      answer: t("landing.faq.a4")
    }
  ];

  return (
    <section id="faq" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">{t("landing.faq.title")}</h2>
              <p className="text-muted-foreground text-lg">
                {t("landing.faq.subtitle")}
              </p>
            </div>

            <div className="w-full max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <div key={index} className="border-b border-border">
                  <button
                    className="flex flex-1 items-center justify-between py-4 font-medium transition-all hover:text-primary w-full text-left"
                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                  >
                    {faq.question}
                    <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${openFaqIndex === index ? "rotate-180" : ""}`} />
                  </button>
                  <AnimatePresence>
                    {openFaqIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pb-4 pt-0 text-muted-foreground">
                          {faq.answer}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        </section>
  );
}