import { useState, useEffect, useCallback, useRef } from "react";
import { Shield, Lock, XCircle, Loader2, AlertTriangle } from "lucide-react";
import { useVoicePin } from "@/hooks/useVoicePin";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { VoiceButton } from "./VoiceButton";
import { VoiceWave } from "./VoiceWave";
import { toast } from "sonner";

interface VoicePinVerifyProps {
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  description?: string;
}

export const VoicePinVerify = ({ 
  onSuccess, 
  onCancel, 
  title = "Verify Transaction",
  description = "सुरक्षा के लिए अपना PIN बोलें"
}: VoicePinVerifyProps) => {
  const { verifyVoicePin, isVerifying } = useVoicePin();
  const { startListening, stopListening, isListening, isConnecting, transcript, partialTranscript } = useSpeechToText();
  const { speak, isSpeaking, stop: stopSpeaking } = useTextToSpeech();
  
  const [attempts, setAttempts] = useState(0);
  const [displayPin, setDisplayPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const lastProcessedTranscript = useRef<string>("");
  const maxAttempts = 3;

  // Extract PIN from spoken input for display
  const extractPinForDisplay = useCallback((input: string): string => {
    const digitWords: Record<string, string> = {
      'zero': '0', 'one': '1', 'two': '2', 'three': '3', 'four': '4',
      'five': '5', 'six': '6', 'seven': '7', 'eight': '8', 'nine': '9',
      'शून्य': '0', 'एक': '1', 'दो': '2', 'तीन': '3', 'चार': '4',
      'पांच': '5', 'छह': '6', 'सात': '7', 'आठ': '8', 'नौ': '9'
    };

    let pin = '';
    const digitMatches = input.match(/\d/g);
    if (digitMatches && digitMatches.length >= 4) {
      pin = digitMatches.join('');
    } else {
      const words = input.toLowerCase().split(/\s+/);
      for (const word of words) {
        if (digitWords[word]) {
          pin += digitWords[word];
        } else if (/^\d$/.test(word)) {
          pin += word;
        }
      }
    }
    return pin.slice(0, 6);
  }, []);

  // Process voice input
  const processVoiceInput = useCallback(async (input: string) => {
    const pin = extractPinForDisplay(input);
    setDisplayPin(pin);

    if (pin.length < 4) {
      setError("कृपया अपना पूरा PIN बोलें");
      speak("कृपया अपना पूरा PIN बोलें");
      return;
    }

    const result = await verifyVoicePin(input);
    
    if (result.success) {
      setError(null);
      toast.success("PIN verified!");
      speak("✅ PIN सत्यापित!");
      setTimeout(onSuccess, 500);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setDisplayPin("");
      
      if (newAttempts >= maxAttempts) {
        setError("बहुत सारे गलत प्रयास। कृपया बाद में पुनः प्रयास करें।");
        speak("बहुत सारे गलत प्रयास। कृपया बाद में पुनः प्रयास करें।");
        toast.error("Too many failed attempts");
        setTimeout(onCancel, 2000);
      } else {
        setError(result.error || "गलत PIN। कृपया पुनः प्रयास करें।");
        speak(result.error || "गलत PIN। कृपया पुनः प्रयास करें।");
        toast.error(result.error || "Incorrect PIN");
      }
    }
  }, [verifyVoicePin, attempts, extractPinForDisplay, speak, onSuccess, onCancel]);

  // Watch for transcript changes
  useEffect(() => {
    if (transcript && 
        transcript !== lastProcessedTranscript.current && 
        !isListening && 
        attempts < maxAttempts) {
      lastProcessedTranscript.current = transcript;
      stopSpeaking();
      processVoiceInput(transcript);
    }
  }, [transcript, isListening, attempts, stopSpeaking, processVoiceInput]);

  // Initial prompt
  useEffect(() => {
    const timer = setTimeout(() => {
      speak(description);
    }, 500);
    return () => clearTimeout(timer);
  }, [speak, description]);

  const handleVoiceToggle = async () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      setError(null);
      setDisplayPin("");
      await startListening();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
              error ? "bg-destructive/10" : "bg-primary/10"
            }`}>
              {error ? (
                <AlertTriangle className="w-8 h-8 text-destructive" />
              ) : (
                <Shield className="w-8 h-8 text-primary" />
              )}
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-center text-foreground mb-2">
            {title}
          </h2>
          
          <p className="text-sm text-muted-foreground text-center mb-2">
            {description}
          </p>

          {/* Attempts counter */}
          <p className="text-xs text-center text-muted-foreground mb-6">
            Attempts: {attempts}/{maxAttempts}
          </p>

          {/* PIN Display */}
          <div className="flex justify-center gap-2 mb-4">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className={`w-10 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                  displayPin[i] 
                    ? "border-primary bg-primary/10 text-primary" 
                    : "border-muted bg-muted/50 text-muted-foreground"
                }`}
              >
                {displayPin[i] ? "•" : ""}
              </div>
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-destructive/10 text-destructive rounded-xl px-4 py-3 mb-4 text-sm text-center">
              {error}
            </div>
          )}

          {/* Voice Controls */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <VoiceWave isActive={isListening || isSpeaking} className="h-6" />
            <p className="text-sm text-muted-foreground">
              {isConnecting ? "कनेक्ट हो रहा है..." :
               isVerifying ? "सत्यापित हो रहा है..." :
               isSpeaking ? "सुन रहा हूं..." :
               isListening ? "बोलिए..." : "माइक दबाएं और PIN बोलें"}
            </p>
            <VoiceButton 
              isListening={isListening} 
              onClick={handleVoiceToggle}
              disabled={isVerifying || attempts >= maxAttempts}
            />
            
            {/* Partial transcript */}
            {partialTranscript && (
              <div className="bg-muted/50 rounded-lg px-4 py-2 text-sm text-foreground">
                {partialTranscript}
              </div>
            )}
          </div>

          {/* Cancel button */}
          <button
            onClick={onCancel}
            disabled={isVerifying}
            className="w-full py-3 px-4 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel Transaction
          </button>
        </div>
      </div>
    </div>
  );
};
