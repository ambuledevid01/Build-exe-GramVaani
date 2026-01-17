import { useState, useCallback, useRef } from "react";

// Extend Window interface for SpeechRecognition
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
}

export const useSpeechToText = () => {
  const [isListening, setIsListening] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState("");
  const [partialTranscript, setPartialTranscript] = useState("");
  
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const silenceTimeoutRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Safe state setter that checks if mounted
  const safeSetState = useCallback(<T,>(setter: React.Dispatch<React.SetStateAction<T>>, value: T | ((prev: T) => T)) => {
    if (mountedRef.current) {
      setter(value as any);
    }
  }, []);

  const clearSilenceTimeout = useCallback(() => {
    if (silenceTimeoutRef.current !== null) {
      window.clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
  }, []);

  const stopListening = useCallback(() => {
    console.log("Stopping speech recognition...");
    clearSilenceTimeout();
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
    }
    
    safeSetState(setIsListening, false);
    safeSetState(setPartialTranscript, "");
  }, [clearSilenceTimeout, safeSetState]);

  const startListening = useCallback(async () => {
    // Reset state
    safeSetState(setIsConnecting, true);
    safeSetState(setError, null);
    safeSetState(setTranscript, "");
    safeSetState(setPartialTranscript, "");
    clearSilenceTimeout();

    try {
      // Request microphone permission first
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Get SpeechRecognition API
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (!SpeechRecognition) {
        throw new Error("Speech recognition not supported in this browser");
      }

      // Create new instance each time
      const recognition = new SpeechRecognition() as SpeechRecognitionInstance;
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "hi-IN";

      recognition.onstart = () => {
        console.log("Speech recognition started");
        safeSetState(setIsListening, true);
        safeSetState(setIsConnecting, false);
      };

      recognition.onend = () => {
        console.log("Speech recognition ended");
        clearSilenceTimeout();
        safeSetState(setIsListening, false);
        safeSetState(setPartialTranscript, "");
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        clearSilenceTimeout();
        
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        if (finalTranscript) {
          console.log("Final transcript:", finalTranscript);
          safeSetState(setTranscript, finalTranscript);
          safeSetState(setPartialTranscript, "");
        } else if (interimTranscript) {
          console.log("Interim transcript:", interimTranscript);
          safeSetState(setPartialTranscript, interimTranscript);
          
          // Set silence timeout - stop after 2 seconds of no new speech
          silenceTimeoutRef.current = window.setTimeout(() => {
            console.log("Silence detected, stopping...");
            if (interimTranscript && mountedRef.current) {
              setTranscript(interimTranscript);
            }
            if (recognitionRef.current) {
              try {
                recognitionRef.current.stop();
              } catch (e) {
                // Ignore
              }
            }
          }, 2000);
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        
        // Ignore common non-error events
        if (event.error === "no-speech" || event.error === "aborted") {
          safeSetState(setIsListening, false);
          safeSetState(setIsConnecting, false);
          return;
        }
        
        safeSetState(setError, event.error);
        safeSetState(setIsListening, false);
        safeSetState(setIsConnecting, false);
      };

      recognitionRef.current = recognition;
      recognition.start();
      
    } catch (err) {
      console.error("Failed to start speech-to-text:", err);
      safeSetState(setError, err instanceof Error ? err.message : "Failed to start listening");
      safeSetState(setIsConnecting, false);
    }
  }, [clearSilenceTimeout, safeSetState]);

  return {
    startListening,
    stopListening,
    isListening,
    isConnecting,
    transcript,
    partialTranscript,
    error,
  };
};
