import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

export function LandingFAQ() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const faqs = [
    {
      question: "Is InvoiceFlow compliant with Algerian tax laws?",
      answer: "Yes, InvoiceFlow is built specifically for the Algerian market. We handle TVA, Timbre Fiscal, and generate data for G50 and G12 declarations."
    },
    {
      question: "Can I use it as an Auto-Entrepreneur?",
      answer: "Absolutely! We have a dedicated mode for Auto-Entrepreneurs that simplifies the interface, removes VAT fields, and handles the specific reporting requirements."
    },
    {
      question: "Is my data secure?",
      answer: "We use bank-grade encryption to store your data. Your information is backed up daily and we strictly adhere to data privacy regulations."
    },
    {
      question: "Can I export my data?",
      answer: "Yes, you can export your invoices, customers, and reports to PDF, Excel, or CSV formats at any time."
    }
  ];

  return (
    <section id="faq" className="py-24 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground text-lg">
                Everything you need to know about InvoiceFlow.
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
