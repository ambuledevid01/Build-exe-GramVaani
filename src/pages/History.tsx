import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Download, HelpCircle, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { VoiceButton } from "@/components/VoiceButton";
import { VoiceWave } from "@/components/VoiceWave";
import { ConversationBubble } from "@/components/ConversationBubble";
import { TransactionItem } from "@/components/TransactionItem";

const History = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [filter, setFilter] = useState<"all" | "credit" | "debit" | "bill">("all");
  const [conversation, setConversation] = useState([
    { message: "आपके लेनदेन का इतिहास। 'जमा' या 'निकासी' बोलें।", isUser: false, timestamp: "अभी" }
  ]);

  const transactions = [
    { type: "credit" as const, description: "Salary Credited", amount: 25000, date: "Today, 10:30 AM" },
    { type: "debit" as const, description: "Sent to राम कुमार", amount: 500, date: "Today, 9:15 AM" },
    { type: "bill" as const, description: "Electricity Bill", amount: 1250, date: "Yesterday" },
    { type: "debit" as const, description: "ATM Withdrawal", amount: 2000, date: "Jan 15" },
    { type: "credit" as const, description: "Refund - Amazon", amount: 1599, date: "Jan 14" },
    { type: "bill" as const, description: "Mobile Recharge", amount: 299, date: "Jan 13" },
    { type: "debit" as const, description: "Sent to सीता देवी", amount: 1000, date: "Jan 12" },
    { type: "credit" as const, description: "Interest Credited", amount: 125, date: "Jan 10" },
    { type: "bill" as const, description: "Gas Bill", amount: 450, date: "Jan 8" },
    { type: "debit" as const, description: "Shopping", amount: 3500, date: "Jan 5" },
  ];

  const filteredTransactions = transactions.filter(tx => 
    filter === "all" ? true : tx.type === filter
  );

  const totalCredit = transactions.filter(t => t.type === "credit").reduce((sum, t) => sum + t.amount, 0);
  const totalDebit = transactions.filter(t => t.type === "debit" || t.type === "bill").reduce((sum, t) => sum + t.amount, 0);

  const handleVoiceToggle = () => {
    setIsListening(!isListening);
    if (!isListening) {
      setTimeout(() => {
        setConversation(prev => [...prev, { message: "जमा दिखाओ", isUser: true, timestamp: "अभी" }]);
        setTimeout(() => {
          setFilter("credit");
          const creditTxns = transactions.filter(t => t.type === "credit");
          setConversation(prev => [...prev, { 
            message: `${creditTxns.length} जमा, कुल ₹${totalCredit.toLocaleString('en-IN')}।`, 
            isUser: false, 
            timestamp: "अभी" 
          }]);
          setIsListening(false);
        }, 1500);
      }, 2000);
    }
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-xl border-b border-border">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <button
                onClick={() => navigate("/")}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-muted flex items-center justify-center hover:bg-muted/80 active:bg-muted/70 transition-colors touch-manipulation shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </button>
              <div className="min-w-0">
                <h1 className="font-semibold text-base sm:text-lg text-foreground">Transaction History</h1>
                <p className="text-[11px] sm:text-xs text-muted-foreground">लेनदेन इतिहास</p>
              </div>
            </div>
            <button className="p-2.5 sm:p-2 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors touch-manipulation shrink-0">
              <Download className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 sm:py-6 pb-52 sm:pb-56">
        {/* Summary Cards */}
        <section className="grid grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6 animate-fade-in">
          <div className="glass-card rounded-2xl p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <ArrowDownLeft className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />
              <span className="text-[11px] sm:text-sm text-muted-foreground">Total Credit</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-secondary">+₹{totalCredit.toLocaleString('en-IN')}</p>
          </div>
          <div className="glass-card rounded-2xl p-3 sm:p-4">
            <div className="flex items-center gap-1.5 sm:gap-2 mb-1.5 sm:mb-2">
              <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 text-destructive" />
              <span className="text-[11px] sm:text-sm text-muted-foreground">Total Debit</span>
            </div>
            <p className="text-lg sm:text-xl font-bold text-destructive">-₹{totalDebit.toLocaleString('en-IN')}</p>
          </div>
        </section>

        {/* Filter Tabs */}
        <section className="mb-5 sm:mb-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
            {[
              { key: "all", label: "All", labelHindi: "सभी" },
              { key: "credit", label: "Credit", labelHindi: "जमा" },
              { key: "debit", label: "Debit", labelHindi: "निकासी" },
              { key: "bill", label: "Bills", labelHindi: "बिल" },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => handleFilterChange(f.key as typeof filter)}
                className={`px-3 sm:px-4 py-2.5 sm:py-2 rounded-xl font-medium whitespace-nowrap transition-colors touch-manipulation text-sm sm:text-base ${
                  filter === f.key 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80 active:bg-muted/70"
                }`}
              >
                {f.label} <span className="text-[10px] sm:text-xs opacity-75">({f.labelHindi})</span>
              </button>
            ))}
          </div>
        </section>

        {/* Transactions List */}
        <section className="mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-title text-foreground font-semibold">
              {filter === "all" ? "All" : 
               filter === "credit" ? "Credits" :
               filter === "debit" ? "Debits" : "Bills"}
            </h2>
            <span className="text-xs sm:text-sm text-muted-foreground">{filteredTransactions.length} items</span>
          </div>
          <div className="glass-card rounded-2xl divide-y divide-border overflow-hidden">
            {filteredTransactions.map((tx, idx) => (
              <TransactionItem key={idx} {...tx} />
            ))}
          </div>
        </section>

        {/* Voice Commands */}
        <section className="mb-6 sm:mb-8 animate-fade-in" style={{ animationDelay: '0.3s' }}>
          <h2 className="text-lg sm:text-title text-foreground mb-3 sm:mb-4 font-semibold">Voice Commands</h2>
          <div className="glass-card rounded-2xl p-3 sm:p-4 space-y-2 sm:space-y-3">
            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-primary/5 rounded-xl">
              <span className="text-primary font-medium text-sm sm:text-base">"जमा दिखाओ"</span>
              <span className="text-muted-foreground text-xs sm:text-sm">- Credits</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-primary/5 rounded-xl">
              <span className="text-primary font-medium text-sm sm:text-base">"निकासी दिखाओ"</span>
              <span className="text-muted-foreground text-xs sm:text-sm">- Debits</span>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-primary/5 rounded-xl">
              <span className="text-primary font-medium text-sm sm:text-base">"पिछले महीने"</span>
              <span className="text-muted-foreground text-xs sm:text-sm">- Last month</span>
            </div>
          </div>
        </section>

        {/* Conversation */}
        <section className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
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
                {isListening ? "सुन रहा हूं... बोलिए" : "फिल्टर के लिए बोलें"}
              </p>
              <VoiceButton isListening={isListening} onClick={handleVoiceToggle} />
              <div className="flex items-center gap-2 text-[11px] sm:text-xs text-muted-foreground">
                <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span>Say "जमा दिखाओ"</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default History;
