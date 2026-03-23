// types/rag-demo.ts

export interface ChildChunk {
  id: string
  section_number: string
  clause_id: string
  defined_term?: string
  chunk_text: string
  rerank_score: number
  has_amendment: boolean
  effective_date?: string
  amendment_text?: string
  cross_refs: string[]
}

export interface ParentSection {
  id: string
  section_number: string
  section_title: string
  chapter: string
  full_text: string
}

export interface RetrievalMetadata {
  n_candidates: number
  n_reranked: number
  n_parents: number
  n_warnings: number
  query_type: string
}

export interface SearchResponse {
  query: string
  child_chunks: ChildChunk[]
  parent_sections: ParentSection[]
  amendment_warnings: string[]
  cross_refs: string[]
  context_for_llm: string
  retrieval_metadata: RetrievalMetadata
}

export interface AskResponse {
  answer: string
  metadata: RetrievalMetadata
  sections_referenced: string[]
}

export type PipelineStage =
  | 'idle'
  | 'classifying'
  | 'searching'
  | 'reranking'
  | 'fetching'
  | 'generating'
  | 'done'