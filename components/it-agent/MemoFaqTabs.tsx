"use client";
import React, { useState } from 'react';
import { BookOpen, HelpCircle } from 'lucide-react';

export default function MemoFaqTabs({ data }: { data: any }) {
    const [activeTab, setActiveTab] = useState<'memo' | 'faq'>('memo');
    if (!data) return null;

    const renderContent = (type: 'memorandum' | 'faq') => {
        const content1961 = Object.entries(data?.[type]?.act1961 || {});
        const content2025 = Object.entries(data?.[type]?.act2025 || {});
        
        const allItems = [...content1961, ...content2025].filter(([_, item]: any) => {
            const txt = item.memorandumText || item.faqText || "";
            return txt.length > 0 && !txt.includes("No memorandum available") && !txt.includes("No FAQ available");
        });

        if (allItems.length === 0) {
            return <div className="py-10 text-center text-slate-400 text-sm italic">No supplementary information available.</div>;
        }

        return allItems.map(([key, item]: any, idx) => (
            <div key={idx} className="mb-8 last:mb-0 border-l-2 border-indigo-100 pl-6">
                <h4 className="font-bold text-slate-800 text-sm mb-2">Section {key}</h4>
                {/* 3. NEWLINE RENDERING: 'whitespace-pre-wrap' handles \n automatically */}
                <div 
                    className="text-slate-600 text-sm leading-relaxed tax-content whitespace-pre-wrap" 
                    dangerouslySetInnerHTML={{ __html: item.memorandumText || item.faqText }} 
                />
            </div>
        ));
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="flex bg-slate-50/50 border-b border-slate-100">
                <button onClick={() => setActiveTab('memo')} className={`flex-1 p-4 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'memo' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>Memorandum</button>
                <button onClick={() => setActiveTab('faq')} className={`flex-1 p-4 text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'faq' ? 'bg-white text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-400'}`}>FAQs</button>
            </div>
            <div className="p-8">
                {renderContent(activeTab === 'memo' ? 'memorandum' : 'faq')}
            </div>
        </div>
    );
}