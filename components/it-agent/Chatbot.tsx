"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, X, MessageSquare, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';

export default function Chatbot({ oldAct, newAct, memo, onHistoryUpdate }: any) {
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [showSamples, setShowSamples] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, loading]);

    useEffect(() => {
        if (onHistoryUpdate) onHistoryUpdate(messages);
    }, [messages]);

    const samplePrompts = [
        "What are the 3 key differences in this section between 1961 and 2025 Act?",
        "Identify which elements of this section are newly introduced.",
        "Summarize the policy rationale from the Memorandum for this section.",
        "Does the amended text introduce any new thresholds or conditions?"
    ];

    const handleSend = async (textOverride?: string) => {
        const queryText = textOverride || input;
        if (!queryText.trim() || loading) return;

        const userMsg = { role: "user", content: queryText };
        setMessages(prev => [...prev, userMsg]);
        if (!textOverride) setInput("");
        setLoading(true);

        try {
            // SYNCED KEYS: matches Backend Schema exactly
            const res = await api.post('/it-agent/chat', {
                query: queryText,
                old_act: oldAct, 
                new_act: newAct,
                memo: memo,
                history: messages // Pass existing history
            });

            setMessages(prev => [...prev, { role: "assistant", content: res.data.answer }]);
        } catch (err) {
            console.error("Chat Error:", err);
            setMessages(prev => [...prev, { role: "assistant", content: "Error connecting to Tax AI. Please try again." }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden flex flex-col h-[600px] relative">
            {/* Header */}
            <div className="bg-indigo-600 p-4 text-white flex justify-between items-center shrink-0">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} />
                    <span className="font-bold text-sm uppercase tracking-tight">Tax AI Assistant</span>
                </div>
                <button 
                    onClick={() => setShowSamples(true)}
                    className="text-[10px] bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-full font-bold transition-colors"
                >
                    SAMPLE PROMPTS
                </button>
            </div>

            {/* Messages Area */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 space-y-2">
                        <MessageSquare size={40} strokeWidth={1} />
                        <p className="text-xs font-medium">Ask about the section comparison</p>
                    </div>
                )}
                {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm shadow-sm ${
                            m.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'
                        }`}>
                            <div className="tax-render-engine" dangerouslySetInnerHTML={{ __html: m.content }} />
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl rounded-tl-none flex gap-2 items-center">
                            <Loader2 size={14} className="animate-spin text-indigo-600" />
                            <span className="text-xs text-slate-400 font-medium">Analyzing statute...</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t bg-white flex gap-2 shrink-0">
                <input 
                    className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    placeholder="Ask about these changes..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button 
                    onClick={() => handleSend()}
                    disabled={loading || !input.trim()}
                    className="bg-indigo-600 text-white p-3 rounded-xl hover:bg-indigo-700 disabled:bg-slate-200 transition-all"
                >
                    <Send size={18} />
                </button>
            </div>

            {/* Sample Prompts Modal */}
            {showSamples && (
                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-6">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-4 border-b flex justify-between items-center">
                            <span className="font-bold text-slate-700 text-sm">Sample Prompts</span>
                            <button onClick={() => setShowSamples(false)}><X size={18} className="text-slate-400" /></button>
                        </div>
                        <div className="p-4 space-y-2">
                            {samplePrompts.map((p, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => { setShowSamples(false); handleSend(p); }}
                                    className="w-full text-left p-3 rounded-xl hover:bg-indigo-50 text-xs text-slate-600 transition-all border border-slate-100"
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}