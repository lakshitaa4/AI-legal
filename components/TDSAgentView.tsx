'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Database, Upload, FileCheck, Layers } from 'lucide-react';
import { analyzeDocument, analyzeData } from '@/lib/api';
import { TDSResult } from '@/types';
import ResultsView from '@/components/ResultsView';
import { motion, AnimatePresence } from 'framer-motion';

// Exported type for use in ResultsView
export type ProcessingJob = {
  id: string;
  fileName: string;
  status: 'pending' | 'loading' | 'success' | 'error';
  data?: TDSResult | TDSResult[]; // Can be single (Doc) or array (CSV)
  errorMsg?: string;
};

export default function TDSDashboard() {
  const [viewState, setViewState] = useState<'landing' | 'results'>('landing');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeMode, setActiveMode] = useState<'doc' | 'data' | null>(null);
  
  // Forms
  const [docType, setDocType] = useState('invoice');
  const [vendorName, setVendorName] = useState('');
  const [vendorPan, setVendorPan] = useState('');
  const [comments, setComments] = useState('');
  const [targetCols, setTargetCols] = useState('Description');
  
  // Changed: Multi-file state
  const [files, setFiles] = useState<File[]>([]);
  // Changed: Job Queue state
  const [jobs, setJobs] = useState<ProcessingJob[]>([]);

  const handleStart = (mode: 'doc' | 'data') => {
    setActiveMode(mode);
    setFiles([]); // Reset files on new start
    setDialogOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const processAnalysis = async () => {
    if (files.length === 0) return;
    setDialogOpen(false);
    
    // 1. Initialize Jobs with 'loading' status
    const newJobs: ProcessingJob[] = files.map((f, index) => ({
      id: `${Date.now()}-${index}`,
      fileName: f.name,
      status: 'loading',
    }));
    setJobs(newJobs);
    setViewState('results');

    // 2. Process concurrently (Fire and forget loop)
    files.forEach(async (file, index) => {
      const fd = new FormData();
      fd.append('file', file);

      try {
        let resultData: TDSResult | TDSResult[];

        if (activeMode === 'doc') {
          fd.append('doc_type', docType);
          if (vendorName) fd.append('vendor_name', vendorName);
          if (vendorPan) fd.append('vendor_pan', vendorPan);
          if (comments) fd.append('comments', comments);
          // Single Document Analysis
          resultData = await analyzeDocument(fd);
        } else {
          fd.append('target_columns', targetCols);
          // Bulk Data Analysis (Returns array)
          resultData = await analyzeData(fd);
        }

        // 3. Update Job Success
        setJobs(prev => prev.map((job, idx) => {
          if (idx !== index) return job;
          return { ...job, status: 'success', data: resultData };
        }));

      } catch (err: any) {
        // 4. Update Job Error
        const errorDetail = err.response?.data?.detail || "Analysis Failed";
        setJobs(prev => prev.map((job, idx) => 
          idx === index ? { ...job, status: 'error', errorMsg: errorDetail } : job
        ));
      }
    });
  };

  return (
    <main className="min-h-screen bg-slate-50/50 selection:bg-indigo-100">
      <AnimatePresence mode="wait">
        {viewState === 'landing' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="container max-w-5xl mx-auto pt-24 px-6 text-center"
          >
            <div className="space-y-4 mb-16">
              <h1 className="text-6xl font-black text-slate-900 tracking-tight">TDS <span className="text-indigo-600">Agent</span></h1>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto">Unbreakable tax analysis powered by Hybrid AI & Legal Rules.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card onClick={() => handleStart('doc')} className="group cursor-pointer border-2 hover:border-indigo-500 hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden">
                <CardContent className="p-12 space-y-6">
                  <div className="w-20 h-20 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                    <FileText size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-800">Transaction Documents</h3>
                    <p className="text-slate-500 italic">Invoices, POs, Agreements, Contracts</p>
                  </div>
                </CardContent>
              </Card>

              <Card onClick={() => handleStart('data')} className="group cursor-pointer border-2 hover:border-emerald-500 hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden">
                <CardContent className="p-12 space-y-6">
                  <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                    <Database size={40} />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-slate-800">Transaction Data</h3>
                    <p className="text-slate-500 italic">Excel/CSV Purchase Records</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {viewState === 'results' && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="p-8 pt-12">
            {/* Pass Jobs instead of raw results */}
            <ResultsView jobs={jobs} onReset={() => setViewState('landing')} />
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-2xl">{activeMode === 'doc' ? 'Analyze Documents' : 'Bulk Data Analysis'}</DialogTitle>
            <DialogDescription>Input parameters for the legal reasoning engine.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {activeMode === 'doc' ? (
              <>
                <div className="grid gap-2">
                  <Label>Document Type *</Label>
                  <Select value={docType} onValueChange={setDocType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="invoice">Invoice</SelectItem>
                      <SelectItem value="po">Purchase Order</SelectItem>
                      <SelectItem value="agreement">Contract/Agreement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Vendor fields are usually specific to single doc, but keeping for overrides if needed */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Vendor Name (Opt)</Label>
                    <Input placeholder="Acme Inc" value={vendorName} onChange={e => setVendorName(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Vendor PAN (Opt)</Label>
                    <Input placeholder="ABCDE1234F" value={vendorPan} onChange={e => setVendorPan(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Additional Comments</Label>
                  <Textarea placeholder="Specific context for the Agent..." value={comments} onChange={e => setComments(e.target.value)} />
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label>Column Name(s) *</Label>
                <Input placeholder="Narration, Description" value={targetCols} onChange={e => setTargetCols(e.target.value)} />
                <p className="text-xs text-slate-400">Specify which columns contain the transaction description.</p>
              </div>
            )}

            <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-indigo-50/50 transition-colors relative">
              <input 
                type="file" 
                multiple // Enable Multiple Files
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleFileSelect}
                accept={activeMode === 'doc' ? ".pdf,image/*" : ".xlsx,.xls,.csv"}
              />
              {files.length > 0 ? (
                <div className="space-y-1">
                  <Layers className="w-10 h-10 text-indigo-600 mb-2 mx-auto" />
                  <span className="font-semibold text-slate-700 block">{files.length} files selected</span>
                  <span className="text-xs text-slate-500 block">Click to change selection</span>
                </div>
              ) : (
                <>
                  <Upload className="w-10 h-10 text-slate-300 mb-2" />
                  <span className="font-semibold text-slate-700">
                    {activeMode === 'doc' ? 'Select Document(s)' : 'Select Data File(s)'}
                  </span>
                  <span className="text-xs text-slate-400 mt-1">
                    {activeMode === 'doc' 
                      ? 'PDF, PNG, JPG supported' 
                      : 'XLSX, CSV supported'}
                  </span>
                </>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button className="w-full h-12 text-lg bg-indigo-600" onClick={processAnalysis} disabled={files.length === 0}>
              {files.length > 1 ? `Analyze ${files.length} Files` : 'Initialize Analysis'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}