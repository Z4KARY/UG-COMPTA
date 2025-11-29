export function LandingTrustedBy() {
  return (
    <section className="py-16 border-y bg-card/50 backdrop-blur-sm">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm font-bold text-muted-foreground/80 mb-10 uppercase tracking-widest">Trusted by forward-thinking companies</p>
            <div className="flex flex-col md:flex-row justify-center items-center gap-12 md:gap-24">
              <img 
                src="https://harmless-tapir-303.convex.cloud/api/storage/4e7cc034-a414-43c2-a72f-cfea36b14e8e" 
                alt="UpGrowth" 
                className="h-12 md:h-14 w-auto object-contain transition-transform hover:scale-105"
              />
              <img 
                src="https://harmless-tapir-303.convex.cloud/api/storage/360ad36b-e195-467f-80b4-05af3785761f" 
                alt="UpGrowth Connect" 
                className="h-8 md:h-10 w-auto object-contain transition-transform hover:scale-105"
              />
              <img 
                src="https://harmless-tapir-303.convex.cloud/api/storage/ef75208c-7736-4b74-b7f4-a8a8aa9cc483" 
                alt="FA Management Solutions" 
                className="h-32 md:h-40 w-auto object-contain transition-transform hover:scale-105"
              />
            </div>
          </div>
        </section>
  );
}
