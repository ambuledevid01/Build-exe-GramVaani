import { Globe } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const languages = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (code: string) => void;
}

export const LanguageSelector = ({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);

  const selected = languages.find(l => l.code === selectedLanguage) || languages[0];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl",
          "bg-card border border-border hover:border-primary/30 active:bg-muted/50",
          "transition-all duration-200 touch-manipulation",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        )}
      >
        <Globe className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
        <span className="font-medium text-sm sm:text-base">{selected.native}</span>
      </button>

      {isOpen && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)} 
          />
          <div className="absolute right-0 top-full mt-2 z-50 w-52 sm:w-48 py-2 bg-card rounded-xl border border-border shadow-medium animate-scale-in max-h-[60vh] overflow-y-auto">
            {languages.map((language) => (
              <button
                key={language.code}
                onClick={() => {
                  onLanguageChange(language.code);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3.5 sm:py-3",
                  "hover:bg-muted active:bg-muted/80 transition-colors text-left touch-manipulation",
                  selectedLanguage === language.code && "bg-primary/10 text-primary"
                )}
              >
                <span className="font-medium text-sm sm:text-base">{language.native}</span>
                <span className="text-xs sm:text-sm text-muted-foreground">{language.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
