import type { Snapshot } from '../types';

interface Props {
  value: string; // snapshot id or 'live'
  snapshots: Snapshot[];
  onChange: (value: string) => void;
  includeLive?: boolean;
  liveLabel?: string;
  id?: string;
  ariaLabel?: string;
}

function formatCreatedAt(iso: string): string {
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return iso;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

export default function SnapshotPicker({
  value,
  snapshots,
  onChange,
  includeLive = true,
  liveLabel = 'Current (live)',
  id,
  ariaLabel,
}: Props) {
  return (
    <select
      id={id}
      aria-label={ariaLabel}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg bg-white shadow-sm focus:ring-2 focus:ring-brand-400 focus:border-brand-400"
    >
      {includeLive && <option value="live">{liveLabel}</option>}
      {snapshots.map((s) => (
        <option key={s.id} value={s.id}>
          {s.label} — {formatCreatedAt(s.createdAt)}
        </option>
      ))}
    </select>
  );
}
