'use client';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, CheckCircle, AlertCircle, RefreshCcw, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { ProcessingJob } from './TDSAgentView';

interface ResultsViewProps {
  jobs: ProcessingJob[];
  onReset: () => void;
}

export default function ResultsView({ jobs, onReset }: ResultsViewProps) {
  
  const handleDownload = () => {
    // Flatten all successful data into one array for Excel
    const validResults = jobs
      .filter(j => j.status === 'success' && j.data)
      .flatMap(j => Array.isArray(j.data) ? j.data : [j.data!]);
      
    if (validResults.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(validResults);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TDS Report");
    XLSX.writeFile(workbook, `TDS_Batch_Report_${new Date().getTime()}.xlsx`);
  };

  const completedCount = jobs.filter(j => j.status === 'success' || j.status === 'error').length;
  const isAllDone = completedCount === jobs.length;

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Analysis Results</h2>
          <p className="text-slate-500 text-sm">
            Processing {completedCount} of {jobs.length} files...
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onReset} className="border-slate-200">
            <RefreshCcw className="mr-2 h-4 w-4" /> New Analysis
          </Button>
          <Button 
            onClick={handleDownload} 
            disabled={!isAllDone}
            className="bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50"
          >
            <Download className="mr-2 h-4 w-4" /> Download Excel
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="font-semibold text-slate-700">Source File</TableHead>
              <TableHead className="font-semibold text-slate-700">Nature of Service</TableHead>
              <TableHead className="text-center font-semibold text-slate-700">No. Sections</TableHead>
              <TableHead className="font-semibold text-slate-700">Primary Section</TableHead>
              <TableHead className="font-semibold text-slate-700">Rate</TableHead>
              <TableHead className="w-[280px] font-semibold text-slate-700">Reason / Status</TableHead>
              <TableHead className="font-semibold text-slate-700">Confidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {jobs.map((job) => {
              // 1. LOADING STATE
              if (job.status === 'loading') {
                return (
                  <TableRow key={job.id} className="animate-pulse">
                    <TableCell className="font-medium text-slate-500">{job.fileName}</TableCell>
                    <TableCell colSpan={6}>
                      <div className="flex items-center text-indigo-600">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }
              
              // 2. ERROR STATE
              if (job.status === 'error' || !job.data) {
                return (
                  <TableRow key={job.id} className="bg-red-50/50">
                    <TableCell className="font-medium text-slate-900">{job.fileName}</TableCell>
                    <TableCell colSpan={6} className="text-red-600 text-sm font-medium">
                      <div className="flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        {job.errorMsg || "Analysis Failed"}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              }

              // 3. SUCCESS STATE
              // Handle both Single Result (Doc) and Array Result (Data/CSV)
              const resultsToRender = Array.isArray(job.data) ? job.data : [job.data];

              return resultsToRender.map((row, idx) => (
                <TableRow key={`${job.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                  <TableCell className="font-medium text-slate-900">{row.file_name}</TableCell>
                  <TableCell className="text-slate-600">{row.nature_of_service}</TableCell>
                  <TableCell className="text-center font-bold text-slate-500">{row.number_of_sections}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200 font-bold px-3 py-1">
                      {row.primary_section}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold text-indigo-900">{row.applied_rate}%</TableCell>
                  <TableCell className="text-sm text-slate-600 leading-relaxed italic">
                    "{row.reason_short}"
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      {row.confidence_score > 0.8 ? (
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                      <span className={`font-semibold ${row.confidence_score > 0.8 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {(row.confidence_score * 100).toFixed(0)}%
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ));
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}