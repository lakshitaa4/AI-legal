'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Copy, Download, Send, Eye, Loader2, User, Bot, FileText, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { summarizer_api } from '@/lib/api';

const API_BASE_URL =  'https://laksss-tax-hub.hf.space'; // Ensure this matches the backend URL
export default function SummarizerView() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [fullTextContext, setFullTextContext] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages, chatLoading]);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setMessages([]);
    setData(null);

    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('doc_type', 'General');
      
      const { job_id } = await summarizer_api.analyze(fd);
      if (!job_id) throw new Error("Job ID missing");

      // Initial Wait
      await new Promise(r => setTimeout(r, 20000));

      let completed = false;
      while (!completed) {
        const statusData = await summarizer_api.checkStatus(job_id);
        if (statusData.status === "completed") {
          const json = statusData.result;
          setData({ Summary: json.Summary, KeyDetails: json.KeyDetails });
          if (json.FullText) setFullTextContext(json.FullText);
          setPreviewUrl(URL.createObjectURL(file));
          completed = true;
        } else if (statusData.status === "failed") {
          throw new Error("Analysis failed");
        } else {
          await new Promise(r => setTimeout(r, 4000));
        }
      }
    } catch (err) {
      alert("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !data) return;
    const userMsg = { role: 'user', content: chatInput };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = chatInput;
    setChatInput("");
    setChatLoading(true);

    try {
      const fd = new FormData();
      fd.append('query', currentInput);
      if (fullTextContext) fd.append('context', fullTextContext);
      fd.append('history', JSON.stringify(messages.map(m => ({ role: m.role, parts: [{ text: m.content }] }))));
      fd.append('filename', file?.name || 'Document');
      
      // FIXED: Point to HF Backend
      const res = await fetch(`${API_BASE_URL}/summarizer/chat`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error("Backend Error");
      const result = await res.json();
      setMessages(prev => [...prev, { role: 'model', content: result.response }]);
    } catch (err) {
      setMessages(prev => [...prev, { role: 'model', content: "Error connecting to AI agent." }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleDownload = () => {
    if (!data) return;
    const htmlContent = `<!DOCTYPE html><html><body><h1>Summary</h1>${data.Summary}<h2>Details</h2>${data.KeyDetails}</body></html>`;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `Report_${file?.name.split('.')[0]}.html`; link.click();
  };

  return (
    <div className="h-[calc(100vh-65px)] flex flex-col bg-slate-50">
      <AnimatePresence mode="wait">
        {!data ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col items-center justify-center p-6">
            <Card className="w-full max-w-md p-8 border-2 border-dashed shadow-xl bg-white/80 backdrop-blur-sm">
              <div className="text-center space-y-6">
                <div className="bg-purple-100 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto shadow-inner"><FileText className="w-10 h-10 text-purple-600" /></div>
                <div className="space-y-2"><h2 className="text-2xl font-bold">Document Intelligence</h2><p className="text-slate-500 text-sm">Upload any document. AI will read every detail.</p></div>
                <div className="space-y-4"><Input type="file" accept=".pdf,.txt" onChange={(e) => setFile(e.target.files?.[0] || null)} className="cursor-pointer" />
                  <Button className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600" onClick={handleUpload} disabled={loading || !file}>
                    {loading ? <><Loader2 className="animate-spin mr-2" /> Reading Document...</> : "Begin Deep Analysis"}
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-1 overflow-hidden h-full">
            <div className="w-1/2 overflow-y-auto border-r bg-white p-8 space-y-8">
              <div className="flex justify-between items-start"><div><h2 className="text-3xl font-bold">Summary</h2><p className="text-sm text-slate-500 flex items-center"><FileText size={14} className="mr-1"/> {file?.name}</p></div>
                <div className="flex gap-2"><Dialog><DialogTrigger asChild><Button variant="outline" size="sm"><Eye size={14} className="mr-2"/> View Source</Button></DialogTrigger><DialogContent className="max-w-5xl h-[85vh] p-0"><iframe src={previewUrl!} className="w-full h-full" /></DialogContent></Dialog><Button variant="ghost" size="icon" onClick={handleDownload}><Download size={18}/></Button></div>
              </div>
              <div className="prose prose-slate max-w-none"><div dangerouslySetInnerHTML={{ __html: data.Summary }} className="p-6 bg-slate-50 rounded-xl border" />
                <div className="mt-8"><h3 className="text-xl font-bold mb-4 flex items-center"><AlertCircle size={20} className="mr-2 text-indigo-600" />Key Details</h3><div dangerouslySetInnerHTML={{ __html: data.KeyDetails }} className="rounded-lg border [&_table]:w-full [&_th]:p-3 [&_td]:p-3 [&_td]:border-t" /></div>
              </div>
            </div>
            <div className="w-1/2 flex flex-col bg-slate-50/50">
              <div className="p-4 border-b bg-white flex items-center justify-between shadow-sm"><div className="flex items-center gap-2"><Bot className="text-purple-600" /><div><h3 className="font-semibold">AI Assistant</h3><p className="text-xs text-slate-500">Context Loaded</p></div></div><Button variant="ghost" size="sm" onClick={() => {setData(null); setMessages([]);}}>Close</Button></div>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6">
                {messages.map((m, i) => (<div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}><div className={`p-4 rounded-2xl shadow-sm text-sm ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white border'}`} dangerouslySetInnerHTML={{ __html: m.content.replace(/\n/g, '<br/>') }} /></div>))}
                {chatLoading && <div className="flex justify-start"><div className="p-4 bg-white border rounded-2xl animate-pulse">Analyzing context...</div></div>}
              </div>
              <div className="p-4 bg-white border-t"><div className="relative flex items-center shadow-sm rounded-xl"><Input value={chatInput} onChange={e => setChatInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleChat()} placeholder="Type your question..." className="py-6 rounded-xl" disabled={chatLoading} /><Button onClick={handleChat} disabled={chatLoading || !chatInput.trim()} className="absolute right-2 bg-indigo-600"><Send size={18}/></Button></div></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}