import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuickActionProps {
  icon: LucideIcon;
  label: string;
  voiceCommand: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "accent";
}

export const QuickAction = ({ 
  icon: Icon, 
  label, 
  voiceCommand, 
  onClick,
  variant = "primary" 
}: QuickActionProps) => {
  const variantStyles = {
    primary: "bg-primary/10 text-primary hover:bg-primary/20 border-primary/20",
    secondary: "bg-secondary/10 text-secondary hover:bg-secondary/20 border-secondary/20",
    accent: "bg-accent/10 text-accent-foreground hover:bg-accent/20 border-accent/20",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-2 sm:gap-3 p-4 sm:p-5 rounded-2xl border-2",
        "transition-all duration-200 transform active:scale-[0.97]",
        "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30",
        "min-h-[130px] sm:min-h-[140px] w-full",
        "touch-manipulation select-none",
        variantStyles[variant]
      )}
    >
      <div className={cn(
        "w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center shrink-0",
        variant === "primary" && "bg-primary text-primary-foreground",
        variant === "secondary" && "bg-secondary text-secondary-foreground",
        variant === "accent" && "bg-accent text-accent-foreground",
      )}>
        <Icon className="w-6 h-6 sm:w-7 sm:h-7" />
      </div>
      <div className="text-center min-w-0">
        <p className="font-semibold text-foreground text-sm sm:text-base leading-tight">{label}</p>
        <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 truncate">"{voiceCommand}"</p>
      </div>
    </button>
  );
};
