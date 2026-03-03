"use client";
import React, { useState } from 'react';
import { ChevronRight, PanelLeftClose, Search, ChevronDown } from 'lucide-react';

export default function Sidebar({ isOpen, setIsOpen, onSelectAmendment, selectedSection }: any) {
    const [search, setSearch] = useState("");
    const [expandedActs, setExpandedActs] = useState<string[]>([]);

    // YOUR EXACT DATA STRUCTURE
    const actAmendments: any = {
      act1961: {
        label: "Income Tax Act 1961",
        amendments: [
          { displayLabel: "Explanation of section 12AC", payloadSection: "12AC" },
          { displayLabel: "Amendment of section 92CA", payloadSection: "92CA" },
          { displayLabel: "Amendment of section 139", payloadSection: "139" },
          { displayLabel: "Amendment of section 140B", payloadSection: "140B" },
          { displayLabel: "Amendment of section 144C", payloadSection: "144C" },
          {
            displayLabel: "Insertion of new section 147A",
            payloadSection: "147A",
          },
          {
            displayLabel: "Explanation of new section 148",
            payloadSection: "148",
          },
          { displayLabel: "Amendment of section 153", payloadSection: "153" },
          { displayLabel: "Amendment of section 153B", payloadSection: "153B" },
          { displayLabel: "Amendment of section 220", payloadSection: "220" },
          {
            displayLabel: "Insertion of new section 234-I",
            payloadSection: "234-I",
          },
          { displayLabel: "Amendment of section 245MA", payloadSection: "245MA" },
          { displayLabel: "Amendment of section 270A", payloadSection: "270A" },
          { displayLabel: "Amendment of section 270AA", payloadSection: "270AA" },
          { displayLabel: "Amendment of section 274", payloadSection: "274" },
          { displayLabel: "Amendment of section 275A", payloadSection: "275A" },
          { displayLabel: "Amendment of section 275B", payloadSection: "275B" },
          { displayLabel: "Amendment of section 276", payloadSection: "276" },
          {
            displayLabel: "Substitution of new sections for sections 276B",
            payloadSection: "276B",
          },
          {
            displayLabel: "Substitution of new sections for sections 276BB",
            payloadSection: "276BB",
          },
          {
            displayLabel: "Substitution of new sections for sections 276C",
            payloadSection: "276C",
          },
          {
            displayLabel: "Substitution of new sections for sections  276CC",
            payloadSection: "276CC",
          },
          {
            displayLabel: "Substitution of new sections for sections 276CCC",
            payloadSection: "276CCC",
          },
          {
            displayLabel: "Substitution of new sections for sections 276D",
            payloadSection: "276D",
          },
          { displayLabel: "Amendment of section 277", payloadSection: "277" },
          { displayLabel: "Amendment of section 277A", payloadSection: "277A" },
          { displayLabel: "Amendment of section 278", payloadSection: "278" },
          { displayLabel: "Amendment of section 278A", payloadSection: "278A" },
          { displayLabel: "Amendment of section 280", payloadSection: "280" },
          {
            displayLabel: "Explanation of new section 292B",
            payloadSection: "292B",
          },
          {
            displayLabel: "Insertion of new section 292BA",
            payloadSection: "292BA",
          },
        ],
      },
      act2025: {
        label: "Income Tax Act 2025",
        amendments: [
          { displayLabel: "Amendment of section 2", payloadSection: "2" },
          { displayLabel: "Amendment of section 7", payloadSection: "8" },
          { displayLabel: "Explanation of section 11", payloadSection: "NewAct_11" },
          { displayLabel: "Amendment of section 21", payloadSection: "23" },
          { displayLabel: "Amendment of section 22", payloadSection: "24" },
          { displayLabel: "Amendment of section 29", payloadSection: "36" },
          { displayLabel: "Explanation of section 51", payloadSection: "35E" },
          { displayLabel: "Explanation of section 58", payloadSection: "44AD" },
          {
            displayLabel: "Amendment of section 66",
            payloadSection: "NewAct_66",
          },
          { displayLabel: "Amendment of section 69", payloadSection: "46A" },
          { displayLabel: "Amendment of section 70", payloadSection: "47" },
          { displayLabel: "Amendment of section 93", payloadSection: "57" },
          { displayLabel: "Amendment of section 99", payloadSection: "64" },
          { displayLabel: "Amendment of section 147", payloadSection: "80LA" },
          { displayLabel: "Amendment of section 149", payloadSection: "80P" },
          {
            displayLabel: "Substitution of new section for section 150",
            payloadSection: "80PA",
          },
          { displayLabel: "Amendment of section 162", payloadSection: "92A" },
          { displayLabel: "Amendment of section 164", payloadSection: "92BA" },
          { displayLabel: "Amendment of section 165", payloadSection: "92C" },
          { displayLabel: "Amendment of section 166", payloadSection: "92CA" },
          { displayLabel: "Amendment of section 169", payloadSection: "92CD" },
          { displayLabel: "Amendment of section 195", payloadSection: "115BBE" },
          { displayLabel: "Amendment of section 202", payloadSection: "115BAC" },
          { displayLabel: "Amendment of section 203", payloadSection: "115BAD" },
          { displayLabel: "Amendment of section 204", payloadSection: "115BAE" },
          { displayLabel: "Amendment of section 206", payloadSection: "115JA" },
          {
            displayLabel: "Substitution of new sections for sections 217",
            payloadSection: "115H",
          },
          {
            displayLabel: "Substitution of new sections for sections 218",
            payloadSection: "115-I",
          },
          {
            displayLabel: "Amendment of section 227(1-6)",
            payloadSection: "115VG",
          },
          {
            displayLabel: "Amendment of section 227(9)",
            payloadSection: "115VX",
          },
          {
            displayLabel: "Amendment of section 228",
            payloadSection: "NewAct_228",
          },
          {
            displayLabel: "Amendment of section 232(12-14)",
            payloadSection: "115VU",
          },
          {
            displayLabel: "Amendment of section 232(15-20)",
            payloadSection: "115VV",
          },
          { displayLabel: "Amendment of section 235", payloadSection: "115V" },
          { displayLabel: "Amendment of section 262", payloadSection: "139A" },
          { displayLabel: "Amendment of section 263", payloadSection: "139" },
          { displayLabel: "Amendment of section 266", payloadSection: "140A" },
          { displayLabel: "Amendment of section 267", payloadSection: "140B" },
          { displayLabel: "Amendment of section 270", payloadSection: "143" },
          { displayLabel: "Amendment of section 275", payloadSection: "144C" },
          { displayLabel: "Amendment of section 279", payloadSection: "147" },
          { displayLabel: "Amendment of section 286", payloadSection: "153" },
          { displayLabel: "Amendment of section 295", payloadSection: "158BD" },
          { displayLabel: "Amendment of section 296", payloadSection: "158BE" },
          {
            displayLabel: "Amendment of section 332",
            payloadSection: "NewAct_332",
          },
          {
            displayLabel: "Amendment of section 349",
            payloadSection: "12A(1)(ba)",
          },
          {
            displayLabel: "Amendment of section 351",
            payloadSection: "NewAct_351",
          },
          {
            displayLabel: "Amendment of section 352",
            payloadSection: "NewAct_352",
          },
          {
            displayLabel: "Insertion of new section 354A",
            payloadSection: "NewAct_354A",
          },
          { displayLabel: "Amendment of section 379", payloadSection: "245MA" },
          {
            displayLabel: "Amendment of section 393",
            payloadSection: "NewAct_393",
          },
          { displayLabel: "Amendment of section 394", payloadSection: "206C" },
          {
            displayLabel: "Amendment of section 395",
            payloadSection: "NewAct_395",
          },
          {
            displayLabel: "Amendment of section 397",
            payloadSection: "NewAct_397",
          },
          { displayLabel: "Amendment of section 399", payloadSection: "206CB" },
          {
            displayLabel: "Amendment of section 400",
            payloadSection: "NewAct_400",
          },
          {
            displayLabel: "Amendment of section 402",
            payloadSection: "NewAct_402",
          },
          { displayLabel: "Amendment of section 411", payloadSection: "220" },
          { displayLabel: "Amendment of section 423", payloadSection: "234A" },
          { displayLabel: "Amendment of section 424", payloadSection: "234B" },
          { displayLabel: "Amendment of section 425", payloadSection: "234C" },
          {
            displayLabel: "Substitution of new sections for sections 427",
            payloadSection: "234E",
          },
          {
            displayLabel: "Substitution of new sections for sections 428",
            payloadSection: "234F",
          },
          { displayLabel: "Amendment of section 439", payloadSection: "270A" },
          { displayLabel: "Amendment of section 440", payloadSection: "270AA" },
          { displayLabel: "Omission of section 443", payloadSection: "271AAC" },
          {
            displayLabel: "Substitution of new section for section 446",
            payloadSection: "271B",
          },
          { displayLabel: "Omission of section 447", payloadSection: "271BA" },
          {
            displayLabel: "Substitution of new section for section 454",
            payloadSection: "271FA",
          },
          { displayLabel: "Amendment of section 466", payloadSection: "272AA" },
          { displayLabel: "Amendment of section 470", payloadSection: "273B" },
          { displayLabel: "Amendment of section 471", payloadSection: "274" },
          { displayLabel: "Amendment of section 473", payloadSection: "275A" },
          { displayLabel: "Amendment of section 474", payloadSection: "275B" },
          { displayLabel: "Amendment of section 475", payloadSection: "276" },
          { displayLabel: "Amendment of section 476", payloadSection: "276B" },
          { displayLabel: "Amendment of section 477", payloadSection: "276BB" },
          { displayLabel: "Amendment of section 478", payloadSection: "276C" },
          { displayLabel: "Amendment of section 479", payloadSection: "276CC" },
          {
            displayLabel: "Substitution of new sections for sections 480",
            payloadSection: "276CCC",
          },
          {
            displayLabel: "Substitution of new sections for sections 481",
            payloadSection: "276D",
          },
          { displayLabel: "Amendment of section 482", payloadSection: "277" },
          { displayLabel: "Amendment of section 483", payloadSection: "277A" },
          { displayLabel: "Amendment of section 484", payloadSection: "278" },
          { displayLabel: "Amendment of section 485", payloadSection: "278A" },
          { displayLabel: "Amendment of section 494", payloadSection: "280" },
          { displayLabel: "Explanation of section 509", payloadSection: "285BAA" },
          { displayLabel: "Amendment of section 522", payloadSection: "292B" },
          { displayLabel: "Amendment of section 536", payloadSection: "297" },
          {
            displayLabel: "Amendment of Schedule III",
            payloadSection: "NewAct_Schedule III",
          },
          {
            displayLabel: "Amendment of Schedule IV",
            payloadSection: "NewAct_Schedule IV",
          },
          {
            displayLabel: "Amendment of Schedule VI",
            payloadSection: "NewAct_Schedule VI",
          },
          {
            displayLabel: "Amendment of Schedule XI",
            payloadSection: "NewAct_Schedule XI",
          },
          {
            displayLabel: "Amendment of Schedule XII",
            payloadSection: "NewAct_Schedule XII",
          },
          {
            displayLabel: "Amendment of Schedule XIV",
            payloadSection: "NewAct_Schedule XIV",
          },
        ],
      },
      others: {
        label: "Others",
        amendments: [
          { displayLabel: "Rates of tax", payloadSection: "Rates of Tax" },
          { displayLabel: "Black Money Act", payloadSection: "Black Money Act" },
          { displayLabel: "STT", payloadSection: "STT" },
        ],
      },
    };

    const toggleAct = (key: string) => {
        setExpandedActs(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key]);
    };

    return (
        <div className="flex flex-col h-full w-full bg-white border-r border-slate-200 shadow-sm animate-in slide-in-from-left duration-300">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Budget 2026 Links</span>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <PanelLeftClose size={18} />
                </button>
            </div>

            {/* Filter */}
            <div className="p-3 border-b border-slate-100">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                    <input 
                        className="w-full bg-slate-100/50 border-none rounded-lg py-2 pl-9 pr-4 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                        placeholder="Search amendments..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* Nested List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-4 custom-scrollbar">
                {Object.entries(actAmendments).map(([key, data]: [string, any]) => {
                    const filteredItems = data.amendments.filter((item: any) =>
                        item.displayLabel.toLowerCase().includes(search.toLowerCase())
                    );
                    if (search && filteredItems.length === 0) return null;
                    const isExpanded = expandedActs.includes(key);

                    return (
                        <div key={key} className="space-y-1">
                            <button 
                                onClick={() => toggleAct(key)}
                                className="w-full flex items-center justify-between p-2 text-indigo-600 font-bold text-[9px] uppercase tracking-[0.15em] hover:bg-indigo-50/50 rounded transition-colors"
                            >
                                <span>{data.label}</span>
                                <ChevronDown size={12} className={`transition-transform duration-200 ${isExpanded ? '' : '-rotate-90'}`} />
                            </button>

                            {isExpanded && (
                                <div className="space-y-0.5 pt-1">
                                    {filteredItems.map((amend: any, i: number) => {
                                        const isSelected = selectedSection === amend.payloadSection;
                                        return (
                                            <button
                                                key={i}
                                                onClick={() => onSelectAmendment(amend.payloadSection)}
                                                className={`w-full text-left p-2.5 rounded-lg transition-all text-[11px] flex justify-between items-center group ${
                                                    isSelected 
                                                        ? 'bg-indigo-100 text-indigo-900 font-medium' 
                                                        : 'text-slate-600 hover:bg-slate-100'
                                                }`}
                                            >
                                                <span className="line-clamp-2 leading-snug">{amend.displayLabel}</span>
                                                <ChevronRight 
                                                    size={10} 
                                                    className={`shrink-0 ${
                                                        isSelected 
                                                            ? 'opacity-100 text-indigo-600' 
                                                            : 'opacity-0 group-hover:opacity-100 text-indigo-400'
                                                    }`} 
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}