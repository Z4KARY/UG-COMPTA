import { Button } from "@/components/ui/button";
import { Link } from "react-router";

export function LandingCTA() {
  return (
    <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="bg-primary rounded-3xl p-8 md:p-16 text-center text-primary-foreground relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.1)_50%,transparent_75%,transparent_100%)] bg-[length:250%_250%,100%_100%] animate-[shimmer_3s_infinite]"></div>
              <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                <h2 className="text-3xl md:text-4xl font-bold">Ready to modernize your invoicing?</h2>
                <p className="text-primary-foreground/80 text-lg">
                  Join thousands of Algerian businesses using InvoiceFlow to streamline their operations.
                </p>
                <Button size="lg" variant="secondary" className="rounded-full h-12 px-8 text-primary font-bold shadow-lg transition-transform hover:scale-105" asChild>
                  <Link to="/auth">Get Started Now</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
  );
}
