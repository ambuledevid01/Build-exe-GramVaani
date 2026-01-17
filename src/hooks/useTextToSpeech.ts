import { useState, useCallback } from "react";

export const useTextToSpeech = () => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const speak = useCallback((text: string) => {
    if (!text) return;

    if (!('speechSynthesis' in window)) {
      console.error("Web Speech API not supported");
      setError("Speech not supported in this browser");
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    setError(null);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "hi-IN"; // Hindi
    utterance.rate = 0.9;
    utterance.pitch = 1;

    utterance.onstart = () => {
      console.log("Speech started");
      setIsSpeaking(true);
    };
    
    utterance.onend = () => {
      console.log("Speech ended");
      setIsSpeaking(false);
    };
    
    utterance.onerror = (e) => {
      console.error("Web Speech error:", e);
      setError("Speech synthesis failed");
      setIsSpeaking(false);
    };

    window.speechSynthesis.speak(utterance);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  }, []);

  return { speak, stop, isSpeaking, error };
};
