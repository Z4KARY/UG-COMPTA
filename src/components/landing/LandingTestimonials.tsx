import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function LandingTestimonials() {
  const testimonials = [
    {
      name: "Amine Benali",
      role: "Auto-Entrepreneur",
      content: "InvoiceFlow changed how I manage my freelance work. The G12 export saved me hours during tax season.",
      avatar: "AB"
    },
    {
      name: "Sarah Khelil",
      role: "CEO, TechDz",
      content: "Finally, software that understands Algerian tax laws. The support for Timbre Fiscal is spot on.",
      avatar: "SK"
    },
    {
      name: "Mohamed Idir",
      role: "Founder, StartUp Algiers",
      content: "Beautiful interface and very easy to use. My accountant loves the export features.",
      avatar: "MI"
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">Loved by Algerian Businesses</h2>
              <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                Don't just take our word for it. Here's what our users have to say.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <Card className="h-full">
                    <CardContent className="pt-6">
                      <div className="flex gap-1 mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                        ))}
                      </div>
                      <p className="text-muted-foreground mb-6 italic">"{testimonial.content}"</p>
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full overflow-hidden bg-muted relative shrink-0 border">
                          <img 
                            src={`https://api.dicebear.com/7.x/initials/svg?seed=${testimonial.avatar}`} 
                            alt={testimonial.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{testimonial.name}</p>
                          <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
  );
}
