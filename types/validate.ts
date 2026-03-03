// frontend/types/index.ts

export interface AmountBreakup {
  tax: number | null;
  interest: number | null;
  penalty: number | null;
  total: number | null;
  issue_amounts?: number[];
}

export interface IssueSchema {
  issue_number?: string;
  issue_title: string;
  issue_details: string;
  type: "Legal" | "Factual";
  // Domain specific optional fields
  transaction_segment?: string; // TP
  issue_type?: string; // TP
  filters?: string[]; // TP
  argument_appeal?: string; // TP
  category?: string; // IDT
  tax_period?: string; // IDT
  amount?: any; // Can be object or simple amounts
  documents_required?: string[];
}

export interface NoticeValidationResponse {
  document_type: string;
  domain: string;
  notice_type: string;
  din: string | null;
  assessment_year: string | null;
  pan: string | null;
  taxpayer_name: string | null;
  date_of_issue: string | null;
  submission_deadline: string | null;
  hearing_date: string | null;
  hearing_type: string | null;
  demand: AmountBreakup | null;
  warnings: string[];
  critical_flags: string[];
  total_issues: number;
  extracted_issues: IssueSchema[];
  extracted_text_preview: string;
  is_scanned: boolean;
  processing_time_seconds: number;
  // NEW EY-Style Fields
  validation_grid: ValidationCheck[];
  advisory_notes: Record<string, string>;
}


export interface ValidationCheck {
  label: string;
  status: string;
  description: string;
}
