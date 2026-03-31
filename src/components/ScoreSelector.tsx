interface Props {
  value: number | null;
  isNA: boolean;
  onChange: (score: number | null, isNA: boolean) => void;
}

const levels = [
  { label: '0', score: 0, active: 'bg-red-500 text-white', inactive: 'border-red-500 text-red-600 hover:bg-red-50' },
  { label: '1', score: 1, active: 'bg-orange-400 text-white', inactive: 'border-orange-400 text-orange-600 hover:bg-orange-50' },
  { label: '2', score: 2, active: 'bg-yellow-400 text-white', inactive: 'border-yellow-400 text-yellow-700 hover:bg-yellow-50' },
  { label: '3', score: 3, active: 'bg-green-500 text-white', inactive: 'border-green-500 text-green-700 hover:bg-green-50' },
  { label: 'N/A', score: -1, active: 'bg-gray-400 text-white', inactive: 'border-gray-400 text-gray-600 hover:bg-gray-50' },
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
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
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
