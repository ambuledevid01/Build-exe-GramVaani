import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Zap, Phone, Wifi, Droplets, Flame, HelpCircle, CheckCircle2 } from "lucide-react";
import { VoiceButton } from "@/components/VoiceButton";
import { VoiceWave } from "@/components/VoiceWave";
import { ConversationBubble } from "@/components/ConversationBubble";
import { LucideIcon } from "lucide-react";

interface BillCategory {
  id: string;
  name: string;
  nameHindi: string;
  icon: LucideIcon;
  color: string;
}

const PayBills = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [selectedBill, setSelectedBill] = useState<BillCategory | null>(null);
  const [step, setStep] = useState<"select" | "details" | "confirm" | "success">("select");
  const [billAmount] = useState(1250);
  const [conversation, setConversation] = useState([
    { message: "कौन सा बिल भरना है? बिजली, मोबाइल, या पानी?", isUser: false, timestamp: "अभी" }
  ]);

  const billCategories: BillCategory[] = [
    { id: "electricity", name: "Electricity", nameHindi: "बिजली", icon: Zap, color: "bg-yellow-500" },
    { id: "mobile", name: "Mobile", nameHindi: "मोबाइल", icon: Phone, color: "bg-blue-500" },
    { id: "internet", name: "Internet", nameHindi: "इंटरनेट", icon: Wifi, color: "bg-purple-500" },
    { id: "water", name: "Water", nameHindi: "पानी", icon: Droplets, color: "bg-cyan-500" },
    { id: "gas", name: "Gas", nameHindi: "गैस", icon: Flame, color: "bg-orange-500" },
  ];

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        if (step === "select") {
          setConversation(prev => [...prev, { message: "बिजली का बिल भरो", isUser: true, timestamp: "अभी" }]);
          setTimeout(() => {
            const bill = billCategories.find(b => b.id === "electricity")!;
            setSelectedBill(bill);
            setConversation(prev => [...prev, { message: `बिजली बिल ₹${billAmount.toLocaleString('en-IN')} है। 'हाँ' बोलें।`, isUser: false, timestamp: "अभी" }]);
            setStep("confirm");
            setIsListening(false);
          }, 1500);
        } else if (step === "confirm") {
          setConversation(prev => [...prev, { message: "हाँ भरो", isUser: true, timestamp: "अभी" }]);
          setTimeout(() => {
            setConversation(prev => [...prev, { message: `✅ बिजली बिल ₹${billAmount.toLocaleString('en-IN')} भर दिया।`, isUser: false, timestamp: "अभी" }]);
            setStep("success");
            setIsListening(false);
          }, 1500);
        }
      }, 2000);
    }
  };

  const handleBillSelect = (bill: BillCategory) => {
    setSelectedBill(bill);
    setConversation(prev => [
      ...prev,
      { message: `${bill.nameHindi} बिल चुना`, isUser: true, timestamp: "अभी" },
      { message: `${bill.nameHindi} बिल ₹${billAmount.toLocaleString('en-IN')} है। 'हाँ' बोलें।`, isUser: false, timestamp: "अभी" }
    ]);
    setStep("confirm");
  };

  const handleNewPayment = () => {
    setStep("select");
    setSelectedBill(null);
    setConversation([{ message: "कौन सा बिल भरना है? बिजली, मोबाइल, या पानी?", isUser: false, timestamp: "अभी" }]);
  };

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
              <h1 className="font-semibold text-base sm:text-lg text-foreground">Pay Bills</h1>
              <p className="text-[11px] sm:text-xs text-muted-foreground">बिल भरें</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 pb-52 sm:pb-56">
        {/* Success State */}
        {step === "success" && (
          <section className="mb-6 sm:mb-8 animate-fade-in">
            <div className="glass-card rounded-2xl p-6 sm:p-8 text-center">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-secondary" />
              </div>
              <h2 className="text-lg sm:text-title text-foreground mb-2 font-semibold">Payment Successful!</h2>
              <p className="text-sm sm:text-base text-muted-foreground mb-4">₹{billAmount.toLocaleString('en-IN')} paid for {selectedBill?.name}</p>
              <button
                onClick={handleNewPayment}
                className="w-full sm:w-auto px-6 py-3.5 sm:py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 active:bg-primary/80 transition-colors touch-manipulation"
              >
                Pay Another Bill
              </button>
            </div>
          </section>
        )}

        {/* Bill Categories */}
        {step === "select" && (
          <section className="mb-6 sm:mb-8 animate-fade-in">
            <h2 className="text-lg sm:text-title text-foreground mb-3 sm:mb-4 font-semibold">Select Bill Type</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {billCategories.map((bill) => (
                <button
                  key={bill.id}
                  onClick={() => handleBillSelect(bill)}
                  className="glass-card rounded-2xl p-4 sm:p-6 flex flex-col items-center gap-2 sm:gap-3 hover:bg-muted/50 active:bg-muted/70 transition-colors touch-manipulation"
                >
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${bill.color} flex items-center justify-center`}>
                    <bill.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm sm:text-base text-foreground">{bill.name}</p>
                    <p className="text-[11px] sm:text-sm text-muted-foreground">{bill.nameHindi}</p>
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Bill Details */}
        {(step === "confirm" || step === "details") && selectedBill && (
          <section className="mb-6 sm:mb-8 animate-fade-in">
            <div className="glass-card rounded-2xl p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6">
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl ${selectedBill.color} flex items-center justify-center shrink-0`}>
                  <selectedBill.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm sm:text-base text-foreground">{selectedBill.name} Bill</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">{selectedBill.nameHindi} बिल</p>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4 py-3 sm:py-4 border-t border-border">
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Consumer No.</span>
                  <span className="font-medium text-foreground">1234567890</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Bill Period</span>
                  <span className="font-medium text-foreground">Dec 2024</span>
                </div>
                <div className="flex justify-between text-sm sm:text-base">
                  <span className="text-muted-foreground">Due Date</span>
                  <span className="font-medium text-foreground">20 Jan 2025</span>
                </div>
              </div>
              <div className="text-center py-4 sm:py-6 border-t border-border">
                <p className="text-xs sm:text-sm text-muted-foreground mb-2">Amount Due</p>
                <p className="text-3xl sm:text-display text-foreground font-bold">₹{billAmount.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </section>
        )}

        {/* Voice Commands */}
        <section className="mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg sm:text-title text-foreground mb-3 sm:mb-4 font-semibold">Voice Commands</h2>
          <div className="glass-card rounded-2xl p-3 sm:p-4 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-accent/10 rounded-xl">
              <span className="text-accent-foreground font-medium text-sm sm:text-base">"बिजली बिल"</span>
              <span className="text-muted-foreground text-xs sm:text-sm">- Electricity</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-accent/10 rounded-xl">
              <span className="text-accent-foreground font-medium text-sm sm:text-base">"मोबाइल रिचार्ज"</span>
              <span className="text-muted-foreground text-xs sm:text-sm">- Mobile</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-accent/10 rounded-xl">
              <span className="text-accent-foreground font-medium text-sm sm:text-base">"हाँ भरो"</span>
              <span className="text-muted-foreground text-xs sm:text-sm">- Confirm</span>
            </div>
          </div>
        </section>

        {/* Conversation */}
        <section className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
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
              <VoiceWave isActive={isListening} className="h-6 sm:h-8" />
              <p className="text-sm sm:text-base text-muted-foreground font-medium text-center">
                {isListening ? "सुन रहा हूं... बोलिए" :
                  step === "select" ? "बिल का नाम बोलें" :
                  step === "confirm" ? "'हाँ' बोलें" :
                  "नया बिल भरें"}
              </p>
              <VoiceButton isListening={isListening} onClick={handleVoiceToggle} disabled={step === "success"} />
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
                <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Say "बिजली बिल भरो"</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PayBills;
