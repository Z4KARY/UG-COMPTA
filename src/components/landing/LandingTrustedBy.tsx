export function LandingTrustedBy() {
  return (
    <section className="py-20 bg-background">
          <div className="container mx-auto px-4 text-center">
            <p className="text-sm font-medium text-muted-foreground mb-8 uppercase tracking-widest">Trusted by forward-thinking companies</p>
            <div className="mx-auto max-w-5xl bg-card border rounded-[2rem] p-8 md:p-12 flex flex-col md:flex-row flex-wrap justify-center items-center gap-8 md:gap-16 shadow-sm">
              <a href="https://www.upgrowth.dz" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
                <img 
                  src="https://harmless-tapir-303.convex.cloud/api/storage/4e7cc034-a414-43c2-a72f-cfea36b14e8e" 
                  alt="UpGrowth" 
                  className="h-10 md:h-14 w-auto object-contain grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300"
                />
              </a>
              <a href="https://www.fams-dz.com" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
                <img 
                  src="https://harmless-tapir-303.convex.cloud/api/storage/360ad36b-e195-467f-80b4-05af3785761f" 
                  alt="UpGrowth Connect" 
                  className="h-10 md:h-14 w-auto object-contain grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300"
                />
              </a>
              <a href="https://www.connect.upgrowth.dz" target="_blank" rel="noopener noreferrer" className="transition-transform hover:scale-105">
                <img 
                  src="https://harmless-tapir-303.convex.cloud/api/storage/ef75208c-7736-4b74-b7f4-a8a8aa9cc483" 
                  alt="FA Management Solutions" 
                  className="h-10 md:h-14 w-auto object-contain grayscale hover:grayscale-0 opacity-70 hover:opacity-100 transition-all duration-300"
                />
              </a>
            </div>
          </div>
        </section>
  );
}