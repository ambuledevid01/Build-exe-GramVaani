import { Wifi, WifiOff, Shield, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusBarProps {
  isOnline: boolean;
  isVoiceVerified: boolean;
}

export const StatusBar = ({ isOnline, isVoiceVerified }: StatusBarProps) => {
  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {/* Connection status - show only icon on mobile */}
      <div className={cn(
        "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium",
        isOnline 
          ? "bg-secondary/10 text-secondary" 
          : "bg-destructive/10 text-destructive"
      )}>
        {isOnline ? (
          <>
            <Wifi className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Offline</span>
          </>
        )}
      </div>

      {/* Voice verification status */}
      <div className={cn(
        "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-medium",
        isVoiceVerified 
          ? "bg-secondary/10 text-secondary" 
          : "bg-muted text-muted-foreground"
      )}>
        {isVoiceVerified ? (
          <>
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Voice ID</span>
          </>
        ) : (
          <>
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Setup</span>
          </>
        )}
      </div>
    </div>
  );
};
