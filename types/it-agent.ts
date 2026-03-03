export interface SectionItem {
  number: string;
  title: string;
}

export interface SectionListResponse {
  sections: SectionItem[];
}

export interface ActData {
  chapterNumber: string;
  sectionTitle: string;
  sectionText: string;
}

export interface MemoData {
  sectionTitle: string;
  memorandumText: string;
}

export interface FAQData {
  sectionTitle: string;
  faqText: string;
}

export interface CompareResponse {
  act1961: Record<string, ActData>;
  act2025: Record<string, ActData>;
  memorandum: {
    act1961: Record<string, MemoData>;
    act2025: Record<string, MemoData>;
  };
  faq: {
    act1961: Record<string, FAQData>;
    act2025: Record<string, FAQData>;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}