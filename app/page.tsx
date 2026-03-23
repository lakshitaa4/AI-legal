'use client';
import { useState, useEffect } from 'react'; // Added useEffect
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

import { 
  FileSearch, 
  Calculator, 
  LayoutDashboard, 
  Scale,
  FilePenLine,
  Brain,
  LogOut // Added for logout button
} from 'lucide-react';

import TDSAgentView from '@/components/TDSAgentView';
import SummarizerView from '@/components/SummarizerView';
import ITAgentRoot from '@/components/it-agent/ITAgentRoot';
import NoticeAgentView from '@/components/NoticeAgentView';
import DraftingAgentView from '@/components/DraftingAgentView';
import LoginScreen from '@/components/LoginScreen'; // Added Login import
import ITResearchAgentView from '@/components/RAGDemoPage'

export default function App() {
  const [activeTool, setActiveTool] = useState<'landing' | 'tds' | 'summarizer' | 'it-agent' | 'notice' | 'drafting' | 'research'>('landing');
  const [user, setUser] = useState<string | null>(null); // Tracking user
  const [isInitialized, setIsInitialized] = useState(false); // Session check
  const [researchKey, setResearchKey] = useState(0)
  const resetResearch = () => { setResearchKey(prev => prev + 1); setActiveTool('research') }

  // Check for existing session on load
  useEffect(() => {
    const savedUser = localStorage.getItem("user_session");
    if (savedUser) setUser(savedUser);
    setIsInitialized(true);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    setUser(null);
    setActiveTool('landing');
  };

  const [tdsKey, setTdsKey] = useState(0);
  const [sumKey, setSumKey] = useState(0);
  const [itKey, setItKey] = useState(0);
  const [noticeKey, setNoticeKey] = useState(0);
  const [draftKey, setDraftKey] = useState(0); 

  const resetIT = () => {
    setItKey(prev => prev + 1);
    setActiveTool('it-agent');
  };

  const resetTDS = () => {
    setTdsKey(prev => prev + 1);
    setActiveTool('tds');
  };

  const resetSum = () => {
    setSumKey(prev => prev + 1);
    setActiveTool('summarizer');
  };

  const resetNotice = () => {
    setNoticeKey(prev => prev + 1);
    setActiveTool('notice');
  };

  const resetDraft = () => {
    setDraftKey(prev => prev + 1);
    setActiveTool('drafting');
  };

  // 1. Wait for initialization
  if (!isInitialized) return <div className="min-h-screen bg-slate-950" />;

  // 2. Redirect to Login if no user
  if (!user) {
    return <LoginScreen onLoginSuccess={(email) => setUser(email)} />;
  }

  if (activeTool === 'landing') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 relative">
        {/* Added Logout Button for Landing Page */}
        <div className="absolute top-8 right-8">
          <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-rose-500 font-bold uppercase text-[10px]">
             <LogOut size={14} className="mr-2"/> Sign Out
          </Button>
        </div>

        <div className="text-center mb-12 space-y-2">
          <h1 className="text-5xl font-black bg-gradient-to-r from-red-400 via-red-900 to-red-400 bg-clip-text text-transparent tracking-tight">AI POWERED</h1>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight">Professional <span className="text-indigo-600">Tax Suite</span></h1>
          <p className="text-slate-500 text-lg font-medium">Welcome back. Select a specialized agent to begin.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-10 w-full max-w-6xl mx-auto">
          
          <Card 
            onClick={() => setActiveTool('tds')}
            className="group p-8 cursor-pointer border-2 hover:border-blue-500 hover:shadow-2xl transition-all flex flex-col items-center text-center space-y-6 bg-white"
          >
            <div className="p-4 bg-blue-50 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
              <Calculator className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">TDS Compliance Agent</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Invoice analysis with statutory rule enforcement.</p>
            </div>
          </Card>

          <Card 
            onClick={() => setActiveTool('notice')}
            className="group p-8 cursor-pointer border-2 hover:border-orange-500 hover:shadow-2xl transition-all flex flex-col items-center text-center space-y-6 bg-white"
          >
            <div className="p-4 bg-orange-50 rounded-2xl group-hover:bg-orange-600 group-hover:text-white transition-colors">
              <Scale className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Notice/Order Validation Agent</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Deep-dive validation of Tax Notices & GST Demands.</p>
            </div>
          </Card>

          <Card 
            onClick={() => setActiveTool('drafting')}
            className="group p-8 cursor-pointer border-2 hover:border-rose-500 hover:shadow-2xl transition-all flex flex-col items-center text-center space-y-6 bg-white"
          >
            <div className="p-4 bg-rose-50 rounded-2xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
              <FilePenLine className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Drafting Agent</h2>
              <p className="text-slate-500 text-sm leading-relaxed">AI-powered legal drafting for replies & BOP narratives.</p>
            </div>
          </Card>

          <Card 
            onClick={() => setActiveTool('summarizer')}
            className="group p-8 cursor-pointer border-2 hover:border-purple-500 hover:shadow-2xl transition-all flex flex-col items-center text-center space-y-6 bg-white"
          >
            <div className="p-4 bg-purple-50 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-colors">
              <FileSearch className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Document Summarizer Agent</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Context-aware RAG for complex legal contracts.</p>
            </div>
          </Card>

          <Card 
            onClick={() => setActiveTool('it-agent')}
            className="group p-8 cursor-pointer border-2 hover:border-emerald-500 hover:shadow-2xl transition-all flex flex-col items-center text-center space-y-6 bg-white"
          >
            <div className="p-4 bg-emerald-50 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-colors">
              <LayoutDashboard className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">IT Comparison Agent</h2>
              <p className="text-slate-500 text-sm leading-relaxed">Income Tax Act comparison & advisory workflows.</p>
            </div>
          </Card>
          <Card
            onClick={() => setActiveTool('research')}
            className="group p-8 cursor-pointer border-2 hover:border-indigo-500 hover:shadow-2xl transition-all flex flex-col items-center text-center space-y-6 bg-white"
          >
            <div className="p-4 bg-indigo-50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <Brain className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Tax Law Research Agent</h2>
              <p className="text-slate-500 text-sm leading-relaxed">
                Statutory research on ITA 1961 with cited answers and amendment alerts.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* TOP BAR */}
      <div className="h-16 border-b flex items-center justify-between px-6 bg-white sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setActiveTool('landing')}
            className="text-slate-500 hover:text-indigo-600 font-bold"
          >
            <LayoutDashboard className="mr-2 h-4 w-4" /> 
            Dashboard
          </Button>
          
          <div className="h-6 w-[1px] bg-slate-200" />

          <button 
            onClick={
                activeTool === 'tds' ? resetTDS
                : activeTool === 'summarizer' ? resetSum
                : activeTool === 'it-agent' ? resetIT
                : activeTool === 'notice' ? resetNotice
                : activeTool === 'research' ? resetResearch
                : resetDraft
              }
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
          >
            {activeTool === 'tds' && (
              <><Calculator className="w-5 h-5 text-blue-600" /><span className="font-bold text-slate-900">TDS Agent</span></>
            )}
            {activeTool === 'summarizer' && (
              <><FileSearch className="w-5 h-5 text-purple-600" /><span className="font-bold text-slate-900">Document Summarizer Agent</span></>
            )}
            {activeTool === 'it-agent' && (
              <><LayoutDashboard className="w-5 h-5 text-emerald-600" /><span className="font-bold text-slate-900">IT Comparison Agent</span></>
            )}
            {activeTool === 'notice' && (
              <><Scale className="w-5 h-5 text-orange-600" /><span className="font-bold text-slate-900">Notice/Order Validation Agent</span></>
            )}
            {activeTool === 'drafting' && (
              <><FilePenLine className="w-5 h-5 text-rose-600" /><span className="font-bold text-slate-900">Drafting Agent</span></>
            )}

            {activeTool === 'research' && (
              <><Brain className="w-5 h-5 text-indigo-600" /><span className="font-bold text-slate-900">Tax Law Research Agent</span></>
            )}

            <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-400 font-black uppercase ml-1">Restart</span>
          </button>
        </div>

        {/* Added Logout to Top Bar as well */}
        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-400 font-bold tracking-widest uppercase">
            Powered by Gemini 3 Flash
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="p-2 h-8 w-8 rounded-full hover:bg-rose-50 text-slate-400 hover:text-rose-500 transition-colors">
            <LogOut size={16} />
          </Button>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden">
        {activeTool === 'tds' && (
          <motion.div key={`tds-${tdsKey}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="h-full">
            <TDSAgentView />
          </motion.div>
        )}

        {activeTool === 'summarizer' && (
          <motion.div key={`sum-${sumKey}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="h-full">
            <SummarizerView />
          </motion.div>
        )}

        {activeTool === 'it-agent' && (
          <motion.div key={`it-${itKey}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="h-full">
            <ITAgentRoot />
          </motion.div>
        )}

        {activeTool === 'notice' && (
          <motion.div key={`notice-${noticeKey}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="h-full">
            <NoticeAgentView />
          </motion.div>
        )}

        {activeTool === 'drafting' && (
          <motion.div key={`draft-${draftKey}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="h-full">
            <DraftingAgentView />
          </motion.div>
        )}

        {activeTool === 'research' && (
          <motion.div key={`research-${researchKey}`} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="h-full">
            <ITResearchAgentView />
          </motion.div>
        )}
      </div>
    </div>
  );
}