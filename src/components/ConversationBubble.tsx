import { cn } from "@/lib/utils";

interface ConversationBubbleProps {
  message: string;
  isUser: boolean;
  timestamp?: string;
}

export const ConversationBubble = ({ message, isUser, timestamp }: ConversationBubbleProps) => {
  return (
    <div className={cn(
      "flex w-full",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "max-w-[85%] sm:max-w-[80%] px-4 sm:px-5 py-3 sm:py-3.5 rounded-2xl animate-slide-up",
        isUser 
          ? "bg-primary text-primary-foreground rounded-br-md" 
          : "bg-card border border-border text-foreground rounded-bl-md shadow-soft"
      )}>
        <p className="text-sm sm:text-body-lg leading-relaxed">{message}</p>
        {timestamp && (
          <p className={cn(
            "text-[10px] sm:text-xs mt-1.5 sm:mt-2 opacity-70",
            isUser ? "text-primary-foreground" : "text-muted-foreground"
          )}>
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
};
