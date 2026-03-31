import type { Domain } from '../types';
import ProgressBar, { getBorderColor } from './ProgressBar';

interface Props {
  domain: Domain;
  score: number;
  max: number;
  pct: number;
  inUse: boolean;
  onToggleInUse: () => void;
  onClick: () => void;
}

export default function DomainCard({ domain, score, max, pct, inUse, onToggleInUse, onClick }: Props) {
  return (
    <div
      className={`rounded-xl border p-5 transition-all duration-200 cursor-pointer hover:shadow-lg ${
        inUse ? `${getBorderColor(pct)} bg-white shadow-sm` : 'border-slate-200 opacity-50 bg-slate-50'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0" onClick={onClick}>
          <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200 mb-1.5">
            {domain.nickname}
          </span>
          <h3 className="text-sm font-medium text-slate-700 truncate">{domain.name}</h3>
        </div>
        <label className="flex items-center gap-1.5 ml-3 shrink-0" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">In Use</span>
          <input
            type="checkbox"
            checked={inUse}
            onChange={onToggleInUse}
            className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-3.5 w-3.5"
            aria-label={`Toggle ${domain.nickname} in use`}
          />
        </label>
      </div>
      <div onClick={onClick}>
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-2xl font-bold text-slate-900 tabular-nums">{score}</span>
          <span className="text-sm text-slate-400">/ {max}</span>
          <span className="ml-auto text-lg font-bold text-slate-600 tabular-nums">{pct}%</span>
        </div>
        <ProgressBar score={score} max={max} showLabel={false} />
      </div>
    </div>
  );
}
