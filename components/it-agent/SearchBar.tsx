"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';

export default function SearchBar({ sections, onSelect, loading, placeholder }: any) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<any>(null);

    const filtered = (Array.isArray(sections) ? sections : []).filter((s: any) => 
        s.number.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 30);

    return (
        <div className="relative" ref={wrapperRef}>
            <div className="relative flex items-center">
                <Search className="absolute left-4 text-slate-400" size={18} />
                <input 
                    className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder={placeholder || "Search section..."}
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setIsOpen(true); }}
                    onFocus={() => setIsOpen(true)}
                />
            </div>

            {isOpen && filtered.length > 0 && (
                <div className="absolute w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-2xl z-[999] max-h-64 overflow-y-auto">
                    {filtered.map((s: any) => (
                        <button
                            key={s.number}
                            onClick={() => { onSelect(s.number); setQuery(`Section ${s.number}`); setIsOpen(false); }}
                            className="w-full text-left p-4 hover:bg-indigo-50 flex flex-col border-b last:border-0"
                        >
                            <span className="font-bold text-slate-900">Section {s.number}</span>
                            <span className="text-xs text-slate-400 truncate">{s.title}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}