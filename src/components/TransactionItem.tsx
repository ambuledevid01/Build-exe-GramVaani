import { ArrowDownLeft, ArrowUpRight, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";

interface TransactionItemProps {
  type: "credit" | "debit" | "bill";
  description: string;
  amount: number;
  date: string;
  currency?: string;
}

export const TransactionItem = ({ 
  type, 
  description, 
  amount, 
  date,
  currency = "₹" 
}: TransactionItemProps) => {
  const iconMap = {
    credit: ArrowDownLeft,
    debit: ArrowUpRight,
    bill: Receipt,
  };

  const Icon = iconMap[type];

  return (
    <div className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl hover:bg-muted/50 active:bg-muted/70 transition-colors touch-manipulation">
      <div className={cn(
        "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0",
        type === "credit" && "bg-secondary/10 text-secondary",
        type === "debit" && "bg-primary/10 text-primary",
        type === "bill" && "bg-accent/10 text-accent-foreground",
      )}>
        <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm sm:text-base text-foreground truncate">{description}</p>
        <p className="text-xs sm:text-sm text-muted-foreground">{date}</p>
      </div>

      <div className={cn(
        "font-semibold text-sm sm:text-lg shrink-0",
        type === "credit" ? "text-secondary" : "text-foreground"
      )}>
        {type === "credit" ? "+" : "-"}{currency}{amount.toLocaleString('en-IN')}
      </div>
    </div>
  );
};
