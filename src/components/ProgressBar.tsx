interface Props {
  score: number;
  max: number;
  showLabel?: boolean;
}

function getColor(pct: number): string {
  if (pct >= 75) return 'bg-green-500';
  if (pct >= 50) return 'bg-yellow-400';
  if (pct >= 25) return 'bg-orange-400';
  return 'bg-red-500';
}

export default function ProgressBar({ score, max, showLabel = true }: Props) {
  const pct = max > 0 ? Math.round((score / max) * 100) : 0;
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ${getColor(pct)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-600 font-medium w-10 text-right">{pct}%</span>
      )}
    </div>
  );
}

export function getPctColor(pct: number): string {
  if (pct >= 75) return 'text-green-600';
  if (pct >= 50) return 'text-yellow-600';
  if (pct >= 25) return 'text-orange-500';
  return 'text-red-500';
}

export function getBorderColor(pct: number): string {
  if (pct >= 75) return 'border-green-400';
  if (pct >= 50) return 'border-yellow-400';
  if (pct >= 25) return 'border-orange-400';
  return 'border-red-400';
}

export function getDotColor(pct: number): string {
  if (pct >= 75) return 'bg-green-400';
  if (pct >= 50) return 'bg-yellow-400';
  if (pct >= 25) return 'bg-orange-400';
  return 'bg-red-400';
}
