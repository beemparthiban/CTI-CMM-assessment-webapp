import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Pencil, Trash2, Download, GitCompare, Check, X } from 'lucide-react';
import domainsData from '../data/domains.json';
import type { Domain } from '../types';
import { useAssessment } from '../store/AssessmentContext';
import {
  scoreAssessmentOverall,
  countScoredObjectives,
} from '../store/useAssessmentStore';

const domains = domainsData.domains as Domain[];

function formatCreatedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    return d.toLocaleString();
  } catch {
    return iso;
  }
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'snapshot';
}

export default function HistoryPage() {
  const { snapshots, renameSnapshot, deleteSnapshot } = useAssessment();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const rows = useMemo(() => {
    return snapshots.map((s) => {
      const overall = scoreAssessmentOverall(s.state, domains);
      const counts = countScoredObjectives(s.state, domains);
      return {
        id: s.id,
        label: s.label,
        createdAt: s.createdAt,
        pct: overall.pct,
        score: overall.score,
        max: overall.max,
        scored: counts.scored,
        total: counts.total,
      };
    });
  }, [snapshots]);

  const beginEdit = (id: string, currentLabel: string) => {
    setEditingId(id);
    setEditLabel(currentLabel);
  };

  const saveEdit = () => {
    if (editingId) renameSnapshot(editingId, editLabel);
    setEditingId(null);
    setEditLabel('');
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditLabel('');
  };

  const handleExportOne = (id: string) => {
    const snap = snapshots.find((s) => s.id === id);
    if (!snap) return;
    const blob = new Blob([JSON.stringify(snap, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cti-cmm-snapshot-${slugify(snap.label)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">History</h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage snapshots of your assessment. Use{' '}
            <span className="font-semibold">Save snapshot</span> in the header to capture the current
            state.
          </p>
        </div>
        <Link
          to="/history/compare"
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
        >
          <GitCompare size={14} />
          Compare snapshots
        </Link>
      </div>

      {snapshots.length === 0 ? (
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-8 text-center">
          <h2 className="text-lg font-semibold text-brand-900 mb-2">No snapshots yet</h2>
          <p className="text-sm text-brand-700/80">
            Use <span className="font-semibold">Save snapshot</span> in the top-right header to
            capture your current assessment. Snapshots let you compare progress over time.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80 border-b border-slate-200">
                <tr>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Label
                  </th>
                  <th className="text-left px-3 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Created
                  </th>
                  <th className="text-center px-3 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Overall
                  </th>
                  <th className="text-center px-3 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Scored
                  </th>
                  <th className="text-right px-3 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row) => {
                  const isEditing = editingId === row.id;
                  const isConfirmingDelete = confirmDeleteId === row.id;
                  return (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-3 py-2.5">
                        {isEditing ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="text"
                              value={editLabel}
                              onChange={(e) => setEditLabel(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') saveEdit();
                                if (e.key === 'Escape') cancelEdit();
                              }}
                              autoFocus
                              className="flex-1 px-2 py-1 text-sm border border-slate-200 rounded-md focus:ring-2 focus:ring-brand-400"
                            />
                            <button
                              onClick={saveEdit}
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                              aria-label="Save label"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 text-slate-500 hover:bg-slate-100 rounded"
                              aria-label="Cancel rename"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          <span className="font-semibold text-slate-700">{row.label}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500 tabular-nums">
                        {formatCreatedAt(row.createdAt)}
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="text-sm font-bold text-slate-700 tabular-nums">
                          {row.pct}%
                        </span>
                        <span className="text-[10px] text-slate-400 ml-1 tabular-nums">
                          ({row.score}/{row.max})
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs text-slate-500 tabular-nums">
                        {row.scored} / {row.total}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {isConfirmingDelete ? (
                            <>
                              <span className="text-xs text-rose-700 mr-2">Delete?</span>
                              <button
                                onClick={() => {
                                  deleteSnapshot(row.id);
                                  setConfirmDeleteId(null);
                                }}
                                className="px-2 py-1 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-md"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="px-2 py-1 text-xs text-slate-600 hover:text-slate-800"
                              >
                                No
                              </button>
                            </>
                          ) : (
                            <>
                              <Link
                                to={`/history/compare?a=${encodeURIComponent(row.id)}&b=live`}
                                className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded"
                                aria-label="Compare with current"
                                title="Compare with current"
                              >
                                <GitCompare size={14} />
                              </Link>
                              <button
                                onClick={() => beginEdit(row.id, row.label)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                                aria-label="Rename"
                                title="Rename"
                              >
                                <Pencil size={14} />
                              </button>
                              <button
                                onClick={() => handleExportOne(row.id)}
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                                aria-label="Export snapshot as JSON"
                                title="Export snapshot"
                              >
                                <Download size={14} />
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(row.id)}
                                className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded"
                                aria-label="Delete snapshot"
                                title="Delete snapshot"
                              >
                                <Trash2 size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
