"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Editor } from '@tiptap/react';
import {
  FileText, Send, Download, Sparkles, MessageSquare, Edit3,
  ShieldCheck, Eye, EyeOff, X, GripHorizontal,
  Bold, Italic, List, ListOrdered, Table,
  ChevronDown, Heading1, Heading2, Minus, RotateCcw,
} from "lucide-react";
import { DraftResponse, DraftSection } from "@/types/drafting";
import { drafting_api } from "@/lib/api";

// ─── PALETTE ─────────────────────────────────────────────────────────────────
const C = {
  bg:          "#18181B",   // zinc-900
  surface:     "#27272A",   // zinc-800
  elevated:    "#2F2F33",   // slightly lighter surface
  border:      "#3F3F46",   // zinc-700
  muted:       "#71717A",   // zinc-500
  subtle:      "#A1A1AA",   // zinc-400
  text:        "#F4F4F5",   // zinc-100
  accent:      "#F59E0B",   // amber-500
  accentDim:   "#1C1804",   // dark amber bg
  accentBorder:"#78350F",   // amber-900 border
  paper:       "#FAFAF9",   // warm white
  paperBorder: "#E7E5E4",   // stone-200
};

const DOMAINS = ["Transfer Pricing", "Direct Tax", "Indirect Tax", "Customs"];

// ─── TIPTAP EDITOR CLASS STRING ───────────────────────────────────────────────
// Defined outside component so it's stable
const EDITOR_CLASS = [
  "focus:outline-none",
  "text-zinc-800",
  "px-16 py-14",
  "min-h-[900px]",
  // Lists
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-3",
  "[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-3",
  "[&_li]:my-1.5",
  // Headings
  "[&_h1]:text-[22px] [&_h1]:font-bold [&_h1]:mt-8 [&_h1]:mb-3 [&_h1]:text-zinc-900",
  "[&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:mt-6 [&_h2]:mb-2 [&_h2]:text-zinc-800",
  "[&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-1",
  // Inline
  "[&_strong]:font-bold [&_em]:italic [&_u]:underline",
  "[&_p]:my-2 [&_p]:leading-[1.85]",
  // HR
  "[&_hr]:my-6 [&_hr]:border-zinc-200",
  // Blockquote
  "[&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-zinc-500",
].join(" ");

export default function DraftingAgentView() {
  const [file, setFile]                   = useState<File | null>(null);
  const [fileUrl, setFileUrl]             = useState<string | null>(null);
  const [domain, setDomain]               = useState("Transfer Pricing");
  const [draftType, setDraftType]         = useState("Notice");
  const [loading, setLoading]             = useState(false);
  const [showContext, setShowContext]      = useState(true);
  const [chatOpen, setChatOpen]           = useState(false);
  const [result, setResult]               = useState<DraftResponse | null>(null);
  const [editedSections, setEditedSections] = useState<DraftSection[]>([]);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: "",
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: EDITOR_CLASS,
        style: `font-family: 'Lora', Georgia, serif; font-size: 15px; line-height: 1.85;`,
      },
    },
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const f = e.target.files[0];
      setFile(f);
      setFileUrl(f.type === "application/pdf" ? URL.createObjectURL(f) : null);
    }
  };

  const handleGenerate = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("domain", domain);
    formData.append("topic", "Submission Drafting");
    formData.append("draft_type", draftType);

    try {
      const { job_id } = await drafting_api.generate(formData);
      
      if (!job_id) throw new Error("Job ID missing");

      // Wait 20s
      await new Promise(r => setTimeout(r, 20000));

      let completed = false;
      while (!completed) {
        const statusData = await drafting_api.checkStatus(job_id);
        
        if (statusData.status === "completed") {
          const data = statusData.result;
          setResult(data);
          setEditedSections(data.sections);
          editor?.commands.setContent(data.sections.map((s: DraftSection) => s.content).join("<br><br>"));
          completed = true;
        } else if (statusData.status === "failed") {
          throw new Error(statusData.error || "Drafting failed");
        } else {
          await new Promise(r => setTimeout(r, 4000));
        }
      }
    } catch (err) {
      console.error("Drafting error:", err);
      alert("Drafting failed.");
    } finally {
      setLoading(false);
    }
  };

  // Inside DraftingAgentView.tsx
  const handleDownload = async () => {
    if (!editor) return;
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("html_content", editor.getHTML());
      formData.append("filename", `${draftType}_Draft.docx`);

      // SURGICAL FIX: Use the full HF URL
      const API_URL = 'https://laksss-tax-hub.hf.space';
      const res = await fetch(`${API_URL}/api/v1/drafting/download`, { 
        method: "POST", 
        body: formData 
      });

      if (!res.ok) throw new Error("Download failed");

      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; 
      a.download = `${draftType}_Draft.docx`; 
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download error:", err);
      alert("Could not generate Word document.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=DM+Mono:wght@400;500&display=swap');
        .dm { font-family: 'DM Mono', monospace; }
      `}</style>

      <div className="dm flex flex-col h-screen overflow-hidden" style={{ background: C.bg }}>

        {/* ── TOP BAR ── */}
        <div className="h-12 flex items-center justify-between px-5 shrink-0 z-30"
          style={{ background: C.surface, borderBottom: `1px solid ${C.border}` }}>

          <div className="flex items-center gap-5">
            <button onClick={() => setShowContext(v => !v)}
              className="flex items-center gap-1.5 text-[11px] font-medium transition-colors"
              style={{ color: showContext ? C.accent : C.muted }}>
              {showContext ? <EyeOff size={13} /> : <Eye size={13} />}
              {showContext ? "Hide source" : "Show source"}
            </button>

            <Divider />

            <SelectField label="Draft" value={draftType} onChange={setDraftType}>
              <option value="Notice">Reply to Notice</option>
              <option value="BOP">BOP Narrative</option>
            </SelectField>

            <SelectField label="Domain" value={domain} onChange={setDomain}>
              {DOMAINS.map(d => <option key={d}>{d}</option>)}
            </SelectField>
          </div>

          <div className="flex items-center gap-2.5">
            <input type="file" onChange={handleFileUpload} className="hidden" id="dfu" />
            <label htmlFor="dfu"
              className="flex items-center gap-2 px-3 py-1.5 rounded text-[11px] font-medium cursor-pointer"
              style={{ background: C.bg, color: C.subtle, border: `1px solid ${C.border}` }}>
              {draftType === "BOP"
                ? <Table size={12} style={{ color: "#34D399" }} />
                : <FileText size={12} style={{ color: C.accent }} />}
              {file ? file.name.slice(0, 24) + (file.name.length > 24 ? "…" : "") : "Upload document"}
            </label>

            <button onClick={handleGenerate} disabled={!file || loading}
              className="flex items-center gap-2 px-4 py-1.5 rounded text-[11px] font-bold transition-all disabled:opacity-30"
              style={{ background: C.accent, color: C.bg }}>
              {loading
                ? <div className="h-3 w-3 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                : <Sparkles size={12} />}
              {loading ? "Drafting…" : "Generate draft"}
            </button>
          </div>
        </div>

        {/* ── MAIN AREA ── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* SOURCE PANEL */}
          <AnimatePresence>
            {showContext && (
              <motion.div
                initial={{ width: 0, opacity: 0 }} animate={{ width: "34%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
                className="shrink-0 overflow-hidden"
                style={{ borderRight: `1px solid ${C.border}`, background: "#111113" }}>
                {fileUrl
                  ? <iframe src={fileUrl} className="w-full h-full border-none" title="Source" />
                  : <EmptyState icon={FileText} label="No document uploaded" />}
              </motion.div>
            )}
          </AnimatePresence>

          {/* EDITOR COLUMN */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden" style={{ background: "#1C1C1F" }}>

            {/* TOOLBAR */}
            <AnimatePresence>
              {editor && result && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
                  className="shrink-0 flex justify-center pt-3 pb-2 px-4">
                  <div className="inline-flex items-center gap-0.5 px-2 py-1.5 rounded-lg"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <TBtn e={editor} cmd={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                      active={editor.isActive("heading", { level: 1 })} icon={Heading1} label="Heading 1" />
                    <TBtn e={editor} cmd={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                      active={editor.isActive("heading", { level: 2 })} icon={Heading2} label="Heading 2" />
                    <Sep />
                    <TBtn e={editor} cmd={() => editor.chain().focus().toggleBold().run()}
                      active={editor.isActive("bold")} icon={Bold} label="Bold" />
                    <TBtn e={editor} cmd={() => editor.chain().focus().toggleItalic().run()}
                      active={editor.isActive("italic")} icon={Italic} label="Italic" />
                    <TBtn e={editor}
                      cmd={() => { editor?.chain().focus().toggleUnderline().run(); }}
                      active={editor.isActive("underline")}
                      icon={() => <span className="text-[13px] font-bold underline leading-none" style={{ fontFamily: 'serif' }}>U</span>}
                      label="Underline" />
                    <Sep />
                    <TBtn e={editor} cmd={() => editor.chain().focus().toggleBulletList().run()}
                      active={editor.isActive("bulletList")} icon={List} label="Bullet list" />
                    <TBtn e={editor} cmd={() => editor.chain().focus().toggleOrderedList().run()}
                      active={editor.isActive("orderedList")} icon={ListOrdered} label="Numbered list" />
                    <TBtn e={editor} cmd={() => editor.chain().focus().setHorizontalRule().run()}
                      active={false} icon={Minus} label="Divider" />
                    <Sep />
                    <TBtn e={editor} cmd={() => editor.chain().focus().undo().run()}
                      active={false} icon={RotateCcw} label="Undo (Ctrl+Z)" />
                    <Sep />
                    <button onClick={handleDownload}
                      className="flex items-center gap-1.5 px-3 py-1 rounded text-[11px] font-medium"
                      style={{ color: C.accent, background: C.accentDim, border: `1px solid ${C.accentBorder}` }}>
                      <Download size={11} /> Export .docx
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* SCROLL AREA */}
            <div className="flex-1 min-h-0 overflow-y-auto px-8 pb-24 pt-2"
              style={{ scrollbarWidth: "thin", scrollbarColor: `${C.border} transparent` }}>

              {!result && !loading && <EmptyState icon={Edit3} label="Upload a document to generate a draft" />}

              {loading && (
                <div className="flex flex-col items-center justify-center h-full gap-4">
                  <div className="w-8 h-8 border-2 rounded-full animate-spin"
                    style={{ borderColor: `${C.border} ${C.border} ${C.border} ${C.accent}` }} />
                  <p className="text-[11px] uppercase tracking-widest animate-pulse" style={{ color: C.muted }}>
                    Generating draft…
                  </p>
                </div>
              )}

              {result && !loading && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
                  className="w-full max-w-[760px] mx-auto shadow-2xl"
                  style={{ background: C.paper, border: `1px solid ${C.paperBorder}`, borderRadius: 2 }}>
                  {/* ↑ paper is NOT flex-1 — it grows naturally with content */}
                  <EditorContent editor={editor} />
                </motion.div>
              )}
            </div>
          </div>

          {/* STRATEGY SIDEBAR */}
          <div className="w-72 flex flex-col shrink-0"
            style={{ borderLeft: `1px solid ${C.border}`, background: C.surface }}>
            <div className="px-4 py-3 shrink-0 flex items-center gap-2"
              style={{ borderBottom: `1px solid ${C.border}` }}>
              <ShieldCheck size={12} style={{ color: C.accent }} />
              <h3 className="text-[10px] uppercase tracking-widest font-medium" style={{ color: C.subtle }}>
                Strategy Panel
              </h3>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3"
              style={{ scrollbarWidth: "thin", scrollbarColor: `${C.border} transparent` }}>
              {result ? (
                <>
                  <div className="rounded-lg px-4 py-4"
                    style={{ background: C.accentDim, border: `1px solid ${C.accentBorder}` }}>
                    <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: C.accent }}>
                      Master Strategy
                    </p>
                    <p className="text-[12px] leading-relaxed italic"
                      style={{ color: "#FDE68A", fontFamily: "'Lora', serif" }}>
                      "{result.overall_strategy}"
                    </p>
                  </div>
                  {editedSections.map((s, i) => (
                    <SectionReasoning key={i} section={s} index={i} />
                  ))}
                </>
              ) : (
                <EmptyState icon={Sparkles} label="Strategy logic appears after generation" small />
              )}
            </div>
          </div>
        </div>

        {/* ── CHATBOT FAB — always rendered when result exists ── */}
        {result && (
          <ChatFAB
            isOpen={chatOpen}
            setIsOpen={setChatOpen}
            draftContext={editor?.getHTML() || ""}
          />
        )}
      </div>
    </>
  );
}

// ─── SECTION REASONING ───────────────────────────────────────────────────────
function SectionReasoning({ section, index }: { section: DraftSection; index: number }) {
  const [open, setOpen] = useState(index === 0);
  return (
    <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}`, background: C.bg }}>
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-left">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0"
            style={{ background: C.accent, color: C.bg }}>{index + 1}</span>
          <span className="text-[11px] font-medium truncate" style={{ color: C.subtle }}>{section.title}</span>
        </div>
        <ChevronDown size={12} className="shrink-0 transition-transform"
          style={{ color: C.muted, transform: open ? "rotate(180deg)" : "none" }} />
      </button>
      {open && (
        <div className="px-3 pb-3 pt-2" style={{ borderTop: `1px solid ${C.border}` }}>
          <p className="text-[11px] leading-relaxed" style={{ color: C.muted }}>{section.reasoning}</p>
        </div>
      )}
    </div>
  );
}

// ─── CHAT FAB + WINDOW ────────────────────────────────────────────────────────
function ChatFAB({ isOpen, setIsOpen, draftContext }: {
  isOpen: boolean; setIsOpen: (v: boolean) => void; draftContext: string;
}) {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const scrollRef               = useRef<HTMLDivElement>(null);

  // Inside ChatFAB component in DraftingAgentView.tsx
  const onSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user", content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput(""); 
    setLoading(true);

    try {
      // SURGICAL FIX: Use drafting_api instead of hardcoded fetch
      const data = await drafting_api.chat({ 
        draft_context: draftContext, 
        question: input, 
        history: messages 
      });
      
      setMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
      
      setTimeout(() => { 
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; 
      }, 100);
    } catch (err) { 
      console.error("Chat Error:", err);
      setMessages(prev => [...prev, { role: "assistant", content: "Error: Could not connect to AI Agent." }]);
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end gap-3"
      style={{ fontFamily: "'DM Mono', monospace" }}>
      <AnimatePresence>
        {isOpen && (
          <motion.div drag dragMomentum={false}
            dragConstraints={{ top: -500, left: -600, right: 0, bottom: 0 }}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.18 }}
            className="flex flex-col overflow-hidden rounded-xl shadow-2xl"
            style={{ width: 380, height: 520, background: C.surface, border: `1px solid ${C.border}` }}>

            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between cursor-grab active:cursor-grabbing shrink-0"
              style={{ background: C.bg, borderBottom: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2.5">
                <GripHorizontal size={14} style={{ color: C.muted }} />
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: C.text }}>AI Consultant</p>
                  <p className="text-[9px] uppercase tracking-wider" style={{ color: C.accent }}>Context Aware</p>
                </div>
              </div>
              <button onClick={() => setIsOpen(false)} style={{ color: C.muted }}>
                <X size={14} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3"
              style={{ background: C.bg, scrollbarWidth: "thin", scrollbarColor: `${C.border} transparent` }}>
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center px-8 select-none"
                  style={{ color: C.muted }}>
                  <Sparkles size={32} strokeWidth={1} className="mb-3 opacity-30" />
                  <p className="text-[11px] leading-relaxed">
                    Ask me to refine arguments, cite precedents, or strengthen any section.
                  </p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[85%] px-3 py-2.5 rounded-lg text-[12px] leading-relaxed"
                    style={m.role === "user"
                      ? { background: C.accent, color: C.bg, fontWeight: 500 }
                      : { background: C.elevated, color: C.text, border: `1px solid ${C.border}` }}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-4 py-3 rounded-lg flex items-center gap-1.5"
                    style={{ background: C.elevated, border: `1px solid ${C.border}` }}>
                    {[0, 1, 2].map(i => (
                      <div key={i} className="w-1.5 h-1.5 rounded-full animate-bounce"
                        style={{ background: C.accent, animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 shrink-0" style={{ background: C.surface, borderTop: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg"
                style={{ background: C.bg, border: `1px solid ${C.border}` }}>
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && onSend()}
                  placeholder="Ask about the draft…"
                  className="flex-1 bg-transparent outline-none text-[12px]"
                  style={{ color: C.text }} />
                <button onClick={onSend} style={{ color: C.accent }}><Send size={14} /></button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB — always visible when result exists, triggers chat */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.94 }}
        className="w-12 h-12 rounded-full flex items-center justify-center shadow-2xl"
        style={isOpen
          ? { background: C.surface, border: `2px solid ${C.accent}`, color: C.accent }
          : { background: C.accent, color: C.bg }}>
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </motion.button>
    </div>
  );
}

// ─── TINY SHARED COMPONENTS ───────────────────────────────────────────────────
interface TBtnProps {
  e?: Editor | null;
  cmd: () => void;
  active?: boolean;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;
  label: string;
}

function TBtn({ e, cmd, active, icon: Icon, label }: TBtnProps) {
  return (
    <button onClick={cmd} title={label}
      className="p-1.5 rounded transition-colors"
      style={{ background: active ? C.accent : "transparent", color: active ? C.bg : C.muted }}>
      <Icon size={14} />
    </button>
  );
}

function Sep() {
  return <div className="w-px h-4 mx-1" style={{ background: C.border }} />;
}

function Divider() {
  return <div style={{ width: 1, height: 14, background: C.border }} />;
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}

function SelectField({ label, value, onChange, children }: SelectFieldProps) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[9px] uppercase tracking-widest font-medium" style={{ color: C.muted }}>{label}</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        className="text-[11px] font-medium rounded px-2 py-1 outline-none cursor-pointer"
        style={{ background: C.bg, color: C.text, border: `1px solid ${C.border}` }}>
        {children}
      </select>
    </div>
  );
}

interface EmptyStateProps {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement> & { size?: number; strokeWidth?: number }>;
  label: string;
  small?: boolean;
}

function EmptyState({ icon: Icon, label, small = false }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full select-none" style={{ color: C.muted }}>
      <Icon size={small ? 28 : 44} strokeWidth={1} className={`mb-2.5 opacity-20 ${small ? "" : "opacity-20"}`} />
      <p className={`${small ? "text-[10px]" : "text-[11px]"} uppercase tracking-widest text-center px-4`}>{label}</p>
    </div>
  );
}