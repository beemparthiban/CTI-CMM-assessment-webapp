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
      className={`rounded-lg border-2 p-4 transition-all cursor-pointer hover:shadow-md ${
        inUse ? getBorderColor(pct) : 'border-gray-200 opacity-50'
      } bg-white`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1 min-w-0" onClick={onClick}>
          <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800 mb-1">
            {domain.nickname}
          </span>
          <h3 className="text-sm font-medium text-gray-800 truncate">{domain.name}</h3>
        </div>
        <label className="flex items-center gap-1 ml-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <span className="text-xs text-gray-500">In Use</span>
          <input
            type="checkbox"
            checked={inUse}
            onChange={onToggleInUse}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
            aria-label={`Toggle ${domain.nickname} in use`}
          />
        </label>
      </div>
      <div onClick={onClick}>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-2xl font-bold text-gray-900">{score}</span>
          <span className="text-sm text-gray-500">/ {max}</span>
          <span className="ml-auto text-lg font-semibold text-gray-700">{pct}%</span>
        </div>
        <ProgressBar score={score} max={max} showLabel={false} />
      </div>
    </div>
  );
}
