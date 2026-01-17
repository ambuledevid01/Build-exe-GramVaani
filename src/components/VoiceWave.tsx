import { cn } from "@/lib/utils";

interface VoiceWaveProps {
  isActive: boolean;
  className?: string;
}

export const VoiceWave = ({ isActive, className }: VoiceWaveProps) => {
  return (
    <div className={cn("flex items-center justify-center gap-1.5", className)}>
      {[...Array(7)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "voice-wave-bar w-1.5 rounded-full transition-all duration-300",
            isActive 
              ? "bg-primary" 
              : "bg-muted-foreground/30",
            !isActive && "!transform-none"
          )}
          style={{
            height: isActive 
              ? `${Math.random() * 24 + 12}px` 
              : '8px',
            animationPlayState: isActive ? 'running' : 'paused',
          }}
        />
      ))}
    </div>
  );
};
