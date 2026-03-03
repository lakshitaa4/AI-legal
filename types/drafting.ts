export interface DraftSection {
  section_id: string;
  title: string;
  content: string; // HTML
  reasoning: string;
  citations: string[];
}

export interface DraftResponse {
  document_title: string;
  sections: DraftSection[];
  overall_strategy: string;
  processing_time_seconds: number;
}