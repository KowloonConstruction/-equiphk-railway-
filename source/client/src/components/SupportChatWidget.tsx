/*
 * Equip.HK 24/7 AI Support Chat Widget
 * Floating bottom-right button that opens a triage chat
 * 5-step flow: issue type → details → diagnostics → manual troubleshooting → escalation
 */
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Phone, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Streamdown } from "streamdown";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface EscalationData {
  name?: string;
  phone?: string;
  issue?: string;
  equipment?: string;
}

export default function SupportChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [escalation, setEscalation] = useState<{ data: EscalationData; whatsappUrl: string } | null>(null);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const triageMut = trpc.support.triageChat.useMutation();
  const escalateMut = trpc.support.escalate.useMutation();

  // Greet on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        role: "assistant",
        content: "👋 Hi! I'm the Equip.HK 24/7 support assistant.\n\nI can help you with:\n- **Equipment breakdowns** — I'll walk you through the troubleshooting steps\n- **Delivery or collection issues**\n- **Billing questions**\n- **Rental enquiries**\n\nWhat can I help you with today?",
      }]);
    }
    if (isOpen) setHasUnread(false);
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const result = await triageMut.mutateAsync({
        messages: newMessages,
      });

      const assistantMsg: ChatMessage = { role: "assistant", content: result.text };
      setMessages([...newMessages, assistantMsg]);

      // Handle escalation trigger from AI
      if (result.escalation) {
        await handleEscalation(result.escalation, [...newMessages, assistantMsg]);
      }
    } catch (err) {
      setMessages([...newMessages, {
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again or contact us directly at +852 9832 5789.",
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEscalation = async (data: EscalationData, allMessages: ChatMessage[]) => {
    try {
      const conversationLog = allMessages
        .map((m) => `${m.role === "user" ? "Customer" : "AI"}: ${m.content}`)
        .join("\n\n");

      const result = await escalateMut.mutateAsync({
        customerName: data.name,
        customerPhone: data.phone,
        issueType: "breakdown",
        equipmentName: data.equipment,
        summary: data.issue || "Customer requested escalation",
        conversationLog,
      });

      setEscalation({ data, whatsappUrl: result.whatsappUrl });
    } catch {
      // Escalation failed silently — AI message already told customer
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Button */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        <AnimatePresence>
          {!isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              className="bg-navy-deep text-cream text-xs px-3 py-1.5 rounded-full shadow-lg border border-orange/30 whitespace-nowrap"
            >
              24/7 AI Support
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-14 h-14 bg-orange rounded-full shadow-xl flex items-center justify-center text-white hover:bg-orange/90 transition-colors"
        >
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                <X className="w-6 h-6" />
              </motion.div>
            ) : (
              <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                <MessageCircle className="w-6 h-6" />
              </motion.div>
            )}
          </AnimatePresence>
          {hasUnread && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
          )}
        </motion.button>
      </div>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-3rem)] bg-white border border-border shadow-2xl rounded-none flex flex-col"
            style={{ height: "520px" }}
          >
            {/* Header */}
            <div className="bg-navy-deep px-4 py-3 flex items-center gap-3 shrink-0">
              <div className="w-8 h-8 bg-orange rounded-full flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-semibold font-[Oswald] uppercase tracking-wide">Equip.HK Support</p>
                <p className="text-cream/60 text-xs">AI Triage Assistant · 24/7</p>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="text-cream/60 text-xs">Online</span>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-concrete/30">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-orange text-white rounded-tl-lg rounded-tr-none rounded-bl-lg rounded-br-lg"
                        : "bg-white border border-border text-navy-deep rounded-tl-none rounded-tr-lg rounded-bl-lg rounded-br-lg shadow-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <Streamdown className="prose prose-sm max-w-none [&_p]:mb-1 [&_ul]:mb-1 [&_li]:mb-0">{msg.content}</Streamdown>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-border px-3 py-2 rounded-tr-lg rounded-bl-lg rounded-br-lg shadow-sm">
                    <Loader2 className="w-4 h-4 text-orange animate-spin" />
                  </div>
                </div>
              )}

              {/* Escalation Card */}
              {escalation && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-navy-deep text-white p-3 rounded-lg text-sm"
                >
                  <p className="font-semibold text-orange mb-1">Escalating to Equip.HK Team</p>
                  <p className="text-cream/70 text-xs mb-3">
                    Your ticket has been created. Tap below to open WhatsApp and connect directly with Casey.
                  </p>
                  <a
                    href={escalation.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-xs font-semibold transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    Open WhatsApp: +852 9832 5789
                    <ExternalLink className="w-3 h-3 ml-auto" />
                  </a>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border p-3 bg-white shrink-0">
              <div className="flex gap-2 items-end">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Describe your issue..."
                  className="resize-none text-sm min-h-[40px] max-h-[100px] border-border focus:border-orange rounded-none"
                  rows={1}
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="sm"
                  className="bg-orange hover:bg-orange/90 text-white rounded-none h-10 w-10 p-0 shrink-0"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-steel/50 mt-1.5 text-center">
                Press Enter to send · Shift+Enter for new line
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
