const colorMap: Record<string, string> = {
  CTI0: 'bg-red-500 text-white',
  CTI1: 'bg-orange-400 text-white',
  CTI2: 'bg-yellow-400 text-gray-900',
  CTI3: 'bg-green-500 text-white',
};

export default function MaturityBadge({ level }: { level: string }) {
  const color = colorMap[level] ?? 'bg-gray-300 text-gray-800';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${color}`}>
      {level}
    </span>
  );
}
