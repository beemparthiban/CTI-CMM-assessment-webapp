const colorMap: Record<string, string> = {
  CTI0: 'bg-rose-100 text-rose-700 ring-rose-200',
  CTI1: 'bg-amber-100 text-amber-700 ring-amber-200',
  CTI2: 'bg-sky-100 text-sky-700 ring-sky-200',
  CTI3: 'bg-emerald-100 text-emerald-700 ring-emerald-200',
};

export default function MaturityBadge({ level }: { level: string }) {
  const color = colorMap[level] ?? 'bg-slate-100 text-slate-600 ring-slate-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ring-1 ring-inset ${color}`}>
      {level}
    </span>
  );
}
