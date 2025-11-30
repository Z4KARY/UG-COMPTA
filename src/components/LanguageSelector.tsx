import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLanguage } from "@/contexts/LanguageContext";
import { Check, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage();

  const languages = [
    { code: "en", label: "English", native: "English" },
    { code: "fr", label: "French", native: "Français" },
    { code: "ar", label: "Arabic", native: "العربية" },
  ] as const;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="rounded-full w-9 h-9 hover:bg-muted transition-colors focus-visible:ring-1 focus-visible:ring-ring"
        >
          <Globe className="h-[1.2rem] w-[1.2rem] text-muted-foreground/80 hover:text-foreground transition-colors" />
          <span className="sr-only">Switch language</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => setLanguage(lang.code)}
            className={cn(
              "flex items-center justify-between cursor-pointer gap-2 py-2",
              language === lang.code && "bg-accent/50 font-medium"
            )}
          >
            <span className={cn("text-sm", lang.code === 'ar' && "font-arabic")}>
              {lang.native}
            </span>
            {language === lang.code && (
              <Check className="h-4 w-4 text-primary" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}