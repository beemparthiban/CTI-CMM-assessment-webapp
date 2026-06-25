import { Fragment, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeftRight,
  TrendingDown,
  TrendingUp,
  Minus,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import domainsData from '../data/domains.json';
import type { AssessmentState, Domain, DomainDiff } from '../types';
import { useAssessment } from '../store/AssessmentContext';
import {
  diffSnapshots,
  diffOverall,
  diffDomainObjectives,
  type ObjectiveChange,
  type ObjectiveChangeKind,
} from '../store/useAssessmentStore';
import SnapshotPicker from '../components/SnapshotPicker';
import ProgressBar from '../components/ProgressBar';

const domains = domainsData.domains as Domain[];
const domainById = new Map<number, Domain>(domains.map((d) => [d.id, d]));

type DiffSortField = 'domain' | 'aPct' | 'bPct' | 'deltaPts' | 'deltaPct';
type SortDir = 'asc' | 'desc';

function deltaColor(delta: number): string {
  if (delta > 0) return 'text-emerald-700 bg-emerald-50 ring-emerald-200';
  if (delta < 0) return 'text-rose-700 bg-rose-50 ring-rose-200';
  return 'text-slate-500 bg-slate-100 ring-slate-200';
}

function DeltaPill({ value, suffix }: { value: number; suffix?: string }) {
  const sign = value > 0 ? '+' : value < 0 ? '' : '±';
  const Icon = value > 0 ? TrendingUp : value < 0 ? TrendingDown : Minus;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset tabular-nums ${deltaColor(
        value
      )}`}
    >
      <Icon size={12} />
      {sign}
      {value}
      {suffix ?? ''}
    </span>
  );
}

function MaturityChip({ level }: { level: string }) {
  const color =
    level === 'CTI1'
      ? 'bg-sky-50 text-sky-700 ring-sky-200'
      : level === 'CTI2'
      ? 'bg-violet-50 text-violet-700 ring-violet-200'
      : level === 'CTI3'
      ? 'bg-emerald-50 text-emerald-700 ring-emerald-200'
      : 'bg-slate-100 text-slate-600 ring-slate-200';
  return (
    <span
      className={`inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-bold ring-1 ring-inset tabular-nums ${color}`}
    >
      {level}
    </span>
  );
}

function ScoreCell({ score, isNA }: { score: number | null; isNA: boolean }) {
  if (isNA) {
    return (
      <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ring-1 ring-inset bg-slate-100 text-slate-500 ring-slate-200">
        N/A
      </span>
    );
  }
  if (score == null) {
    return <span className="text-slate-300 tabular-nums">—</span>;
  }
  return <span className="font-semibold text-slate-700 tabular-nums">{score}</span>;
}

function ChangeBadge({ kind, delta }: { kind: ObjectiveChangeKind; delta: number }) {
  switch (kind) {
    case 'improved':
      return <DeltaPill value={delta} />;
    case 'regressed':
      return <DeltaPill value={delta} />;
    case 'newly-scored':
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ring-1 ring-inset bg-emerald-50 text-emerald-700 ring-emerald-200">
          newly scored
        </span>
      );
    case 'unscored':
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-200">
          unscored
        </span>
      );
    case 'became-na':
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ring-1 ring-inset bg-slate-100 text-slate-600 ring-slate-200">
          → N/A
        </span>
      );
    case 'left-na':
      return (
        <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ring-1 ring-inset bg-sky-50 text-sky-700 ring-sky-200">
          N/A →
        </span>
      );
  }
}

function summarizeChanges(changes: ObjectiveChange[]): string {
  if (changes.length === 0) return 'No changes';
  const improved = changes.filter((c) => c.kind === 'improved').length;
  const regressed = changes.filter((c) => c.kind === 'regressed').length;
  const newlyScored = changes.filter((c) => c.kind === 'newly-scored').length;
  const unscored = changes.filter((c) => c.kind === 'unscored').length;
  const naIn = changes.filter((c) => c.kind === 'became-na').length;
  const naOut = changes.filter((c) => c.kind === 'left-na').length;
  const parts: string[] = [];
  if (improved) parts.push(`${improved} improved`);
  if (regressed) parts.push(`${regressed} regressed`);
  if (newlyScored) parts.push(`${newlyScored} newly scored`);
  if (unscored) parts.push(`${unscored} unscored`);
  if (naIn) parts.push(`${naIn} → N/A`);
  if (naOut) parts.push(`${naOut} N/A →`);
  return `${changes.length} change${changes.length === 1 ? '' : 's'} • ${parts.join(' • ')}`;
}

function resolveState(
  id: string,
  liveState: AssessmentState,
  snapshots: { id: string; state: AssessmentState }[]
): AssessmentState | null {
  if (id === 'live') return liveState;
  const snap = snapshots.find((s) => s.id === id);
  return snap ? snap.state : null;
}

function resolveLabel(
  id: string,
  snapshots: { id: string; label: string; createdAt: string }[]
): string {
  if (id === 'live') return 'Current (live)';
  const snap = snapshots.find((s) => s.id === id);
  return snap ? snap.label : '—';
}

export default function ComparePage() {
  const { state, snapshots } = useAssessment();
  const [searchParams, setSearchParams] = useSearchParams();

  const defaultA = snapshots[0]?.id ?? 'live';
  const defaultB = 'live';
  const aId = searchParams.get('a') ?? defaultA;
  const bId = searchParams.get('b') ?? defaultB;

  const [sortField, setSortField] = useState<DiffSortField>('deltaPts');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});

  const setSide = (side: 'a' | 'b', value: string) => {
    const next = new URLSearchParams(searchParams);
    next.set(side, value);
    setSearchParams(next, { replace: true });
  };

  const swap = () => {
    const next = new URLSearchParams(searchParams);
    next.set('a', bId);
    next.set('b', aId);
    setSearchParams(next, { replace: true });
  };

  const aState = resolveState(aId, state, snapshots);
  const bState = resolveState(bId, state, snapshots);

  const aLabel = resolveLabel(aId, snapshots);
  const bLabel = resolveLabel(bId, snapshots);

  const diffs: DomainDiff[] = useMemo(() => {
    if (!aState || !bState) return [];
    return diffSnapshots(aState, bState, domains);
  }, [aState, bState]);

  const overall = useMemo(() => {
    if (!aState || !bState) return null;
    return diffOverall(aState, bState, domains);
  }, [aState, bState]);

  // Pre-compute per-domain objective change lists (only when both states are valid).
  const changesByDomain = useMemo(() => {
    const m = new Map<number, ObjectiveChange[]>();
    if (!aState || !bState) return m;
    for (const d of domains) {
      m.set(d.id, diffDomainObjectives(aState, bState, d));
    }
    return m;
  }, [aState, bState]);

  const sortedDiffs = useMemo(() => {
    const copy = [...diffs];
    copy.sort((x, y) => {
      let cmp = 0;
      switch (sortField) {
        case 'domain':
          cmp = x.domainId - y.domainId;
          break;
        case 'aPct':
          cmp = x.aPct - y.aPct;
          break;
        case 'bPct':
          cmp = x.bPct - y.bPct;
          break;
        case 'deltaPts':
          cmp = x.deltaPts - y.deltaPts;
          break;
        case 'deltaPct':
          cmp = x.deltaPct - y.deltaPct;
          break;
      }
      if (cmp === 0) cmp = x.domainId - y.domainId;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return copy;
  }, [diffs, sortField, sortDir]);

  const handleSort = (field: DiffSortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'deltaPts' || field === 'deltaPct' ? 'desc' : 'asc');
    }
  };

  const sortIcon = (field: DiffSortField) => {
    if (sortField !== field) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  const toggleExpand = (domainId: number) => {
    setExpanded((prev) => ({ ...prev, [domainId]: !prev[domainId] }));
  };

  const expandableIds = useMemo(
    () => sortedDiffs.filter((d) => (changesByDomain.get(d.domainId)?.length ?? 0) > 0).map((d) => d.domainId),
    [sortedDiffs, changesByDomain]
  );

  const allExpanded =
    expandableIds.length > 0 && expandableIds.every((id) => expanded[id]);

  const expandAll = () => {
    const next: Record<number, boolean> = {};
    for (const id of expandableIds) next[id] = true;
    setExpanded(next);
  };
  const collapseAll = () => setExpanded({});

  if (snapshots.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-900 mb-4">Compare</h1>
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-8 text-center">
          <h2 className="text-lg font-semibold text-brand-900 mb-2">No snapshots to compare</h2>
          <p className="text-sm text-brand-700/80 mb-4">
            Save at least one snapshot first using the{' '}
            <span className="font-semibold">Save snapshot</span> button in the header. You'll then
            be able to compare it against your current (live) assessment.
          </p>
          <Link
            to="/history"
            className="inline-flex items-center px-3 py-1.5 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-lg shadow-sm"
          >
            Go to History
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Compare</h1>
        <p className="text-sm text-slate-500 mt-1">
          Compare two points in time to see how each domain has matured.
        </p>
      </div>

      {/* Picker row */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div>
            <label
              htmlFor="cmp-a"
              className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1"
            >
              A — Baseline
            </label>
            <SnapshotPicker
              id="cmp-a"
              value={aId}
              snapshots={snapshots}
              onChange={(v) => setSide('a', v)}
              ariaLabel="Baseline snapshot"
            />
          </div>
          <div className="flex md:justify-center">
            <button
              type="button"
              onClick={swap}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
              aria-label="Swap A and B"
              title="Swap A and B"
            >
              <ArrowLeftRight size={14} />
              Swap
            </button>
          </div>
          <div>
            <label
              htmlFor="cmp-b"
              className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1"
            >
              B — Comparison
            </label>
            <SnapshotPicker
              id="cmp-b"
              value={bId}
              snapshots={snapshots}
              onChange={(v) => setSide('b', v)}
              ariaLabel="Comparison snapshot"
            />
          </div>
        </div>

        {/* Overall summary */}
        {overall && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="text-sm text-slate-600">
              Comparing{' '}
              <span className="font-semibold text-slate-800">{aLabel}</span> →{' '}
              <span className="font-semibold text-slate-800">{bLabel}</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm text-slate-500">
                Overall:{' '}
                <span className="font-bold text-slate-700 tabular-nums">{overall.aPct}%</span>{' '}
                →{' '}
                <span className="font-bold text-slate-700 tabular-nums">{overall.bPct}%</span>
              </span>
              <DeltaPill value={overall.deltaPct} suffix="%" />
              <DeltaPill value={overall.deltaPts} suffix=" pts" />
            </div>
          </div>
        )}
      </div>

      {/* Expand/Collapse all toolbar */}
      {expandableIds.length > 0 && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-slate-500">
            {expandableIds.length} domain{expandableIds.length === 1 ? '' : 's'} with objective-level changes
          </span>
          <button
            type="button"
            onClick={allExpanded ? collapseAll : expandAll}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 shadow-sm"
          >
            {allExpanded ? 'Collapse all' : 'Expand all'}
          </button>
        </div>
      )}

      {/* Domain diff table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="w-8 px-2 py-2.5" />
                <th
                  className="text-left px-3 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort('domain')}
                >
                  Domain{sortIcon('domain')}
                </th>
                <th
                  className="text-left px-3 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide cursor-pointer hover:text-slate-800 w-64"
                  onClick={() => handleSort('aPct')}
                >
                  A{sortIcon('aPct')}
                </th>
                <th
                  className="text-left px-3 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide cursor-pointer hover:text-slate-800 w-64"
                  onClick={() => handleSort('bPct')}
                >
                  B{sortIcon('bPct')}
                </th>
                <th
                  className="text-center px-3 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort('deltaPts')}
                >
                  Δ pts{sortIcon('deltaPts')}
                </th>
                <th
                  className="text-center px-3 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide cursor-pointer hover:text-slate-800"
                  onClick={() => handleSort('deltaPct')}
                >
                  Δ %{sortIcon('deltaPct')}
                </th>
                <th className="text-center px-3 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wide">
                  Scope
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedDiffs.map((d) => {
                const changes = changesByDomain.get(d.domainId) ?? [];
                const isExpandable = changes.length > 0;
                const isOpen = !!expanded[d.domainId];
                const domain = domainById.get(d.domainId);
                return (
                  <Fragment key={d.domainId}>
                    <tr
                      className={`hover:bg-slate-50/60 transition-colors ${
                        d.scopeChanged ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      <td className="px-2 py-2.5 align-top">
                        {isExpandable ? (
                          <button
                            type="button"
                            onClick={() => toggleExpand(d.domainId)}
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded"
                            aria-expanded={isOpen}
                            aria-label={isOpen ? 'Collapse changes' : 'Expand changes'}
                            title={isOpen ? 'Collapse changes' : 'Expand changes'}
                          >
                            {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </button>
                        ) : (
                          <span className="inline-block w-[22px]" aria-hidden="true" />
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-block px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">
                            {d.nickname}
                          </span>
                          <span className="text-xs text-slate-500 truncate max-w-[14rem]">
                            {d.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600 tabular-nums w-12">
                            {d.aPct}%
                          </span>
                          <div className="flex-1 min-w-[80px]">
                            <ProgressBar score={d.aScore} max={d.aMax} showLabel={false} />
                          </div>
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            {d.aScore}/{d.aMax}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-600 tabular-nums w-12">
                            {d.bPct}%
                          </span>
                          <div className="flex-1 min-w-[80px]">
                            <ProgressBar score={d.bScore} max={d.bMax} showLabel={false} />
                          </div>
                          <span className="text-[10px] text-slate-400 tabular-nums">
                            {d.bScore}/{d.bMax}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <DeltaPill value={d.deltaPts} />
                      </td>
                      <td className="px-3 py-2.5 text-center">
                        <DeltaPill value={d.deltaPct} suffix="%" />
                      </td>
                      <td className="px-3 py-2.5 text-center text-xs">
                        {d.scopeChanged ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold ring-1 ring-inset bg-amber-50 text-amber-700 ring-amber-200">
                            {d.aInUse ? 'in→out' : 'out→in'}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                    </tr>
                    {isExpandable && isOpen && (
                      <tr className="bg-slate-50/40">
                        <td className="px-2 py-3 align-top" />
                        <td colSpan={6} className="px-3 py-3">
                          <div className="space-y-2">
                            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                              {summarizeChanges(changes)}
                              {domain && (
                                <span className="ml-2 font-normal normal-case text-slate-400 tracking-normal">
                                  · <Link
                                    to={`/domain/${domain.id}`}
                                    className="text-brand-600 hover:underline"
                                  >
                                    Open {domain.nickname}
                                  </Link>
                                </span>
                              )}
                            </div>
                            <div className="overflow-x-auto border border-slate-200 rounded-lg bg-white">
                              <table className="w-full text-xs">
                                <thead className="bg-slate-50 border-b border-slate-200">
                                  <tr>
                                    <th className="text-left px-2.5 py-1.5 font-semibold text-slate-500 uppercase tracking-wide w-44">
                                      Section
                                    </th>
                                    <th className="text-left px-2.5 py-1.5 font-semibold text-slate-500 uppercase tracking-wide">
                                      Objective
                                    </th>
                                    <th className="text-center px-2.5 py-1.5 font-semibold text-slate-500 uppercase tracking-wide w-14">
                                      A
                                    </th>
                                    <th className="text-center px-2.5 py-1.5 font-semibold text-slate-500 uppercase tracking-wide w-14">
                                      B
                                    </th>
                                    <th className="text-center px-2.5 py-1.5 font-semibold text-slate-500 uppercase tracking-wide w-32">
                                      Change
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {changes.map((c) => (
                                    <tr key={c.objectiveId} className="hover:bg-slate-50/60">
                                      <td className="px-2.5 py-1.5 align-top">
                                        <div className="flex items-center gap-1.5">
                                          <MaturityChip level={c.maturityLevel} />
                                          <span className="text-slate-600 truncate max-w-[10rem]" title={c.sectionName}>
                                            {c.sectionName}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-2.5 py-1.5 align-top">
                                        <p className="text-slate-700 line-clamp-2" title={c.text}>
                                          <span className="text-slate-400 tabular-nums mr-1">
                                            {c.objectiveId}
                                          </span>
                                          {c.text}
                                        </p>
                                      </td>
                                      <td className="px-2.5 py-1.5 text-center align-top">
                                        <ScoreCell score={c.aScore} isNA={c.aIsNA} />
                                      </td>
                                      <td className="px-2.5 py-1.5 text-center align-top">
                                        <ScoreCell score={c.bScore} isNA={c.bIsNA} />
                                      </td>
                                      <td className="px-2.5 py-1.5 text-center align-top">
                                        <ChangeBadge kind={c.kind} delta={c.delta} />
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
        {sortedDiffs.length === 0 && (
          <div className="p-8 text-center text-sm text-slate-400">No data to compare.</div>
        )}
      </div>
    </div>
  );
}
