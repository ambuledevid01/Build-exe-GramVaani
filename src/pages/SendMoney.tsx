import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, HelpCircle, CheckCircle2, Loader2 } from "lucide-react";
import { VoiceButton } from "@/components/VoiceButton";
import { VoiceWave } from "@/components/VoiceWave";
import { ConversationBubble } from "@/components/ConversationBubble";
import { useSpeechToText } from "@/hooks/useSpeechToText";
import { useTextToSpeech } from "@/hooks/useTextToSpeech";
import { useBanking } from "@/hooks/useBanking";
import { toast } from "sonner";

const SendMoney = () => {
  const navigate = useNavigate();
  const { 
    startListening, 
    stopListening, 
    isListening, 
    isConnecting,
    transcript, 
    partialTranscript 
  } = useSpeechToText();
  const { speak, isSpeaking, stop: stopSpeaking } = useTextToSpeech();
  const { balance, createTransaction, isCreatingTransaction } = useBanking();
  
  const [step, setStep] = useState<"recipient" | "amount" | "confirm" | "success">("recipient");
  const [recipient, setRecipient] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [amount, setAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const lastProcessedTranscript = useRef<string>("");
  
  const [conversation, setConversation] = useState([
    { message: "किसे पैसे भेजना है? नाम या फोन नंबर बोलें।", isUser: false, timestamp: "अभी" }
  ]);

  const recentContacts = [
    { name: "राम कुमार", phone: "9876543210", initial: "र" },
    { name: "सीता देवी", phone: "9876543211", initial: "स" },
    { name: "मोहन लाल", phone: "9876543212", initial: "म" },
  ];

  // Process voice input based on current step
  const processVoiceInput = useCallback(async (input: string) => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    // Add user message
    setConversation(prev => [...prev, { message: input, isUser: true, timestamp: "अभी" }]);

    if (step === "recipient") {
      // Extract name from input
      const cleanedInput = input.trim();
      
      // Check if it matches any recent contact
      const matchedContact = recentContacts.find(c => 
        cleanedInput.toLowerCase().includes(c.name.toLowerCase()) ||
        cleanedInput.includes(c.phone)
      );
      
      if (matchedContact) {
        setRecipient(matchedContact.name);
        setRecipientPhone(matchedContact.phone);
        const response = `${matchedContact.name} (${matchedContact.phone}) को कितने रुपये भेजने हैं?`;
        setConversation(prev => [...prev, { message: response, isUser: false, timestamp: "अभी" }]);
        speak(response);
        setStep("amount");
      } else {
        // Use the input as the name directly
        setRecipient(cleanedInput);
        setRecipientPhone("New Contact");
        const response = `${cleanedInput} को कितने रुपये भेजने हैं?`;
        setConversation(prev => [...prev, { message: response, isUser: false, timestamp: "अभी" }]);
        speak(response);
        setStep("amount");
      }
    } else if (step === "amount") {
      // Extract amount from input - look for numbers
      const numberWords: Record<string, number> = {
        'एक': 1, 'दो': 2, 'तीन': 3, 'चार': 4, 'पांच': 5,
        'छह': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
        'बीस': 20, 'तीस': 30, 'चालीस': 40, 'पचास': 50,
        'साठ': 60, 'सत्तर': 70, 'अस्सी': 80, 'नब्बे': 90,
        'सौ': 100, 'हजार': 1000, 'लाख': 100000
      };
      
      // Try to find numeric value
      let extractedAmount = "";
      const numMatch = input.match(/\d+/);
      if (numMatch) {
        extractedAmount = numMatch[0];
      } else {
        // Try Hindi number words
        let total = 0;
        let currentNumber = 0;
        
        for (const word of input.split(/\s+/)) {
          const lowerWord = word.toLowerCase();
          if (numberWords[lowerWord]) {
            const value = numberWords[lowerWord];
            if (value === 100 || value === 1000 || value === 100000) {
              currentNumber = (currentNumber || 1) * value;
              total += currentNumber;
              currentNumber = 0;
            } else {
              currentNumber += value;
            }
          }
        }
        total += currentNumber;
        if (total > 0) {
          extractedAmount = total.toString();
        }
      }
      
      if (extractedAmount && parseInt(extractedAmount) > 0) {
        setAmount(extractedAmount);
        const response = `${recipient} को ₹${parseInt(extractedAmount).toLocaleString('en-IN')} भेजने के लिए 'हाँ' बोलें।`;
        setConversation(prev => [...prev, { message: response, isUser: false, timestamp: "अभी" }]);
        speak(response);
        setStep("confirm");
      } else {
        const response = "कृपया राशि बताएं, जैसे 'पांच सौ रुपये' या '500'";
        setConversation(prev => [...prev, { message: response, isUser: false, timestamp: "अभी" }]);
        speak(response);
      }
    } else if (step === "confirm") {
      const lowerInput = input.toLowerCase();
      if (lowerInput.includes("हाँ") || lowerInput.includes("हां") || 
          lowerInput.includes("yes") || lowerInput.includes("भेजो") ||
          lowerInput.includes("ok") || lowerInput.includes("ओके")) {
        
        // Execute the actual transaction
        try {
          const amountNum = parseInt(amount);
          if (amountNum > balance) {
            const response = "❌ अपर्याप्त राशि। आपके खाते में पर्याप्त पैसे नहीं हैं।";
            setConversation(prev => [...prev, { message: response, isUser: false, timestamp: "अभी" }]);
            speak(response);
            setIsProcessing(false);
            return;
          }
          
          await createTransaction({
            type: "debit",
            amount: amountNum,
            description: `Sent to ${recipient}`,
            recipient_name: recipient,
            recipient_phone: recipientPhone !== "New Contact" ? recipientPhone : undefined,
          });
          
          const response = `✅ ${recipient} को ₹${amountNum.toLocaleString('en-IN')} भेज दिए गए।`;
          setConversation(prev => [...prev, { message: response, isUser: false, timestamp: "अभी" }]);
          speak(response);
          setStep("success");
          toast.success("Transaction successful!");
        } catch (error) {
          console.error("Transaction failed:", error);
          const response = "❌ ट्रांसफर विफल। कृपया दोबारा कोशिश करें।";
          setConversation(prev => [...prev, { message: response, isUser: false, timestamp: "अभी" }]);
          speak(response);
          toast.error("Transaction failed");
        }
      } else if (lowerInput.includes("नहीं") || lowerInput.includes("no") || lowerInput.includes("cancel")) {
        const response = "ट्रांसफर रद्द किया गया।";
        setConversation(prev => [...prev, { message: response, isUser: false, timestamp: "अभी" }]);
        speak(response);
        handleNewTransfer();
      } else {
        const response = "कृपया 'हाँ' या 'नहीं' बोलें।";
        setConversation(prev => [...prev, { message: response, isUser: false, timestamp: "अभी" }]);
        speak(response);
      }
    }
    
    setIsProcessing(false);
  }, [step, recipient, amount, speak]);

  // Watch for transcript changes
  useEffect(() => {
    if (transcript && 
        transcript !== lastProcessedTranscript.current && 
        !isListening && 
        !isProcessing) {
      lastProcessedTranscript.current = transcript;
      stopSpeaking();
      processVoiceInput(transcript);
    }
  }, [transcript, isListening, isProcessing, stopSpeaking, processVoiceInput]);

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

  const handleContactSelect = (contact: typeof recentContacts[0]) => {
    setRecipient(contact.name);
    setRecipientPhone(contact.phone);
    const response = `${contact.name} (${contact.phone}) को कितने रुपये भेजने हैं?`;
    setConversation(prev => [
      ...prev,
      { message: `${contact.name} को चुना`, isUser: true, timestamp: "अभी" },
      { message: response, isUser: false, timestamp: "अभी" }
    ]);
    speak(response);
    setStep("amount");
  };

  const handleNewTransfer = () => {
    setStep("recipient");
    setRecipient("");
    setRecipientPhone("");
    setAmount("");
    lastProcessedTranscript.current = "";
    const response = "किसे पैसे भेजना है? नाम या फोन नंबर बोलें।";
    setConversation([{ message: response, isUser: false, timestamp: "अभी" }]);
  };

  const stepIndex = ["recipient", "amount", "confirm", "success"].indexOf(step);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={() => navigate("/")}
              className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 active:bg-muted/70 transition-colors touch-manipulation shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-foreground" />
            </button>
            <div className="min-w-0">
              <h1 className="font-semibold text-base sm:text-lg text-foreground">Send Money</h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground">पैसे भेजें</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 pb-52 sm:pb-56">
        {/* Progress Steps */}
        <section className="mb-6 sm:mb-8 animate-fade-in">
          <div className="flex items-center justify-between">
            {["recipient", "amount", "confirm", "success"].map((s, idx) => (
              <div key={s} className="flex items-center">
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-medium transition-colors ${
                  step === s ? "bg-primary text-primary-foreground" :
                  stepIndex > idx ? "bg-secondary text-secondary-foreground" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {stepIndex > idx ? <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" /> : idx + 1}
                </div>
                {idx < 3 && <div className={`w-8 sm:w-12 md:w-20 h-1 mx-1 sm:mx-2 rounded ${
                  stepIndex > idx ? "bg-secondary" : "bg-muted"
                }`} />}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-[10px] sm:text-xs text-muted-foreground">
            <span>To</span>
            <span>Amount</span>
            <span>Confirm</span>
            <span>Done</span>
          </div>
        </section>

        {/* Success State */}
        {step === "success" && (
          <section className="mb-6 sm:mb-8 animate-fade-in">
            <div className="glass-card rounded-2xl p-6 sm:p-8 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-secondary" />
              </div>
              <h2 className="text-lg sm:text-title text-foreground mb-2 font-semibold">Transfer Successful!</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">₹{parseInt(amount).toLocaleString('en-IN')} sent to {recipient}</p>
              <button
                onClick={handleNewTransfer}
                className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 active:bg-primary/80 transition-colors touch-manipulation"
              >
                New Transfer
              </button>
            </div>
          </section>
        )}

        {/* Recent Contacts */}
        {step === "recipient" && (
          <section className="mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-lg sm:text-title text-foreground mb-3 sm:mb-4 font-semibold">Recent Contacts</h2>
            <div className="space-y-2 sm:space-y-3">
              {recentContacts.map((contact, idx) => (
                <button
                  key={idx}
                  onClick={() => handleContactSelect(contact)}
                  className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 sm:gap-4 hover:bg-muted/50 active:bg-muted/70 transition-colors text-left touch-manipulation"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-primary font-semibold text-lg sm:text-xl">{contact.initial}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm sm:text-base text-foreground">{contact.name}</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">{contact.phone}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Transfer Details */}
        {(step === "amount" || step === "confirm") && (
          <section className="mb-6 sm:mb-8 animate-fade-in">
            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <User className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-foreground">{recipient}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{recipientPhone}</p>
                </div>
              </div>
              {amount && (
                <div className="text-center py-4 sm:py-6 border-t border-border">
                  <p className="text-xs sm:text-sm text-muted-foreground mb-2">Amount to Send</p>
                  <p className="text-3xl sm:text-display text-foreground font-bold">₹{parseInt(amount).toLocaleString('en-IN')}</p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Voice Commands */}
        <section className="mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-lg sm:text-title text-foreground mb-3 sm:mb-4 font-semibold">Voice Commands</h2>
          <div className="glass-card rounded-2xl p-3 sm:p-4 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-secondary/5 rounded-xl">
              <span className="text-secondary font-medium text-sm sm:text-base">"[नाम] को भेजो"</span>
              <span className="text-muted-foreground text-xs sm:text-sm">- Select</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-secondary/5 rounded-xl">
              <span className="text-secondary font-medium text-sm sm:text-base">"[राशि] रुपये"</span>
              <span className="text-muted-foreground text-xs sm:text-sm">- Amount</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-secondary/5 rounded-xl">
              <span className="text-secondary font-medium text-sm sm:text-base">"हाँ भेजो"</span>
              <span className="text-muted-foreground text-xs sm:text-sm">- Confirm</span>
            </div>
          </div>
        </section>

        {/* Conversation */}
        <section className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-lg sm:text-title text-foreground mb-3 sm:mb-4 font-semibold">Conversation</h2>
          <div className="glass-card rounded-2xl p-3 sm:p-4 space-y-3 sm:space-y-4 max-h-36 sm:max-h-48 overflow-y-auto">
            {conversation.map((msg, idx) => (
              <ConversationBubble
                key={idx}
                message={msg.message}
                isUser={msg.isUser}
                timestamp={msg.timestamp}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Voice Control */}
      <div className="fixed bottom-0 left-0 right-0 z-40 pb-safe-bottom">
        <div className="bg-background/95 backdrop-blur-xl border-t border-border shadow-lg">
          <div className="container mx-auto px-4 py-4 sm:py-6">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <VoiceWave isActive={isListening || isSpeaking} className="h-6 sm:h-8" />
              
              {/* Live transcript display */}
              {(isListening || partialTranscript) && (
                <div className="bg-muted/50 rounded-lg px-4 py-2 max-w-xs text-center">
                  <p className="text-sm text-foreground">
                    {partialTranscript || "..."}
                  </p>
                </div>
              )}
              
              <p className="text-sm sm:text-base text-muted-foreground font-medium text-center flex items-center gap-2">
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    कनेक्ट हो रहा है...
                  </>
                ) : isSpeaking ? (
                  "बोल रहा हूं..."
                ) : isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                    समझ रहा हूं...
                  </>
                ) : isListening ? (
                  "सुन रहा हूं... बोलिए"
                ) : step === "recipient" ? (
                  "किसे भेजना है बोलें"
                ) : step === "amount" ? (
                  "राशि बोलें"
                ) : step === "confirm" ? (
                  "'हाँ' बोलें"
                ) : (
                  "नया ट्रांसफर करें"
                )}
              </p>
              <VoiceButton 
                isListening={isListening} 
                onClick={handleVoiceToggle} 
                disabled={step === "success" || isConnecting || isProcessing} 
              />
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
                <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Say "Help" for commands</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMoney;
