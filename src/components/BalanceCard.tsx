import { Eye, EyeOff, Shield } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface BalanceCardProps {
  balance: number;
  currency?: string;
  isVerified?: boolean;
}

export const BalanceCard = ({ balance, currency = "₹", isVerified = true }: BalanceCardProps) => {
  const [isVisible, setIsVisible] = useState(true);

  const formatBalance = (amount: number) => {
    return new Intl.NumberFormat('en-IN').format(amount);
  };

  return (
    <div className="glass-card rounded-2xl p-4 sm:p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute -right-6 -top-6 w-24 sm:w-32 h-24 sm:h-32 rounded-full bg-primary/10" />
      <div className="absolute -right-3 -bottom-3 w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-accent/10" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <div className="flex items-center gap-2 flex-wrap min-w-0">
            <span className="text-muted-foreground text-sm sm:text-body-lg">Available Balance</span>
            {isVerified && (
              <div className="flex items-center gap-1 px-2 py-0.5 bg-secondary/10 rounded-full shrink-0">
                <Shield className="w-3 h-3 text-secondary" />
                <span className="text-[10px] sm:text-xs text-secondary font-medium">Verified</span>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="p-2.5 sm:p-2 rounded-full hover:bg-muted active:bg-muted/80 transition-colors shrink-0 touch-manipulation"
            aria-label={isVisible ? "Hide balance" : "Show balance"}
          >
            {isVisible ? (
              <Eye className="w-5 h-5 sm:w-5 sm:h-5 text-muted-foreground" />
            ) : (
              <EyeOff className="w-5 h-5 sm:w-5 sm:h-5 text-muted-foreground" />
            )}
          </button>
        </div>

        <div className="flex items-baseline gap-1 sm:gap-2">
          <span className="text-xl sm:text-2xl text-foreground font-medium">{currency}</span>
          <span className={cn(
            "text-3xl sm:text-display text-foreground transition-all duration-300 font-bold",
            !isVisible && "blur-lg select-none"
          )}>
            {formatBalance(balance)}
          </span>
        </div>

        <p className="mt-2 sm:mt-3 text-xs sm:text-sm text-muted-foreground">
          Last updated: Just now
        </p>
      </div>
    </div>
  );
};
