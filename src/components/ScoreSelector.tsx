interface Props {
  value: number | null;
  isNA: boolean;
  onChange: (score: number | null, isNA: boolean) => void;
}

const levels = [
  { label: '0', score: 0, active: 'bg-rose-600 text-white shadow-sm', inactive: 'border-slate-300 text-slate-600 hover:border-rose-400 hover:text-rose-600 hover:bg-rose-50' },
  { label: '1', score: 1, active: 'bg-amber-500 text-white shadow-sm', inactive: 'border-slate-300 text-slate-600 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50' },
  { label: '2', score: 2, active: 'bg-sky-500 text-white shadow-sm', inactive: 'border-slate-300 text-slate-600 hover:border-sky-400 hover:text-sky-600 hover:bg-sky-50' },
  { label: '3', score: 3, active: 'bg-emerald-600 text-white shadow-sm', inactive: 'border-slate-300 text-slate-600 hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50' },
  { label: 'N/A', score: -1, active: 'bg-slate-500 text-white shadow-sm', inactive: 'border-slate-300 text-slate-500 hover:border-slate-400 hover:bg-slate-100' },
];

export default function ScoreSelector({ value, isNA, onChange }: Props) {
  const handleClick = (level: typeof levels[number]) => {
    if (level.label === 'N/A') {
      onChange(isNA ? null : null, !isNA);
    } else {
      if (!isNA && value === level.score) {
        onChange(null, false);
      } else {
        onChange(level.score, false);
      }
    }
  };

  return (
    <div role="group" aria-label="Score selector" className="flex gap-1 flex-wrap">
      {levels.map((level) => {
        const isActive =
          level.label === 'N/A' ? isNA : !isNA && value === level.score;
        return (
          <button
            key={level.label}
            type="button"
            onClick={() => handleClick(level)}
            className={`px-3 py-1 rounded-md text-sm font-semibold border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 ${
              isActive ? level.active : `bg-white ${level.inactive}`
            }`}
            aria-pressed={isActive}
          >
            {level.label}
          </button>
        );
      })}
    </div>
  );
}
