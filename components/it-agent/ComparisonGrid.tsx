"use client";
import React from 'react';
import MarkdownIt from 'markdown-it';

const md = new MarkdownIt({ html: true, breaks: true }).enable(['table']);

export default function ComparisonGrid({ data }: { data: any }) {
    const format = (txt: string) => {
        if (!txt) return "";
        // Clean out Budget 2026 header artifacts
        const cleaned = txt
            .replace(/XVII ##/g, 'Chapter XVII: ')
            .replace(/##/g, '')
            .replace(/# /g, '\n')
            .replace(/thisChapter\.k!!!Nested/g, '');
        return md.render(cleaned);
    };

    const renderSection = (key: string, section: any, act: string) => (
        <div key={key} className="p-8 border-b last:border-0 border-slate-100">
            {section.chapterNumber && (
                <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-2" 
                     dangerouslySetInnerHTML={{ __html: format(section.chapterNumber) }} />
            )}
            
            <div className="flex items-start gap-3 mb-6">
                <span className={`mt-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${act === 'old' ? 'bg-slate-100 text-slate-500' : 'bg-emerald-100 text-emerald-700'}`}>
                    Section {key}
                </span>
                <div className="text-xl font-black text-slate-900 leading-tight" 
                     dangerouslySetInnerHTML={{ __html: format(section.sectionTitle) }} />
            </div>

            {/* TAX CONTENT: Markdown + Table Support */}
            <div className="prose prose-slate max-w-none prose-sm overflow-x-auto custom-scrollbar">
                <div className="tax-render-engine" dangerouslySetInnerHTML={{ __html: format(section.sectionText) }} />
            </div>
        </div>
    );

    return (
        <div className="grid grid-cols-1 xl:grid-cols-2 bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="border-r border-slate-100">
                <div className="bg-slate-800 p-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Income-tax Act, 1961</div>
                {Object.entries(data.act1961 || {}).map(([k, v]) => renderSection(k, v, 'old'))}
            </div>
            <div className="bg-white">
                <div className="bg-indigo-900 p-4 text-[10px] font-bold text-indigo-300 uppercase tracking-widest">Income-tax Act, 2025</div>
                {Object.entries(data.act2025 || {}).map(([k, v]) => renderSection(k, v, 'new'))}
                {Object.keys(data.act2025 || {}).length === 0 && (
                    <div className="p-20 text-center text-slate-300 italic text-sm">No corresponding mapping found in the New Act.</div>
                )}
            </div>
        </div>
    );
}