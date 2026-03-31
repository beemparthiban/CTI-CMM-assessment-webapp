interface Props {
  score: number;
  max: number;
  showLabel?: boolean;
}

function getColor(pct: number): string {
  if (pct >= 75) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-sky-500';
  if (pct >= 25) return 'bg-amber-500';
  return 'bg-rose-500';
}

export default function ProgressBar({ score, max, showLabel = true }: Props) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2.5 w-full">
      <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-slate-500 font-semibold tabular-nums w-10 text-right">{pct}%</span>
      )}
    </div>
  );
}

export function getPctColor(pct: number): string {
  if (pct >= 75) return 'text-emerald-600';
  if (pct >= 50) return 'text-sky-600';
  if (pct >= 25) return 'text-amber-600';
  return 'text-rose-600';
}

export function getBorderColor(pct: number): string {
  if (pct >= 75) return 'border-emerald-300';
  if (pct >= 50) return 'border-sky-300';
  if (pct >= 25) return 'border-amber-300';
  return 'border-rose-300';
}

export function getDotColor(pct: number): string {
  if (pct >= 75) return 'bg-emerald-400';
  if (pct >= 50) return 'bg-sky-400';
  if (pct >= 25) return 'bg-amber-400';
  return 'bg-rose-400';
}
