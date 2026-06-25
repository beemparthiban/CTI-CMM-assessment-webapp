import { useEffect, useRef, useState } from 'react';
import { Download, Upload, BookmarkPlus } from 'lucide-react';
import { useAssessment } from '../store/AssessmentContext';

function defaultLabel(): string {
  const d = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `Snapshot ${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export default function ExportImport() {
  const { exportJSON, importJSON, createSnapshot } = useAssessment();
  const fileInput = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const labelInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [snapOpen, setSnapOpen] = useState(false);
  const [snapLabel, setSnapLabel] = useState('');

  const handleExport = () => {
    const json = exportJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const date = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `cti-cmm-assessment-${date}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    fileInput.current?.click();
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importJSON(reader.result as string);
        setMessage({ type: 'success', text: 'Assessment imported successfully' });
      } catch {
        setMessage({ type: 'error', text: 'Invalid assessment file' });
      }
      setTimeout(() => setMessage(null), 3000);
    };
    reader.readAsText(file);
    // Reset so same file can be selected again
    e.target.value = '';
  };

  const openSnapPopover = () => {
    setSnapLabel(defaultLabel());
    setSnapOpen(true);
  };

  const closeSnapPopover = () => {
    setSnapOpen(false);
    setSnapLabel('');
  };

  const handleSaveSnapshot = () => {
    const snap = createSnapshot(snapLabel);
    closeSnapPopover();
    setMessage({ type: 'success', text: `Snapshot saved: ${snap.label}` });
    setTimeout(() => setMessage(null), 3000);
  };

  // Focus the input and close on outside click / Escape.
  useEffect(() => {
    if (!snapOpen) return;
    labelInputRef.current?.focus();
    labelInputRef.current?.select();

    const onDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        closeSnapPopover();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSnapPopover();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [snapOpen]);

  return (
    <div className="flex items-center gap-2">
      {message && (
        <span
          className={`text-xs px-2 py-1 rounded ${
            message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </span>
      )}

      {/* Save snapshot with inline popover */}
      <div className="relative" ref={popoverRef}>
        <button
          onClick={() => (snapOpen ? closeSnapPopover() : openSnapPopover())}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 transition-all shadow-sm"
          aria-label="Save a snapshot of the current assessment"
          aria-expanded={snapOpen}
        >
          <BookmarkPlus size={14} />
          Save snapshot
        </button>
        {snapOpen && (
          <div className="absolute right-0 mt-2 z-50 w-72 bg-white border border-slate-200 rounded-lg shadow-lg p-3 space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1">
                Snapshot label
              </label>
              <input
                ref={labelInputRef}
                type="text"
                value={snapLabel}
                onChange={(e) => setSnapLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveSnapshot();
                }}
                placeholder={defaultLabel()}
                className="w-full px-2.5 py-1.5 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-brand-400 focus:border-brand-400 bg-slate-50"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closeSnapPopover}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveSnapshot}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-md shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 transition-all shadow-sm"
        aria-label="Export assessment as JSON"
      >
        <Download size={14} />
        Export
      </button>
      <button
        onClick={handleImport}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 transition-all shadow-sm"
        aria-label="Import assessment from JSON"
      >
        <Upload size={14} />
        Import
      </button>
      <input
        ref={fileInput}
        type="file"
        accept=".json"
        onChange={handleFile}
        className="hidden"
        aria-hidden="true"
      />
    </div>
  );
}
