import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, language } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service not configured");
    }

    console.log(`Processing voice command: "${message}" in language: ${language}`);

    const systemPrompt = `You are a voice banking assistant for rural India. Analyze user commands and respond with JSON.

IMPORTANT: Always respond with valid JSON in this exact format:
{
  "intent": "check_balance" | "send_money" | "pay_bills" | "view_history" | "help" | "greeting" | "unknown",
  "response": "Your spoken response in ${language === "hi" ? "Hindi (Devanagari script)" : "English"}",
  "action": "navigate" | "speak" | null,
  "route": "/check-balance" | "/send-money" | "/pay-bills" | "/history" | null,
  "entities": {
    "amount": number or null,
    "recipient": "name" or null,
    "bill_type": "electricity" | "mobile" | "gas" | "water" or null
  }
}

INTENT DETECTION RULES:
- "balance", "बैलेंस", "पैसे कितने", "खाते में", "check" → check_balance
- "भेजो", "भेजना", "transfer", "send", "पैसे देना" → send_money  
- "बिल", "bill", "recharge", "रिचार्ज", "बिजली", "electricity", "mobile", "gas" → pay_bills
- "history", "इतिहास", "पिछले", "transactions", "लेनदेन" → view_history
- "help", "मदद", "सहायता", "कैसे" → help
- "नमस्ते", "hello", "hi" → greeting

RESPONSE RULES:
1. Keep responses SHORT (1-2 sentences) for speaking
2. For balance: say "आपके खाते में ₹24,580 उपलब्ध हैं।"
3. For send_money: navigate to send money page
4. For pay_bills: ask which bill or navigate
5. Be friendly and use simple Hindi/English

EXAMPLES:
User: "मेरा बैलेंस बताओ"
{"intent":"check_balance","response":"आपके खाते में ₹24,580 उपलब्ध हैं।","action":"speak","route":null,"entities":{}}

User: "पैसे भेजना है"
{"intent":"send_money","response":"किसे पैसे भेजना है? Send Money पेज खोल रहा हूं।","action":"navigate","route":"/send-money","entities":{}}

User: "राम को 500 भेजो"
{"intent":"send_money","response":"राम को ₹500 भेजने के लिए Send Money पेज खोल रहा हूं।","action":"navigate","route":"/send-money","entities":{"amount":500,"recipient":"राम"}}

User: "बिजली का बिल भरना है"  
{"intent":"pay_bills","response":"बिजली बिल भरने के लिए Pay Bills पेज खोल रहा हूं।","action":"navigate","route":"/pay-bills","entities":{"bill_type":"electricity"}}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`AI Gateway error: ${response.status} - ${errorText}`);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Too many requests. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    let aiContent = data.choices?.[0]?.message?.content || "";
    
    console.log(`Raw AI response: "${aiContent}"`);

    // Parse JSON from response (handle markdown code blocks)
    let parsedResponse;
    try {
      // Remove markdown code blocks if present
      aiContent = aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsedResponse = JSON.parse(aiContent);
    } catch (parseError) {
      console.error("Failed to parse AI response as JSON:", parseError);
      // Fallback response
      parsedResponse = {
        intent: "unknown",
        response: language === "hi" ? "माफ कीजिए, मुझे समझ नहीं आया। कृपया दोबारा बोलें।" : "Sorry, I didn't understand. Please try again.",
        action: "speak",
        route: null,
        entities: {}
      };
    }

    console.log(`Parsed response:`, parsedResponse);

    return new Response(
      JSON.stringify(parsedResponse),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in voice-command function:", errorMessage);
    return new Response(
      JSON.stringify({ 
        intent: "error",
        response: "माफ कीजिए, कुछ गड़बड़ हुई।",
        action: "speak",
        route: null,
        entities: {},
        error: errorMessage 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
