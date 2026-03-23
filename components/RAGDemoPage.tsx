"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Search, FileText, Layers, Zap, AlertTriangle, ChevronDown, ChevronUp, X, Clock, Database, BookOpen, Sparkles } from "lucide-react"

interface ChildChunk {
  id: string; section_number: string; clause_id: string; defined_term?: string
  chunk_text: string; rerank_score: number; has_amendment: boolean
  effective_date?: string; amendment_text?: string; cross_refs: string[]
}
interface ParentSection {
  id: string; section_number: string; section_title: string; chapter: string; full_text: string
}
interface RetrievalMetadata {
  n_candidates: number; n_reranked: number; n_parents: number
  n_warnings: number; query_type: string; expanded_sections?: string[]
}
interface SearchResponse {
  query: string; child_chunks: ChildChunk[]; parent_sections: ParentSection[]
  amendment_warnings: string[]; cross_refs: string[]; retrieval_metadata: RetrievalMetadata
}
type Stage = "idle" | "classifying" | "searching" | "reranking" | "fetching" | "generating" | "done"

const API_URL = 'https://laksss-tax-hub.hf.space';

const STAGES: { id: Stage; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "classifying", label: "Classify",  icon: <Zap size={13} />,      desc: "Detect query intent"   },
  { id: "searching",   label: "Search",    icon: <Search size={13} />,    desc: "Hybrid BM25 + dense"  },
  { id: "reranking",   label: "Rerank",    icon: <Layers size={13} />,    desc: "BGE ReRanker scoring" },
  { id: "fetching",    label: "Fetch",     icon: <Database size={13} />,  desc: "Load parent sections" },
  { id: "generating",  label: "Generate",  icon: <Sparkles size={13} />,  desc: "Gemini streaming"     },
]

const SAMPLE_QUERIES = [
  "What is the statutory definition of capital asset?",
  "What deductions are allowed under section 80C?",
  "Define previous year under the Income Tax Act.",
  "Has the definition of virtual digital asset been amended recently?",
  "What are the provisions for advance tax payment?",
]

function PipelineTracker({ stage, meta }: { stage: Stage; meta: RetrievalMetadata | null }) {
  const activeIdx = STAGES.findIndex(s => s.id === stage)
  return (
    <div className="rg-pipeline">
      {STAGES.map((s, i) => {
        const status = stage === "idle" ? "idle" : i < activeIdx ? "done" : i === activeIdx ? "active" : "pending"
        return (
          <div key={s.id} className={`rg-step rg-step--${status}`}>
            <div className="rg-dot">
              {status === "done" ? "✓" : status === "active" ? <span className="rg-spin" /> : s.icon}
            </div>
            <div className="rg-step-info">
              <span className="rg-step-label">{s.label}</span>
              <span className="rg-step-desc">{s.id === "searching" && meta ? `${meta.n_candidates} candidates` : s.desc}</span>
            </div>
            {i < STAGES.length - 1 && <div className={`rg-line rg-line--${status === "done" ? "done" : "pending"}`} />}
          </div>
        )
      })}
    </div>
  )
}

function ChunkCard({ chunk, rank }: { chunk: ChildChunk; rank: number }) {
  return (
    <div className={`rg-chunk ${chunk.has_amendment ? "rg-chunk--amended" : ""}`}>
      <div className="rg-chunk-header">
        <span className="rg-chunk-rank">#{rank}</span>
        <div className="rg-chunk-tags">
          <span className="rg-tag rg-tag--section">§{chunk.section_number}</span>
          <span className="rg-tag rg-tag--clause">{chunk.clause_id}</span>
          {chunk.defined_term && <span className="rg-tag rg-tag--term">{chunk.defined_term}</span>}
          {chunk.has_amendment && <span className="rg-tag rg-tag--amend"><AlertTriangle size={9} /> {chunk.effective_date}</span>}
        </div>
        <span className="rg-chunk-score">{chunk.rerank_score.toFixed(2)}</span>
      </div>
      <p className="rg-chunk-text">{chunk.chunk_text.slice(0, 260)}{chunk.chunk_text.length > 260 ? "…" : ""}</p>
      {chunk.amendment_text && (
        <div className="rg-chunk-amend"><AlertTriangle size={11} /><span>{chunk.amendment_text.slice(0, 140)}…</span></div>
      )}
    </div>
  )
}

function ParentCard({ parent }: { parent: ParentSection }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rg-parent">
      <button className="rg-parent-header" onClick={() => setOpen(o => !o)}>
        <div className="rg-parent-title">
          <span className="rg-parent-sec">§{parent.section_number}</span>
          <span className="rg-parent-name">{parent.section_title}</span>
        </div>
        <div className="rg-parent-meta">
          <span className="rg-parent-chapter">{parent.chapter.slice(0, 30)}</span>
          {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>
      {open && (
        <div className="rg-parent-body">
          <pre className="rg-parent-text">{parent.full_text}</pre>
        </div>
      )}
    </div>
  )
}

function AnswerPanel({ html, streaming, warnings }: { html: string; streaming: boolean; warnings: string[] }) {
  const bottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (streaming) bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [html, streaming])
  return (
    <div className="rg-answer">
      {warnings.length > 0 && (
        <div className="rg-warnings">
          <div className="rg-warnings-title"><AlertTriangle size={13} /> Amendment Alerts</div>
          {warnings.map((w, i) => <p key={i} className="rg-warnings-item">{w}</p>)}
        </div>
      )}
      <div className="rg-answer-body">
        {html
          ? <div dangerouslySetInnerHTML={{ __html: html }} />
          : streaming && (
            <div className="rg-skeleton">
              <div className="rg-skel-line" style={{ width: "75%" }} />
              <div className="rg-skel-line" style={{ width: "90%" }} />
              <div className="rg-skel-line" style={{ width: "55%" }} />
            </div>
          )
        }
        {streaming && <span className="rg-cursor" />}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

export default function RAGDemo() {
  const [query, setQuery]           = useState("")
  const [stage, setStage]           = useState<Stage>("idle")
  const [searchData, setSearchData] = useState<SearchResponse | null>(null)
  const [answerHtml, setAnswerHtml] = useState("")
  const [streaming, setStreaming]   = useState(false)
  const [streamMeta, setStreamMeta] = useState<{ sections: string[]; warnings: string[]; query_type: string } | null>(null)
  const [error, setError]           = useState<string | null>(null)
  const [elapsed, setElapsed]       = useState(0)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startRef = useRef<number>(0)
  const abortRef = useRef<AbortController | null>(null)
  // Track current stage in a ref so the async loop can read it without stale closure
  const stageRef = useRef<Stage>("idle")
  const setStageSync = (s: Stage) => { stageRef.current = s; setStage(s) }

  useEffect(() => {
    const ping = () => fetch(`${API_URL}/api/v1/retrieval/health`).catch(() => {})
    ping()
    const keepalive = setInterval(ping, 8 * 60 * 1000)
    return () => { clearInterval(keepalive); timerRef.current && clearInterval(timerRef.current); abortRef.current?.abort() }
  }, [])

  const reset = useCallback((keepQuery = false) => {
    abortRef.current?.abort()
    timerRef.current && clearInterval(timerRef.current)
    setStageSync("idle"); setSearchData(null); setAnswerHtml(""); setStreaming(false)
    setStreamMeta(null); setError(null); setElapsed(0)
    if (!keepQuery) setQuery("")
  }, [])

  const handleSubmit = useCallback(async (q?: string) => {
    const queryText = (q ?? query).trim()
    if (!queryText) return
    reset(true)
    if (q !== undefined) setQuery(q)

    abortRef.current = new AbortController()
    const { signal } = abortRef.current
    startRef.current = Date.now()
    timerRef.current = setInterval(() => setElapsed(Date.now() - startRef.current), 100)

    try {
      // Classifying — brief visual pause before the network call
      setStageSync("classifying")
      await delay(300)
      if (signal.aborted) return

      // Move to searching — the real work starts now
      setStageSync("searching")
      setStreaming(true)

      const streamRes = await fetch(`${API_URL}/api/v1/retrieval/ask/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryText, history: [] }),
        signal,
      })
      if (!streamRes.ok) throw new Error(`Stream failed: ${streamRes.status}`)
      if (!streamRes.body) throw new Error("No stream body")

      const reader  = streamRes.body.getReader()
      const decoder = new TextDecoder()
      let buffer = "", accHtml = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done || signal.aborted) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split("\n"); buffer = lines.pop() ?? ""

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue
          const raw = line.slice(6).trim()
          if (raw === "[DONE]") break
          try {
            const msg = JSON.parse(raw)

            if (msg.type === "metadata") {
              // ── Retrieval is done — advance pipeline stages ──
              setStageSync("reranking")
              await delay(100)
              setStageSync("fetching")
              await delay(100)
              setStageSync("generating")

              setStreamMeta({
                sections:   msg.sections   ?? [],
                warnings:   msg.warnings   ?? [],
                query_type: msg.query_type ?? "general",
              })

              // Populate the side panel — no separate /search call needed
              if (msg.child_chunks || msg.parent_sections) {
                setSearchData({
                  query:              queryText,
                  child_chunks:       msg.child_chunks      ?? [],
                  parent_sections:    msg.parent_sections   ?? [],
                  amendment_warnings: msg.warnings          ?? [],
                  cross_refs:         msg.cross_refs        ?? [],
                  retrieval_metadata: msg.retrieval_metadata ?? {
                    n_candidates: msg.n_candidates ?? 0,
                    n_reranked:   msg.n_reranked   ?? 0,
                    n_parents:    msg.n_parents    ?? 0,
                    n_warnings:   (msg.warnings ?? []).length,
                    query_type:   msg.query_type   ?? "general",
                  },
                })
              }

            } else if (msg.type === "token" && msg.text) {
              accHtml += msg.text
              setAnswerHtml(accHtml)
            }
          } catch { /* partial SSE chunk — skip */ }
        }
      }

      setStreaming(false)
      setStageSync("done")

    } catch (e: unknown) {
      if ((e as Error).name === "AbortError") return
      setError(e instanceof Error ? e.message : "Request failed")
      setStreaming(false)
      setStageSync("idle")
    } finally {
      timerRef.current && clearInterval(timerRef.current)
    }
  }, [query, reset])

  const isRunning = stage !== "idle" && stage !== "done"
  const warnings  = streamMeta?.warnings ?? searchData?.amendment_warnings ?? []
  const meta      = searchData?.retrieval_metadata ?? null

  return (
    <>
      <style>{CSS}</style>
      <div className="rg-root">
        <main className="rg-main">

          {/* ── Hero + Query ── */}
          <div className="rg-hero">
            {stage === "idle" && !searchData && !error && (
              <div className="rg-hero-text">
                <div className="rg-hero-icon"><BookOpen size={28} /></div>
                <h1 className="rg-hero-title">Income Tax Act 1961</h1>
                <p className="rg-hero-desc">Statutory research powered by hybrid retrieval. Ask any legal question — get cited answers with amendment alerts.</p>
              </div>
            )}

            <div className="rg-querybox">
              <textarea
                className="rg-input"
                placeholder="Ask a legal question about the Income Tax Act 1961…"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); if (isRunning) { reset(true); return } handleSubmit() } }}
                rows={3}
              />
              <div className="rg-querybox-footer">
                <div className="rg-chips">
                  {SAMPLE_QUERIES.slice(0, 3).map(sq => (
                    <button key={sq} className="rg-chip" onClick={() => handleSubmit(sq)}>
                      {sq.length > 42 ? sq.slice(0, 42) + "…" : sq}
                    </button>
                  ))}
                </div>
                <div className="rg-actions">
                  {(stage === "done" || error) && (
                    <button className="rg-btn rg-btn--ghost" onClick={() => reset()}><X size={13} /> Clear</button>
                  )}
                  {isRunning && (
                    <button className="rg-btn rg-btn--stop" onClick={() => reset(true)}><X size={13} /> Stop</button>
                  )}
                  <button className="rg-btn rg-btn--primary" onClick={() => handleSubmit()} disabled={!query.trim()}>
                    {isRunning ? <><span className="rg-spinner" /> Thinking…</> : <><Search size={13} /> Search</>}
                  </button>
                </div>
              </div>
            </div>

            {stage === "idle" && !searchData && !error && (
              <div className="rg-samples">
                {SAMPLE_QUERIES.map(sq => (
                  <button key={sq} className="rg-chip rg-chip--lg" onClick={() => handleSubmit(sq)}>{sq}</button>
                ))}
              </div>
            )}
          </div>

          {/* ── Pipeline tracker ── */}
          {stage !== "idle" && (
            <div className="rg-tracker">
              <PipelineTracker stage={stage} meta={meta} />
              <div className="rg-tracker-footer">
                <div className="rg-timer">
                  <Clock size={11} /> {(elapsed / 1000).toFixed(1)}s
                  {streamMeta && <span className="rg-qtype">{streamMeta.query_type}</span>}
                  {streaming && <span className="rg-streaming-badge">streaming</span>}
                </div>
                {(stage === "generating" || stage === "done") && meta && (
                  <div className="rg-meta-row">
                    {[
                      { label: "Candidates", value: meta.n_candidates },
                      { label: "Reranked",   value: meta.n_reranked   },
                      { label: "Parents",    value: meta.n_parents    },
                    ].map(b => (
                      <div key={b.label} className="rg-badge">
                        <span className="rg-badge-label">{b.label}</span>
                        <span className="rg-badge-value">{b.value}</span>
                      </div>
                    ))}
                    {meta.n_warnings > 0 && (
                      <div className="rg-badge rg-badge--warn">
                        <span className="rg-badge-label">Warnings</span>
                        <span className="rg-badge-value">{meta.n_warnings}</span>
                      </div>
                    )}
                    {streamMeta?.sections && streamMeta.sections.length > 0 && (
                      <div className="rg-section-pills">
                        {streamMeta.sections.slice(0, 8).map(s => <span key={s} className="rg-sec-pill">§{s}</span>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {error && <div className="rg-error"><AlertTriangle size={13} /> {error}</div>}

          {/* ── Results ── */}
          {searchData && (
            <div className="rg-results">
              <div className="rg-col rg-col--answer">
                <div className="rg-col-header">
                  <Sparkles size={14} /><span>Answer</span>
                  {streaming && <span className="rg-streaming-badge" style={{marginLeft:'.25rem'}}>streaming</span>}
                  {streamMeta?.sections && streamMeta.sections.length > 0 && (
                    <div className="rg-col-pills">
                      {streamMeta.sections.slice(0, 5).map(s => <span key={s} className="rg-sec-pill">§{s}</span>)}
                    </div>
                  )}
                </div>
                <AnswerPanel html={answerHtml} streaming={streaming} warnings={warnings} />
              </div>

              <div className="rg-col rg-col--data">
                <div className="rg-col-header">
                  <Layers size={14} /><span>Retrieved Clauses</span>
                  <span className="rg-count">{searchData.child_chunks.length}</span>
                </div>
                <div className="rg-chunks-list">
                  {searchData.child_chunks.map((c, i) => <ChunkCard key={c.id} chunk={c} rank={i + 1} />)}
                </div>
                <div className="rg-col-header" style={{ marginTop: "1.25rem" }}>
                  <FileText size={14} /><span>Parent Sections</span>
                  <span className="rg-count">{searchData.parent_sections.length}</span>
                </div>
                <div className="rg-parents-list">
                  {searchData.parent_sections.map(p => <ParentCard key={p.id} parent={p} />)}
                </div>
                {searchData.cross_refs.length > 0 && (
                  <div className="rg-crossrefs">
                    <span className="rg-crossrefs-label">Cross-refs</span>
                    {searchData.cross_refs.slice(0, 8).map((r, i) => <span key={i} className="rg-crossref-chip">{r}</span>)}
                  </div>
                )}
              </div>
            </div>
          )}

        </main>
      </div>
    </>
  )
}

function delay(ms: number) { return new Promise<void>(r => setTimeout(r, ms)) }

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,400&family=JetBrains+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');

  .rg-root * { box-sizing: border-box; margin: 0; padding: 0; }

  .rg-root {
    height: 100%;
    min-height: 0;
    background: #f8fafc;
    font-family: 'DM Sans', sans-serif;
    color: #1e293b;
    overflow-y: auto;
  }

  .rg-main {
    max-width: 1360px;
    margin: 0 auto;
    padding: 2rem 2rem 3rem;
  }

  .rg-hero { max-width: 820px; margin: 0 auto 1.5rem; }
  .rg-hero-text { text-align: center; padding: 1.5rem 0 1.25rem; }
  .rg-hero-icon {
    width: 52px; height: 52px; border-radius: 14px;
    background: #eff6ff; color: #2563eb;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto .75rem;
  }
  .rg-hero-title { font-family: 'Crimson Pro', serif; font-size: 1.75rem; font-weight: 600; color: #0f172a; margin-bottom: .3rem; }
  .rg-hero-desc  { font-size: .84rem; color: #64748b; line-height: 1.6; max-width: 460px; margin: 0 auto; }

  .rg-querybox {
    background: #fff; border: 1.5px solid #e2e8f0; border-radius: 14px;
    box-shadow: 0 2px 8px rgba(0,0,0,.05); overflow: hidden;
    transition: border-color .15s, box-shadow .15s;
  }
  .rg-querybox:focus-within {
    border-color: #93c5fd;
    box-shadow: 0 2px 8px rgba(0,0,0,.05), 0 0 0 3px rgba(37,99,235,.1);
  }
  .rg-input {
    width: 100%; padding: 1rem 1.25rem; border: none; outline: none; resize: none;
    font-family: 'DM Sans', sans-serif; font-size: .95rem; color: #1e293b;
    background: transparent; line-height: 1.65;
  }
  .rg-input::placeholder { color: #94a3b8; }
  .rg-querybox-footer {
    display: flex; align-items: center; justify-content: space-between;
    flex-wrap: wrap; gap: .5rem; padding: .6rem 1rem .7rem;
    border-top: 1px solid #f1f5f9; background: #f8fafc;
  }
  .rg-chips  { display: flex; flex-wrap: wrap; gap: .3rem; }
  .rg-actions { display: flex; gap: .35rem; }

  .rg-chip {
    font-size: .7rem; padding: .22rem .6rem;
    border: 1px solid #e2e8f0; border-radius: 20px;
    background: #fff; color: #64748b;
    cursor: pointer; transition: all .12s; font-family: 'DM Sans', sans-serif;
  }
  .rg-chip:hover { border-color: #2563eb; color: #2563eb; background: #eff6ff; }
  .rg-chip--lg { font-size: .8rem; padding: .35rem .85rem; }

  .rg-samples { display: flex; flex-direction: column; align-items: center; gap: .4rem; margin-top: 1.1rem; }

  .rg-btn {
    display: inline-flex; align-items: center; gap: .3rem;
    padding: .4rem .9rem; border-radius: 8px;
    font-size: .8rem; font-weight: 500; cursor: pointer;
    border: 1px solid transparent; transition: all .12s;
    font-family: 'DM Sans', sans-serif; white-space: nowrap;
  }
  .rg-btn--primary { background: #2563eb; color: #fff; }
  .rg-btn--primary:hover:not(:disabled) { background: #1d4ed8; }
  .rg-btn--primary:disabled { opacity: .45; cursor: not-allowed; }
  .rg-btn--ghost { background: #fff; border-color: #e2e8f0; color: #64748b; }
  .rg-btn--ghost:hover { border-color: #94a3b8; }
  .rg-btn--stop { background: #fff; border-color: #fca5a5; color: #dc2626; }
  .rg-btn--stop:hover { background: #fef2f2; }

  .rg-spinner {
    display: inline-block; width: 12px; height: 12px;
    border: 2px solid rgba(255,255,255,.3); border-top-color: #fff;
    border-radius: 50%; animation: rg-spin .55s linear infinite;
  }
  @keyframes rg-spin { to { transform: rotate(360deg); } }

  .rg-tracker {
    background: #fff; border: 1px solid #e2e8f0; border-radius: 12px;
    padding: .9rem 1.1rem; margin-bottom: 1.25rem;
    box-shadow: 0 1px 3px rgba(0,0,0,.04);
  }
  .rg-pipeline { display: flex; align-items: flex-start; flex-wrap: wrap; }
  .rg-step { display: flex; align-items: center; gap: .45rem; position: relative; flex: 1; min-width: 130px; }
  .rg-dot {
    width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
    display: flex; align-items: center; justify-content: center;
    font-size: .68rem; font-weight: 700; transition: all .2s;
  }
  .rg-step--done    .rg-dot { background: #16a34a; color: #fff; }
  .rg-step--active  .rg-dot { background: #2563eb; color: #fff; }
  .rg-step--pending .rg-dot { background: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; }
  .rg-step--idle    .rg-dot { background: #f1f5f9; color: #94a3b8; }
  .rg-step-info { display: flex; flex-direction: column; }
  .rg-step-label { font-size: .75rem; font-weight: 600; color: #334155; }
  .rg-step-desc  { font-size: .65rem; color: #94a3b8; }
  .rg-step--active .rg-step-label { color: #2563eb; }
  .rg-step--done   .rg-step-label { color: #16a34a; }
  .rg-line { position: absolute; right: 0; top: 13px; width: calc(100% - 120px); height: 1.5px; background: #e2e8f0; }
  .rg-line--done { background: #16a34a; }

  .rg-tracker-footer { margin-top: .65rem; display: flex; flex-direction: column; gap: .4rem; }
  .rg-timer { display: flex; align-items: center; gap: .45rem; font-size: .72rem; color: #94a3b8; font-family: 'JetBrains Mono', monospace; }
  .rg-qtype { background: #eff6ff; color: #2563eb; font-size: .65rem; padding: .1rem .4rem; border-radius: 4px; font-family: 'DM Sans', sans-serif; font-weight: 500; }
  .rg-streaming-badge { background: #dcfce7; color: #16a34a; font-size: .65rem; padding: .1rem .4rem; border-radius: 4px; font-weight: 500; animation: rg-pulse 1.4s ease-in-out infinite; }
  @keyframes rg-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
  .rg-meta-row { display: flex; flex-wrap: wrap; gap: .4rem; align-items: center; }
  .rg-badge { display: flex; align-items: center; gap: .25rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: .15rem .5rem; font-size: .7rem; }
  .rg-badge--warn { background: #fffbeb; border-color: #fcd34d; }
  .rg-badge-label { color: #94a3b8; }
  .rg-badge-value { font-weight: 600; color: #334155; font-family: 'JetBrains Mono', monospace; font-size: .68rem; }
  .rg-section-pills { display: flex; gap: .25rem; flex-wrap: wrap; margin-left: .25rem; }
  .rg-sec-pill { font-size: .65rem; padding: .12rem .4rem; background: #eff6ff; color: #2563eb; border-radius: 4px; font-family: 'JetBrains Mono', monospace; }

  .rg-error { display: flex; align-items: center; gap: .4rem; padding: .7rem 1rem; margin-bottom: 1rem; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; color: #dc2626; font-size: .82rem; }

  .rg-results { display: grid; grid-template-columns: 1fr 1fr; gap: 1.25rem; }
  @media (max-width: 860px) { .rg-results { grid-template-columns: 1fr; } }
  .rg-col { display: flex; flex-direction: column; gap: .6rem; }
  .rg-col-header { display: flex; align-items: center; gap: .35rem; font-size: .78rem; font-weight: 600; color: #1e3a5f; padding-bottom: .35rem; border-bottom: 2px solid #f1f5f9; }
  .rg-count { margin-left: auto; font-size: .68rem; font-weight: 400; color: #94a3b8; background: #f1f5f9; padding: .08rem .45rem; border-radius: 10px; }
  .rg-col-pills { display: flex; gap: .25rem; margin-left: auto; flex-wrap: wrap; }

  .rg-answer { background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,.05); position: sticky; top: 12px; }
  .rg-warnings { background: #fffbeb; border-bottom: 1px solid #fcd34d; padding: .7rem 1rem; }
  .rg-warnings-title { display: flex; align-items: center; gap: .3rem; font-size: .75rem; font-weight: 600; color: #d97706; margin-bottom: .35rem; }
  .rg-warnings-item { font-size: .75rem; color: #92400e; margin-top: .2rem; }
  .rg-answer-body { padding: 1.1rem 1.2rem; font-family: 'DM Sans', sans-serif; font-size: .84rem; line-height: 1.72; color: #1e293b; max-height: calc(100vh - 240px); overflow-y: auto; }

  .rg-answer-body h3 { font-family: 'Crimson Pro', serif; font-size: 1.05rem; color: #0f172a; margin-bottom: .45rem; font-weight: 600; }
  .rg-answer-body h4 { font-size: .82rem; font-weight: 600; color: #1e3a5f; margin: .9rem 0 .35rem; }
  .rg-answer-body p  { margin-bottom: .55rem; }
  .rg-answer-body blockquote { border-left: 3px solid #2563eb; padding: .7rem .95rem; background: #eff6ff; border-radius: 0 8px 8px 0; font-family: 'Crimson Pro', serif; font-size: .88rem; color: #1e3a5f; margin: .7rem 0; white-space: pre-wrap; }
  .rg-answer-body ul, .rg-answer-body ol { padding-left: 1.2rem; margin-bottom: .55rem; }
  .rg-answer-body li { margin-bottom: .25rem; }
  .rg-answer-body .citation { font-size: .7rem; color: #2563eb; background: #eff6ff; padding: .08rem .35rem; border-radius: 4px; margin-left: .25rem; font-family: 'JetBrains Mono', monospace; }
  .rg-answer-body .amendment-alerts { background: #fffbeb; border: 1px solid #fcd34d; border-radius: 6px; padding: .7rem .95rem; margin-bottom: .9rem; }
  .rg-answer-body .not-covered { background: #f8fafc; border: 1px dashed #cbd5e1; border-radius: 6px; padding: .7rem .95rem; margin-top: .9rem; font-size: .8rem; color: #64748b; }
  .rg-answer-body .no-context { color: #64748b; font-style: italic; background: #f8fafc; padding: .95rem; border-radius: 8px; border: 1px dashed #cbd5e1; }
  .rg-answer-body .conclusion { background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: .7rem .95rem; margin-top: .9rem; }
  .rg-answer-body .sections-referenced { background: #f8fafc; border-radius: 6px; padding: .6rem .9rem; margin-top: .6rem; font-size: .8rem; }
  .rg-answer-body .reasoning { color: #475569; font-size: .82rem; }
  .rg-answer-body hr    { border: none; border-top: 1px solid #f1f5f9; margin: .65rem 0; }
  .rg-answer-body small { font-size: .7rem; color: #94a3b8; }

  .rg-cursor { display: inline-block; width: 2px; height: .9em; background: #2563eb; margin-left: 2px; vertical-align: text-bottom; animation: rg-blink .75s step-end infinite; }
  @keyframes rg-blink { 0%,100%{opacity:1} 50%{opacity:0} }

  .rg-skeleton { display: flex; flex-direction: column; gap: .65rem; padding: .35rem 0; }
  .rg-skel-line { height: 13px; border-radius: 6px; background: linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%); background-size: 200% 100%; animation: rg-shimmer 1.4s infinite; }
  @keyframes rg-shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }

  .rg-chunks-list, .rg-parents-list { display: flex; flex-direction: column; gap: .4rem; }
  .rg-chunk { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: .65rem .8rem; transition: box-shadow .12s; }
  .rg-chunk:hover { box-shadow: 0 2px 8px rgba(0,0,0,.07); }
  .rg-chunk--amended { border-left: 3px solid #d97706; }
  .rg-chunk-header { display: flex; align-items: center; gap: .4rem; margin-bottom: .35rem; flex-wrap: wrap; }
  .rg-chunk-rank { font-size: .65rem; font-weight: 700; color: #94a3b8; font-family: 'JetBrains Mono', monospace; min-width: 18px; }
  .rg-chunk-tags { display: flex; gap: .25rem; flex-wrap: wrap; flex: 1; }
  .rg-chunk-score { font-size: .68rem; font-family: 'JetBrains Mono', monospace; color: #2563eb; font-weight: 600; margin-left: auto; }
  .rg-tag { font-size: .65rem; padding: .12rem .4rem; border-radius: 4px; display: inline-flex; align-items: center; gap: .18rem; }
  .rg-tag--section { background: #eff6ff; color: #2563eb; font-family: 'JetBrains Mono', monospace; font-weight: 500; }
  .rg-tag--clause  { background: #f1f5f9; color: #475569; }
  .rg-tag--term    { background: #f0fdf4; color: #16a34a; }
  .rg-tag--amend   { background: #fffbeb; color: #d97706; }
  .rg-chunk-text   { font-size: .76rem; color: #475569; line-height: 1.5; }
  .rg-chunk-amend  { display: flex; align-items: flex-start; gap: .25rem; margin-top: .35rem; font-size: .7rem; color: #d97706; background: #fffbeb; padding: .35rem .55rem; border-radius: 4px; }

  .rg-parent { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
  .rg-parent-header { width: 100%; display: flex; align-items: center; justify-content: space-between; padding: .6rem .85rem; background: none; border: none; cursor: pointer; text-align: left; transition: background .1s; font-family: 'DM Sans', sans-serif; }
  .rg-parent-header:hover { background: #f8fafc; }
  .rg-parent-title { display: flex; align-items: baseline; gap: .45rem; flex: 1; min-width: 0; }
  .rg-parent-sec { font-size: .7rem; font-weight: 700; color: #2563eb; font-family: 'JetBrains Mono', monospace; background: #eff6ff; padding: .08rem .4rem; border-radius: 4px; flex-shrink: 0; }
  .rg-parent-name { font-size: .8rem; font-weight: 500; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .rg-parent-meta { display: flex; align-items: center; gap: .4rem; color: #94a3b8; flex-shrink: 0; }
  .rg-parent-chapter { font-size: .65rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 120px; }
  .rg-parent-body { border-top: 1px solid #f1f5f9; padding: .9rem; background: #f8fafc; max-height: 380px; overflow-y: auto; }
  .rg-parent-text { font-family: 'Crimson Pro', serif; font-size: .83rem; color: #1e293b; line-height: 1.72; white-space: pre-wrap; word-break: break-word; }

  .rg-crossrefs { display: flex; flex-wrap: wrap; align-items: center; gap: .3rem; margin-top: .4rem; padding: .5rem .7rem; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
  .rg-crossrefs-label { font-size: .67rem; color: #94a3b8; font-weight: 500; margin-right: .15rem; }
  .rg-crossref-chip { font-size: .65rem; padding: .12rem .4rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 4px; color: #64748b; }
`