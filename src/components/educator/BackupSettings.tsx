/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { StorageService } from '../../services/storage';
import { 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Terminal, 
  Layers,
  Server
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const BackupSettings: React.FC = () => {
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExportJson = () => {
    const jsonStr = StorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `presencelive_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    confetti({ particleCount: 40, spread: 50, origin: { y: 0.6 } });
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const ok = StorageService.importAllData(text);
        if (ok) {
          setImportStatus('Backup restored successfully! All data updated.');
          setImportError(null);
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        } else {
          setImportError('Invalid JSON format.');
        }
      } catch (err: unknown) {
        setImportError('Failed to parse backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Client-Side Storage & Backup Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-200 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Browser Storage & Portable Backups</h2>
            <p className="text-xs text-slate-500">
              Export course rosters, facial biometric maps, and attendance ledgers for zero-data-loss portability.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
            <span className="font-bold text-xs text-slate-900 block mb-1">Export Full Snapshot</span>
            <p className="text-xs text-slate-500 mb-4">
              Download your courses, enrolled students, biometric vectors, and records as a verified JSON file.
            </p>
            <button
              onClick={handleExportJson}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download JSON Backup</span>
            </button>
          </div>

          <div className="p-4 border border-slate-200 rounded-lg bg-slate-50">
            <span className="font-bold text-xs text-slate-900 block mb-1">Restore from Snapshot</span>
            <p className="text-xs text-slate-500 mb-4">
              Upload a previously exported JSON backup to synchronize across devices or restore state.
            </p>
            <input
              type="file"
              accept=".json,application/json"
              ref={fileInputRef}
              onChange={handleImportJson}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Select Backup File</span>
            </button>
          </div>
        </div>

        {importStatus && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{importStatus}</span>
          </div>
        )}

        {importError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{importError}</span>
          </div>
        )}
      </div>

      {/* Supabase & Prisma ORM Blueprint Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-200 mb-6">
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Supabase & PostgreSQL Prisma Integration</h2>
            <p className="text-xs text-slate-500">
              The project includes full Prisma models ready to connect to your Supabase PostgreSQL cluster.
            </p>
          </div>
        </div>

        <div className="space-y-4 text-xs text-slate-700 leading-relaxed">
          <p>
            This app uses high-speed client-side storage for zero-latency, private biometric verification. When you are ready to scale to cloud database persistence on Supabase, the complete <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-blue-700">prisma/schema.prisma</code> schema and environment keys are already in place:
          </p>

          <div className="bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-[11px] space-y-2 overflow-x-auto">
            <div className="text-slate-400"># 1. Update your Supabase PostgreSQL credentials in .env:</div>
            <div>DATABASE_URL=&quot;postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres?sslmode=require&quot;</div>
            <div className="text-slate-400 mt-2"># 2. Push Prisma schema migrations:</div>
            <div>make prisma-push</div>
            <div className="text-slate-400 mt-2"># 3. Generate typed Prisma client:</div>
            <div>make prisma-gen</div>
          </div>
        </div>
      </div>

      {/* Makefile Tooling Commands */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-200 mb-4">
          <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Centralized Makefile Targets</h2>
            <p className="text-xs text-slate-500">Commands centralized in the root Makefile</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono">
            <strong className="text-blue-700 block mb-0.5">make dev</strong>
            <span className="text-slate-600 text-[11px]">Starts Vite dev server on port 3000 with HMR</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono">
            <strong className="text-blue-700 block mb-0.5">make test</strong>
            <span className="text-slate-600 text-[11px]">Runs TypeScript validation and compiler invariants</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono">
            <strong className="text-blue-700 block mb-0.5">make build</strong>
            <span className="text-slate-600 text-[11px]">Compiles optimized production bundle for Vercel</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono">
            <strong className="text-blue-700 block mb-0.5">make deploy</strong>
            <span className="text-slate-600 text-[11px]">Prepares production build with deployment verification</span>
          </div>
        </div>
      </div>
    </div>
  );
};
