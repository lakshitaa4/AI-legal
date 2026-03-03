"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload, FileText, CheckCircle,
  Calendar, Search, ShieldCheck,
  Download, ClipboardList, Clock, Gavel, BookOpen,
  XCircle, ChevronDown, ChevronRight, Timer,
  AlertOctagon, TrendingUp, IndianRupee, Landmark
} from "lucide-react";
import { notice_api } from "@/lib/api";
import { IssueSchema } from "@/types/validate";

const DOMAINS = [
  { label: "Direct Tax", value: "Direct Tax" },
  { label: "Transfer Pricing", value: "Transfer Pricing" },
  { label: "Indirect Tax (GST)", value: "Indirect Tax" },
  { label: "Customs", value: "Indirect Tax - Customs" },
];

const API_BASE_URL = 'https://laksss-ai-legal-suite.hf.space';

export default function NoticeAgentView() {
  const [file, setFile] = useState<File | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [domain, setDomain] = useState("Direct Tax");
  const [docType, setDocType] = useState("Notice");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setFileUrl(URL.createObjectURL(selectedFile));
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("domain", domain);
    formData.append("document_type", docType);

    try {
      const response = await notice_api.validate(formData);
      const job_id = response.job_id;
      
      if (!job_id) throw new Error("Job ID missing");

      // Head-start delay
      await new Promise(r => setTimeout(r, 20000));

      let completed = false;
      while (!completed) {
        const statusData = await notice_api.checkStatus(job_id);
        
        if (statusData.status === "completed") {
          setResult(statusData.result);
          completed = true;
        } else if (statusData.status === "failed") {
          throw new Error(statusData.error || "Analysis failed");
        } else {
          await new Promise(r => setTimeout(r, 4000)); 
        }
      }
    } catch (error) {
      console.error("Notice error:", error);
      alert("Analysis failed. Please check logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!result) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/notice/download-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result),
      });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Audit_Report_${result.taxpayer_name?.replace(/\s+/g, "_") || "Tax"}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error("Download failed", err);
    }
  };

  const authority = result?.llm_input?.authority_details || {};
  const hearing = result?.llm_input?.hearing_info || {};
  const hearingDate = result?.llm_input?.hearing_date || hearing?.date;
  const hearingType = hearing?.type;
  const totalAdjustment = getTotalAdjustment(result);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[#F5F4F1] font-['IBM_Plex_Sans',sans-serif]">
      {/* TOP BAR */}
      <div className="bg-white border-b border-[#E0DDD8] px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold text-[#9A9690] uppercase tracking-widest">Type</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)} className="text-sm font-semibold text-[#1A1A1A] bg-[#F5F4F1] border border-[#E0DDD8] rounded px-3 py-1.5 focus:outline-none">
              <option value="Notice">Notice</option>
              <option value="Order">Order</option>
            </select>
          </div>
          <div className="w-px h-4 bg-[#E0DDD8]" />
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-semibold text-[#9A9690] uppercase tracking-widest">Domain</label>
            <select value={domain} onChange={(e) => setDomain(e.target.value)} className="text-sm font-semibold text-[#1A1A1A] bg-[#F5F4F1] border border-[#E0DDD8] rounded px-3 py-1.5 focus:outline-none">
              {DOMAINS.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
            </select>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" id="file-input" />
          <label htmlFor="file-input" className="cursor-pointer flex items-center gap-2 px-4 py-2 border border-[#E0DDD8] rounded text-sm font-semibold text-[#4A4A4A] bg-white hover:bg-[#F5F4F1]">
            <Upload size={14} className="text-[#1A3A5C]" />
            {file ? file.name.slice(0, 20) + "..." : "Upload Document"}
          </label>
          <button onClick={handleAnalyze} disabled={!file || loading} className="flex items-center gap-2 px-5 py-2 bg-[#1A3A5C] text-white text-sm font-bold rounded disabled:opacity-40">
            {loading ? <div className="h-4 w-4 border-2 border-t-white rounded-full animate-spin" /> : <Search size={14} />}
            {loading ? "Analysing…" : "Run Audit"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-[45%] bg-[#E8E6E1] border-r border-[#D5D2CC]">
          {fileUrl ? <iframe src={fileUrl} className="w-full h-full" title="PDF Viewer" /> : (
            <div className="flex flex-col items-center justify-center h-full text-[#B0ADA8]"><FileText size={48} className="mb-3" /><p className="text-xs font-semibold uppercase tracking-widest">No document uploaded</p></div>
          )}
        </div>

        <div className="w-[55%] overflow-y-auto bg-[#F5F4F1]">
          <AnimatePresence mode="wait">
            {!result && !loading && (
              <div className="flex flex-col items-center justify-center h-full text-[#C0BDB8]"><ShieldCheck size={56} className="mb-3" /><p className="text-xs font-semibold uppercase tracking-widest">Audit results will appear here</p></div>
            )}
            {loading && (
              <div className="flex flex-col items-center justify-center h-full gap-4"><div className="w-10 h-10 border-[3px] border-t-[#1A3A5C] rounded-full animate-spin" /><p className="text-xs font-bold text-[#4A4A4A] uppercase animate-pulse">Running AI Audit Engine…</p></div>
            )}
            {result && !loading && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-6 space-y-5 pb-24">
                {result.warnings?.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 flex items-start gap-3">
                    <AlertOctagon size={15} className="text-amber-600 mt-0.5 shrink-0" />
                    <div className="space-y-1">{result.warnings.map((w: string, i: number) => (<p key={i} className="text-[12px] font-semibold text-amber-800">{w}</p>))}</div>
                  </div>
                )}
                <div className="bg-[#1A3A5C] text-white rounded-lg px-6 py-5">
                  <div className="flex items-start justify-between">
                    <div><p className="text-[10px] uppercase tracking-widest mb-1 text-[#7A9FC0]">Taxpayer</p><h2 className="text-xl font-bold">{result.taxpayer_name}</h2></div>
                    <div className="flex flex-col items-end gap-1.5"><span className="text-[10px] font-semibold bg-white/10 px-2 py-0.5 rounded">{result.document_type || "Notice"}</span>{result.processing_time_seconds && <span className="flex items-center gap-1 text-[9px] text-white/40"><Timer size={9} />{result.processing_time_seconds.toFixed(1)}s</span>}</div>
                  </div>
                  <div className="mt-4 grid grid-cols-4 gap-3">
                    <MetaChip label="PAN" value={result.pan} /><MetaChip label="A.Y." value={result.assessment_year} /><MetaChip label="Section" value={result.notice_type} /><MetaChip label="Domain" value={result.domain || domain} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <DateCard label="Date of Issue" value={result.date_of_issue} icon={Calendar} />
                  <DateCard label="Date of Receipt" value={result.date_of_receipt !== "None" ? result.date_of_receipt : "—"} icon={Calendar} />
                  <DateCard label="Response Due" value={result.submission_deadline !== "None" ? result.submission_deadline : "—"} icon={Clock} urgent />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Section title="Issuing Authority" icon={Landmark}><InfoRow label="Designation" value={authority.designation || "—"} /><InfoRow label="Officer" value={authority.name !== "None" ? authority.name : "—"} /><InfoRow label="Jurisdiction" value={authority.jurisdiction || "—"} /></Section>
                  <Section title="Hearing Details" icon={Clock}><InfoRow label="Date" value={hearingDate !== "None" ? hearingDate : "—"} /><InfoRow label="Time" value={hearing.time !== "None" ? hearing.time : "—"} /><InfoRow label="Mode" value={hearingType !== "None" ? hearingType : "—"} /><InfoRow label="Venue" value={hearing.venue !== "None" ? hearing.venue : "—"} /></Section>
                </div>
                <div className="bg-white border rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between px-5 py-3 border-b bg-[#FAFAF8]"><h3 className="text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={13} className="text-[#1A3A5C]" />Statutory Validation</h3><button onClick={handleDownloadReport} className="flex items-center gap-1.5 text-[11px] font-semibold text-[#1A3A5C]"><Download size={12} /> Download Report</button></div>
                  <table className="w-full text-left">
                    <thead><tr className="text-[10px] font-bold text-[#9A9690] uppercase border-b bg-[#FAFAF8]"><th className="px-5 py-2.5">Check</th><th className="px-5 py-2.5 w-28">Status</th><th className="px-5 py-2.5">Observation</th></tr></thead>
                    <tbody>{result.validation_grid?.map((check: any, i: number) => {
                      const failed = check.status.toLowerCase().includes("failed") || check.status.toLowerCase().includes("absent");
                      return (<tr key={i} className="border-b last:border-0 hover:bg-[#FAFAF8]"><td className="px-5 py-3.5 text-[12px] font-semibold">{check.label}</td><td className="px-5 py-3.5"><span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded ${failed ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"}`}>{failed ? <XCircle size={10} /> : <CheckCircle size={10} />}{check.status}</span></td><td className="px-5 py-3.5 text-[12px] text-[#6A6A6A]">{check.description}</td></tr>)})}
                    </tbody>
                  </table>
                </div>
                <div><SectionHeader title="Financial Summary" icon={IndianRupee} /><div className="grid grid-cols-3 gap-3 mt-2"><FinCard label="Tax Demand" value={result.demand?.tax || result.llm_input?.demand_amount?.tax} /><FinCard label="Interest" value={result.demand?.interest || result.llm_input?.demand_amount?.interest} /><FinCard label="Proposed Adjustment" value={totalAdjustment || null} highlight /></div></div>
                {result.llm_input?.extracted_tables?.length > 0 && (
                  <div><SectionHeader title="Statutory Data Tables" icon={FileText} /><div className="space-y-4 mt-2">{result.llm_input.extracted_tables.map((tableHtml: string, i: number) => (<div key={i} className="bg-white border rounded-lg overflow-x-auto shadow-sm p-1"><div className="audit-table-container" dangerouslySetInnerHTML={{ __html: tableHtml }} /></div>))}</div></div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <Section title="Strategic Advisory" icon={BookOpen}><div className="space-y-4">{Object.entries(result.advisory_notes || {}).map(([key, value]: any, i) => (<div key={i} className="border-l-2 border-[#1A3A5C] pl-3"><p className="text-[10px] font-bold text-[#1A3A5C] uppercase mb-0.5">{key}</p><p className="text-[11px] text-[#4A4A4A]">{value}</p></div>))}</div></Section>
                  <Section title={`Documents Required (${result.llm_input?.documents_requested?.length || 0})`} icon={ClipboardList}><ul className="space-y-2">{result.llm_input?.documents_requested?.map((doc: string, i: number) => (<li key={i} className="flex items-start gap-2.5 text-[12px] text-[#3A3A3A]"><span className="shrink-0 mt-0.5 w-4 h-4 rounded-full bg-[#1A3A5C] text-white text-[9px] font-bold flex items-center justify-center">{i + 1}</span>{doc}</li>))}</ul></Section>
                </div>
                <div><div className="flex items-center justify-between mb-3"><SectionHeader title={`Issue Analysis`} icon={Gavel} /><span className="text-[10px] font-bold bg-[#1A3A5C] text-white px-2.5 py-0.5 rounded-full">{result.total_issues} issues</span></div><div className="space-y-3">{result.extracted_issues.map((issue: any, idx: number) => (<IssueCard key={idx} issue={issue} index={idx} />))}</div></div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <style jsx global>{`.audit-table-container table { width: 100%; border-collapse: collapse; font-size: 11px; font-family: 'IBM Plex Sans', sans-serif; } .audit-table-container th { background: #F5F4F1; padding: 8px 12px; text-align: left; font-weight: 700; color: #6A6A6A; border-bottom: 1px solid #E0DDD8; } .audit-table-container td { padding: 7px 12px; border-bottom: 1px solid #F0EDE8; }`}</style>
    </div>
  );
}

function MetaChip({ label, value }: any) { return (<div className="bg-white/10 rounded px-3 py-2"><p className="text-[9px] font-semibold text-[#7A9FC0] uppercase mb-0.5">{label}</p><p className="text-[11px] font-bold text-white">{value || "—"}</p></div>); }
function DateCard({ label, value, icon: Icon, urgent = false }: any) { return (<div className={`bg-white border rounded-lg px-4 py-3 ${urgent ? "border-red-200 bg-red-50" : "border-[#E0DDD8]"}`}><div className="flex items-center gap-1.5 mb-1"><Icon size={11} className={urgent ? "text-red-500" : "text-[#9A9690]"} /><span className={`text-[9px] font-bold uppercase ${urgent ? "text-red-500" : "text-[#9A9690]"}`}>{label}</span></div><p className={`text-[13px] font-bold ${urgent ? "text-red-700" : "text-[#1A1A1A]"}`}>{value || "—"}</p></div>); }
function Section({ title, icon: Icon, children }: any) { return (<div className="bg-white border border-[#E0DDD8] rounded-lg overflow-hidden"><div className="px-5 py-3 border-b flex items-center gap-2 bg-[#FAFAF8]"><Icon size={13} className="text-[#1A3A5C]" /><h3 className="text-[10px] font-bold uppercase">{title}</h3></div><div className="px-5 py-4">{children}</div></div>); }
function SectionHeader({ title, icon: Icon }: any) { return (<div className="flex items-center gap-2"><Icon size={13} className="text-[#1A3A5C]" /><h3 className="text-[11px] font-bold uppercase">{title}</h3></div>); }
function InfoRow({ label, value }: any) { return (<div className="flex justify-between py-1.5 border-b last:border-0"><span className="text-[11px] text-[#9A9690]">{label}</span><span className="text-[12px] font-semibold text-right">{value}</span></div>); }
function FinCard({ label, value, highlight = false }: any) { const display = value ? `₹${Number(value).toLocaleString("en-IN")}` : "N/A"; return (<div className={`rounded-lg px-4 py-4 border ${highlight ? "bg-[#1A3A5C] border-[#1A3A5C]" : "bg-white border-[#E0DDD8]"}`}><p className={`text-[10px] font-semibold uppercase mb-1.5 ${highlight ? "text-[#7A9FC0]" : "text-[#9A9690]"}`}>{label}</p><p className={`text-lg font-bold font-mono ${highlight ? "text-white" : "text-[#1A1A1A]"}`}>{display}</p></div>); }
function getTotalAdjustment(result: any): number { if (!result) return 0; if (result.demand?.total) return result.demand.total; let sum = 0; result.extracted_issues?.forEach((issue: any) => { if (issue.amount?.adjustment) sum += Number(issue.amount.adjustment); else if (typeof issue.amount === "number") sum += issue.amount; }); return sum; }
function IssueCard({ issue, index }: any) {
  const [open, setOpen] = useState(false);
  const hasAdjustment = issue.amount?.adjustment && issue.amount.adjustment > 0;
  return (
    <div className="bg-white border border-[#E0DDD8] rounded-lg overflow-hidden">
      <button className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#FAFAF8]" onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2.5 min-w-0"><span className="text-[10px] font-bold text-[#9A9690] bg-[#F5F4F1] px-2 py-0.5 rounded shrink-0">#{issue.issue_number || index + 1}</span><span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-blue-50 text-blue-700">{issue.issue_type || issue.type}</span><span className="text-[12px] font-semibold truncate">{issue.issue_title}</span></div>
        <div className="flex items-center gap-3 shrink-0 ml-3">{hasAdjustment && <span className="text-[11px] font-bold font-mono text-red-600 bg-red-50 px-2 py-0.5 rounded">₹{Number(issue.amount.adjustment).toLocaleString("en-IN")}</span>}{open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</div>
      </button>
      {open && (
        <div className="border-t p-5 space-y-4"><p className="text-[12px] leading-relaxed text-[#4A4A4A]">{issue.issue_details}</p><div className="bg-[#EEF3F8] p-4 rounded-lg"><p className="text-[10px] font-bold text-[#1A3A5C] uppercase mb-2">Defence Strategy</p><p className="text-[11px] italic text-[#1A3A5C]">{issue.argument_appeal}</p></div></div>
      )}
    </div>
  );
}