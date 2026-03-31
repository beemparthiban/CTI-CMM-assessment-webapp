import { useRef, useState } from 'react';
import { Download, Upload } from 'lucide-react';
import { useAssessment } from '../store/AssessmentContext';

export default function ExportImport() {
  const { exportJSON, importJSON } = useAssessment();
  const fileInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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
