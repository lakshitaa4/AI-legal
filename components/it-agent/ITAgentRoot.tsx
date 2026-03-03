"use client";
import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './Sidebar';
import { PanelLeftOpen, Loader2, Download, FileText, ChevronRight } from 'lucide-react';
import SearchBar from './SearchBar';
import ComparisonGrid from './ComparisonGrid';
import MemoFaqTabs from './MemoFaqTabs';
import Chatbot from './Chatbot';
import { api } from '@/lib/api'; 
// @ts-ignore
import html2pdf from 'html2pdf.js';

export default function ITAgentRoot() {
    // --- States ---
    const [sections, setSections] = useState([]);
    const [subsections, setSubsections] = useState([]); // NEW: Subsection storage
    const [comparisonData, setComparisonData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [loadingSubs, setLoadingSubs] = useState(false); // NEW: Loading state for subs
    const [downloading, setDownloading] = useState(false);
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [activeSection, setActiveSection] = useState<string | null>(null);
    const [chatHistory, setChatHistory] = useState<any[]>([]); 

    // --- Refs ---
    const scrollRef = useRef<HTMLDivElement>(null);
    const exportRef = useRef<HTMLDivElement>(null); 

    // --- Initial Load ---
    useEffect(() => {
        const loadSections = async () => {
            try {
                const res = await api.get('/it-agent/sections');
                setSections(res.data.sections || []);
            } catch (err) { 
                console.error("Failed to load IT sections", err); 
            }
        };
        loadSections();
    }, []);

    // --- Fetch Subsections Logic ---
    const fetchSubsections = async (num: string) => {
        setLoadingSubs(true);
        try {
            const res = await api.get(`/it-agent/subsections?sectionNumber=${num}`);
            setSubsections(res.data.subsections || []);
        } catch (err) {
            console.error("Error fetching subsections", err);
            setSubsections([]);
        } finally {
            setLoadingSubs(false);
        }
    };

    // --- Selection Logic ---
    const onMainSectionSelect = (num: string) => {
        setSubsections([]); // Clear previous subs
        fetchSubsections(num);
        handleCompare(num); // Load main section comparison immediately
    };

    // --- Core Comparison Action ---
    const handleCompare = async (num: string) => {
        if (!num) return;
        setLoading(true);
        setActiveSection(num); 
        setComparisonData(null); 
        setChatHistory([]); 
        
        scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

        try {
            const res = await api.post('/it-agent/compare', { sectionNumber: num });
            setComparisonData(res.data);
        } catch (err) { 
            alert("Statutory mapping not found for this section."); 
        } finally { 
            setLoading(false); 
        }
    };

    // --- PDF Export Logic (Untouched logic with lab() fix) ---
    const handleDownloadPDF = async () => {
        if (!exportRef.current || !comparisonData) return;
        setDownloading(true);

        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const element = exportRef.current;

            const opt = {
                margin: [15, 15, 15, 15],
                filename: `Tax_Advisory_Report_Sec_${activeSection}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { 
                    scale: 2, useCORS: true, logging: false,
                    onclone: (clonedDoc: Document) => {
                        const styles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
                        styles.forEach(s => s.remove());
                        const styleTag = clonedDoc.createElement('style');
                        styleTag.innerHTML = `
                            body { font-family: "Segoe UI", Helvetica, Arial, sans-serif !important; color: #334155; }
                            .pdf-only { display: block !important; }
                            .report-header { border-bottom: 3px solid #1e293b; padding-bottom: 10px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
                            .report-title { font-size: 24px; font-weight: 900; color: #0f172a; margin: 0; }
                            .grid { display: flex !important; flex-direction: row !important; gap: 20px; width: 100% !important; margin-bottom: 30px; }
                            .flex-1 { flex: 1 !important; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
                            .bg-slate-800 { background: #1e293b !important; padding: 10px; color: white !important; font-size: 10px; font-weight: bold; text-transform: uppercase; }
                            .bg-indigo-900 { background: #312e81 !important; padding: 10px; color: white !important; font-size: 10px; font-weight: bold; text-transform: uppercase; }
                            .p-8 { padding: 20px !important; }
                            .text-xl { font-size: 16px !important; font-weight: bold; margin-bottom: 10px; display: block; color: #1e293b; }
                            .tax-render-engine table { width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 9px; }
                            .tax-render-engine th, .tax-render-engine td { border: 1px solid #cbd5e1; padding: 6px; }
                            .tax-render-engine th { background: #f1f5f9; }
                            .tax-render-engine [style*="color:red"], .tax-render-engine s { color: #dc2626 !important; text-decoration: line-through !important; background: #fee2e2 !important; }
                            .tax-render-engine [style*="color:green"] { color: #16a34a !important; background: #dcfce7 !important; font-weight: bold !important; }
                            .chat-section-title { font-size: 18px; font-weight: bold; margin: 40px 0 15px 0; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px; }
                            .message-wrapper { margin-bottom: 15px; padding: 12px; border-radius: 8px; font-size: 11px; }
                            .user-msg { background: #f8fafc; border-left: 4px solid #6366f1; }
                            .assistant-msg { background: #ffffff; border: 1px solid #e2e8f0; }
                            .role-label { font-weight: bold; font-size: 9px; text-transform: uppercase; margin-bottom: 5px; display: block; color: #64748b; }
                        `;
                        clonedDoc.head.appendChild(styleTag);
                    }
                },
                jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' }
            };

            await html2pdf().set(opt).from(element).save();
        } catch (error) {
            console.error("PDF Error:", error);
        } finally {
            setDownloading(false);
        }
    };

    // --- AI Context Stringifiers (Stateless RAG) ---
    const getOldActContext = () => {
        if (!comparisonData?.act1961) return "";
        return Object.entries(comparisonData.act1961).map(([num, data]: any) => `SECTION ${num}:\nTitle: ${data.sectionTitle}\nText: ${data.sectionText}`).join("\n\n");
    };

    const getNewActContext = () => {
        if (!comparisonData?.act2025) return "";
        return Object.entries(comparisonData.act2025).map(([num, data]: any) => `SECTION ${num}:\nTitle: ${data.sectionTitle}\nText: ${data.sectionText}`).join("\n\n");
    };

    return (
        <div className="flex h-full w-full bg-white overflow-hidden relative">
            {sidebarOpen && (
                <div className="w-72 h-full shrink-0 border-r border-slate-200 animate-in slide-in-from-left duration-300">
                    <Sidebar setIsOpen={setSidebarOpen} onSelectAmendment={(num: string) => { setSubsections([]); handleCompare(num); }} activeSection={activeSection} />
                </div>
            )}

            <div className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
                {!sidebarOpen && (
                    <button onClick={() => setSidebarOpen(true)} className="absolute left-6 top-6 z-[60] bg-white p-3 rounded-xl border border-slate-200 shadow-xl text-indigo-600">
                        <PanelLeftOpen size={20} />
                    </button>
                )}

                <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar">
                    <div className="max-w-6xl mx-auto space-y-8">
                        
                        {/* SEARCH & ACTION BAR */}
                        <div className="relative z-[40] sticky top-0 bg-slate-50/80 backdrop-blur-md pt-2 pb-4"> 
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-4">
                                <div className="flex flex-col md:flex-row gap-4 items-center">
                                    <div className="flex-1 w-full">
                                        <SearchBar 
                                            sections={sections} 
                                            onSelect={onMainSectionSelect} 
                                            loading={loading} 
                                            placeholder="Search main section (e.g. 10, 115BAC)..."
                                        />
                                    </div>
                                    {comparisonData && (
                                        <button onClick={handleDownloadPDF} disabled={downloading} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-3 rounded-xl font-bold text-xs hover:bg-indigo-700 shadow-lg disabled:bg-slate-300 shrink-0">
                                            {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                                            {downloading ? "GENERATING..." : "DOWNLOAD REPORT"}
                                        </button>
                                    )}
                                </div>

                                {/* SUBSECTION SELECTOR (Visible only if subs exist) */}
                                {(subsections.length > 0 || loadingSubs) && (
                                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300 border-t pt-4">
                                        <div className="flex items-center gap-2 text-slate-400 shrink-0">
                                            <ChevronRight size={16} />
                                            <span className="text-[10px] font-bold uppercase tracking-widest">Select Subsection</span>
                                        </div>
                                        <div className="flex-1">
                                            <SearchBar 
                                                sections={subsections} 
                                                onSelect={handleCompare} 
                                                loading={loadingSubs} 
                                                placeholder="Choose subsection..."
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-40"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>
                        ) : comparisonData ? (
                            <div className="space-y-12 pb-20">
                                <div ref={exportRef} className="bg-white rounded-3xl overflow-hidden p-2">
                                    <div className="hidden pdf-only report-header">
                                        <div>
                                            <p className="report-title">Statutory Comparison & Advisory Report</p>
                                            <p style={{fontSize: '12px', color: '#64748b', margin: 0}}>Subject: Section {activeSection} Analysis</p>
                                        </div>
                                        <div style={{textAlign: 'right'}}>
                                            <p style={{fontSize: '10px', fontWeight: 'bold', margin: 0}}>CONFIDENTIAL</p>
                                            <p style={{fontSize: '10px', margin: 0}}>{new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    <ComparisonGrid data={comparisonData} />
                                    <MemoFaqTabs data={comparisonData} />
                                    {chatHistory.length > 0 && (
                                        <div className="hidden pdf-only">
                                            <div className="chat-section-title">Advisory Insights & AI Query History</div>
                                            {chatHistory.map((m, i) => (
                                                <div key={i} className={`message-wrapper ${m.role === 'user' ? 'user-msg' : 'assistant-msg'}`}>
                                                    <span className="role-label">{m.role === 'user' ? 'Tax Professional Query' : 'AI Technical Response'}</span>
                                                    <div className="tax-render-engine" dangerouslySetInnerHTML={{ __html: m.content }} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="pt-6 border-t border-slate-200">
                                    <Chatbot 
                                        oldAct={getOldActContext()}
                                        newAct={getNewActContext()}
                                        memo={JSON.stringify(comparisonData.memorandum)}
                                        onHistoryUpdate={(history: any) => setChatHistory(history)} 
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="py-48 text-center flex flex-col items-center gap-4 text-slate-300">
                                <FileText size={60} strokeWidth={1} />
                                <p className="text-slate-500 font-medium">Select a section to generate a technical report</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style jsx>{` @media screen { .pdf-only { display: none !important; } } `}</style>
        </div>
    );
}