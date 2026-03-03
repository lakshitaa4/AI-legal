// frontend/lib/api.ts
import axios from 'axios';
import { TDSResult } from '@/types';
import { SectionListResponse, CompareResponse, ChatMessage } from '@/types/it-agent';
import { NoticeValidationResponse } from '@/types/validate';

const API_URL = 'https://laksss-ai-legal-suite.hf.space'; 

export const api = axios.create({ baseURL: API_URL });

// TDS Agent
export const analyzeDocument = async (formData: FormData): Promise<TDSResult> => {
  const response = await api.post<TDSResult>('/tds/analyze-doc', formData);
  return response.data;
};

export const analyzeData = async (formData: FormData): Promise<TDSResult[]> => {
  const response = await api.post<TDSResult[]>('/tds/analyze-data', formData);
  return response.data;
};

// Notice Agent (Polling Support)
export const notice_api = {
  validate: async (formData: FormData) => {
    const response = await api.post('/api/v1/notice/validate', formData);
    return response.data; // { job_id: "...", status: "processing" }
  },
  checkStatus: async (jobId: string) => {
    const response = await api.get(`/api/v1/notice/status/${jobId}`);
    return response.data;
  },
  downloadReport: async (data: any) => {
    return await axios.post(`${API_URL}/api/v1/notice/download-report`, data, {
      responseType: 'blob'
    });
  }
};

// Drafting Agent (Polling Support)
export const drafting_api = {
  generate: async (formData: FormData) => {
    const response = await api.post('/api/v1/drafting/generate', formData);
    return response.data;
  },
  checkStatus: async (jobId: string) => {
    const response = await api.get(`/api/v1/drafting/status/${jobId}`);
    return response.data;
  },
  chat: async (payload: any) => {
    const response = await api.post('/api/v1/drafting/chat', payload);
    return response.data;
  }
};

// Summarizer Agent (Polling Support)
export const summarizer_api = {
  analyze: async (formData: FormData) => {
    const response = await api.post('/summarizer/analyze', formData);
    return response.data;
  },
  checkStatus: async (jobId: string) => {
    const response = await api.get(`/summarizer/status/${jobId}`);
    return response.data;
  }
};

// IT Agent
export const getITSections = async (): Promise<SectionListResponse> => {
  const response = await api.get('/it-agent/sections');
  return response.data;
};

export const compareITSections = async (sectionNumber: string): Promise<CompareResponse> => {
  const response = await api.post('/it-agent/compare', { sectionNumber });
  return response.data;
};

export const chatWithITAgent = async (query: string, oldAct: string, newAct: string, memo: string, history: ChatMessage[]) => {
  const response = await api.post('/it-agent/chat', {
    query,
    old_act: oldAct, 
    new_act: newAct,
    memo: memo,
    history
  });
  return response.data;
};