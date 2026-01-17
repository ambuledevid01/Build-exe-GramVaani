import { useState, useEffect, useCallback, useRef } from "react";
import { Shield, Lock, CheckCircle2, Loader2, Mic, MicOff } from "lucide-react";
import { useVoicePin } from "@/hooks/useVoicePin";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { VoiceButton } from "./VoiceButton";
import { VoiceWave } from "./VoiceWave";
import { toast } from "sonner";

interface VoicePinSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export const VoicePinSetup = ({ onComplete, onCancel }: VoicePinSetupProps) => {
  const { setVoicePin, isSettingPin } = useVoicePin();
  const { startListening, stopListening, isListening, isConnecting, transcript, partialTranscript } = useSpeechToText();
  const { speak, isSpeaking, stop: stopSpeaking } = useTextToSpeech();
  
  const [step, setStep] = useState<"intro" | "enter" | "confirm" | "success">("intro");
  const [firstPin, setFirstPin] = useState("");
  const [displayPin, setDisplayPin] = useState("");
  const lastProcessedTranscript = useRef<string>("");

  // Extract PIN from spoken input
  const extractPin = useCallback((input: string): string => {
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
    const pin = extractPin(input);
    setDisplayPin(pin);

    if (pin.length < 4) {
      const msg = "कृपया 4-6 अंक बोलें। जैसे: एक दो तीन चार";
      speak(msg);
      return;
    }

    if (step === "enter") {
      setFirstPin(pin);
      setStep("confirm");
      const msg = `PIN सुना: ${pin.split('').join(' ')}. पुष्टि के लिए दोबारा बोलें।`;
      speak(msg);
      setDisplayPin("");
    } else if (step === "confirm") {
      if (pin === firstPin) {
        const result = await setVoicePin(pin);
        if (result.success) {
          setStep("success");
          const msg = "✅ आपका सुरक्षा PIN सेट हो गया!";
          speak(msg);
          toast.success("Security PIN set successfully!");
          setTimeout(onComplete, 2000);
        } else {
          const msg = result.error || "PIN सेट करने में त्रुटि। कृपया पुनः प्रयास करें।";
          speak(msg);
          toast.error(result.error || "Failed to set PIN");
        }
      } else {
        const msg = "PIN मेल नहीं खाता। फिर से शुरू करें।";
        speak(msg);
        toast.error("PINs don't match. Try again.");
        setStep("enter");
        setFirstPin("");
        setDisplayPin("");
      }
    }
  }, [step, firstPin, extractPin, setVoicePin, speak, onComplete]);

  // Watch for transcript changes
  useEffect(() => {
    if (transcript && 
        transcript !== lastProcessedTranscript.current && 
        !isListening && 
        step !== "intro" && 
        step !== "success") {
      lastProcessedTranscript.current = transcript;
      stopSpeaking();
      processVoiceInput(transcript);
    }
  }, [transcript, isListening, step, stopSpeaking, processVoiceInput]);

  const handleStart = () => {
    setStep("enter");
    const msg = "अपना 4-6 अंक का PIN बोलें।";
    speak(msg);
  };

  const handleVoiceToggle = async () => {
    if (isSpeaking) {
      stopSpeaking();
      return;
    }
    if (isListening) {
      stopListening();
    } else {
      stopSpeaking();
      await startListening();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-3xl p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-8 h-8 text-primary" />
            </div>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-center text-foreground mb-2">
            {step === "intro" && "Set Security PIN"}
            {step === "enter" && "Speak Your PIN"}
            {step === "confirm" && "Confirm PIN"}
            {step === "success" && "PIN Set!"}
          </h2>
          
          <p className="text-sm text-muted-foreground text-center mb-6">
            {step === "intro" && "सुरक्षित लेनदेन के लिए अपना वॉइस PIN सेट करें"}
            {step === "enter" && "4-6 अंक बोलें (जैसे: एक दो तीन चार)"}
            {step === "confirm" && "PIN दोबारा बोलें"}
            {step === "success" && "आपका PIN सुरक्षित हो गया!"}
          </p>

          {/* PIN Display */}
          {(step === "enter" || step === "confirm") && (
            <div className="flex justify-center gap-2 mb-6">
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
          )}

          {/* Success Animation */}
          {step === "success" && (
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center animate-pulse">
                <CheckCircle2 className="w-10 h-10 text-secondary" />
              </div>
            </div>
          )}

          {/* Voice Controls */}
          {step !== "intro" && step !== "success" && (
            <div className="flex flex-col items-center gap-4 mb-6">
              <VoiceWave isActive={isListening || isSpeaking} className="h-6" />
              <p className="text-sm text-muted-foreground">
                {isConnecting ? "कनेक्ट हो रहा है..." :
                 isSpeaking ? "सुन रहा हूं..." :
                 isListening ? "बोलिए..." : "माइक दबाएं"}
              </p>
              <VoiceButton 
                isListening={isListening} 
                onClick={handleVoiceToggle}
                disabled={isSettingPin}
              />
              
              {/* Partial transcript */}
              {partialTranscript && (
                <div className="bg-muted/50 rounded-lg px-4 py-2 text-sm text-foreground">
                  {partialTranscript}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            {step === "intro" && (
              <>
                <button
                  onClick={onCancel}
                  className="flex-1 py-3 px-4 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStart}
                  className="flex-1 py-3 px-4 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  Set PIN
                </button>
              </>
            )}
            
            {(step === "enter" || step === "confirm") && (
              <button
                onClick={() => {
                  setStep("intro");
                  setFirstPin("");
                  setDisplayPin("");
                }}
                className="w-full py-3 px-4 rounded-xl border border-border text-foreground font-medium hover:bg-muted transition-colors"
              >
                Start Over
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
