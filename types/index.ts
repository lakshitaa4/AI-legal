export interface TDSResult {
  file_name: string;
  source_type: string;
  nature_of_service: string;
  number_of_sections: number;
  primary_section: string;
  applied_rate: number;
  reason_short: string;
  confidence_score: number;
  deductee_name?: string;
  deductee_pan?: string;
  vendor_invoice_number?: string;
  taxable_value: number;
  invoice_value: number;
  hsn_sac_code?: string;
  description_raw?: string;
  description_cleaned?: string;
  description_detailed?: string;
  brief_explanation?: string;
  description_reference?: string;
  detailed_description_reference?: string;
  tax_related_causes?: string;
  tds_sections_identified?: string[];
  tds_rate_calculated: number;
}