import { useState, useEffect, useCallback, useMemo } from 'react';
import type {
  AssessmentState,
  ObjectiveResponse,
  Domain,
  ImpactLOE,
  Priority,
  Snapshot,
  DomainDiff,
  OverallDiff,
} from '../types';
import domainsData from '../data/domains.json';

const STORAGE_KEY = 'cti-cmm-assessment-v1';
const SNAPSHOTS_KEY = 'cti-cmm-snapshots-v1';

const defaultResponse: ObjectiveResponse = {
  score: null,
  isNA: false,
  evidence: '',
  poc: '',
  notes: '',
  targetScore: null,
  estImpact: '',
  estLOE: '',
  targetDate: '',
};

function createInitialState(): AssessmentState {
  const domainInUse: Record<number, boolean> = {};
  const dateLastAssessed: Record<number, string> = {};
  for (const d of domainsData.domains) {
    domainInUse[d.id] = true;
    dateLastAssessed[d.id] = '';
  }
  return {
    responses: {},
    domainInUse,
    dateLastAssessed,
    assessmentName: 'CTI-CMM Assessment',
  };
}

function loadState(): AssessmentState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.responses === 'object') {
        // Merge with initial state to ensure new domains are covered
        const initial = createInitialState();
        return {
          ...initial,
          ...parsed,
          domainInUse: { ...initial.domainInUse, ...parsed.domainInUse },
          dateLastAssessed: { ...initial.dateLastAssessed, ...parsed.dateLastAssessed },
        };
      }
    }
  } catch {
    // ignore
  }
  return createInitialState();
}

function isAssessmentStateLike(value: unknown): value is AssessmentState {
  return (
    !!value &&
    typeof value === 'object' &&
    typeof (value as { responses?: unknown }).responses === 'object'
  );
}

function isSnapshotLike(value: unknown): value is Snapshot {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<Snapshot>;
  return (
    typeof s.id === 'string' &&
    typeof s.label === 'string' &&
    typeof s.createdAt === 'string' &&
    isAssessmentStateLike(s.state)
  );
}

function loadSnapshots(): Snapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(isSnapshotLike);
      }
    }
  } catch {
    // ignore
  }
  return [];
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `snap-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function defaultSnapshotLabel(date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `Snapshot ${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function deepCloneState(s: AssessmentState): AssessmentState {
  // Snapshots must be immutable copies; JSON round-trip is safe for our plain-data shape.
  return JSON.parse(JSON.stringify(s)) as AssessmentState;
}

export function computePriority(impact: ImpactLOE, loe: ImpactLOE): Priority {
  if (!impact || !loe) return 'Unset';
  const matrix: Record<string, Priority> = {
    'High-Low': 'P1',
    'High-Medium': 'P2',
    'Medium-Low': 'P2',
    'High-High': 'P3',
    'Medium-Medium': 'P3',
    'Low-Low': 'P3',
    'Medium-High': 'P4',
    'Low-Medium': 'P4',
    'Low-High': 'P4',
  };
  return matrix[`${impact}-${loe}`] ?? 'Unset';
}

export function getStatus(score: number | null, isNA: boolean): string {
  if (isNA) return 'N/A';
  if (score === null || score === 0) return 'Not Implemented';
  if (score === 1) return 'Partially Implemented';
  if (score === 2) return 'Largely Implemented';
  return 'Fully Implemented';
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'Not Implemented': return 'bg-rose-50 text-rose-700 ring-rose-200';
    case 'Partially Implemented': return 'bg-amber-50 text-amber-700 ring-amber-200';
    case 'Largely Implemented': return 'bg-sky-50 text-sky-700 ring-sky-200';
    case 'Fully Implemented': return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'N/A': return 'bg-slate-100 text-slate-500 ring-slate-200';
    default: return 'bg-slate-100 text-slate-500 ring-slate-200';
  }
}

/**
 * Pure scoring helper that works against any AssessmentState (live or snapshot).
 */
export function scoreAssessmentForDomain(
  state: AssessmentState,
  domain: Domain
): { score: number; max: number; pct: number; inUse: boolean } {
  let score = 0;
  let max = 0;
  for (const section of domain.sections) {
    for (const obj of section.objectives) {
      const resp = state.responses[obj.id];
      if (resp?.isNA) continue;
      max += obj.maxScore;
      if (resp?.score != null) {
        score += resp.score;
      }
    }
  }
  return {
    score,
    max,
    pct: max > 0 ? Math.round((score / max) * 100) : 0,
    inUse: state.domainInUse?.[domain.id] !== false,
  };
}

/**
 * Pure overall score across all domains marked "in use".
 */
export function scoreAssessmentOverall(
  state: AssessmentState,
  domains: Domain[]
): { score: number; max: number; pct: number } {
  let score = 0;
  let max = 0;
  for (const domain of domains) {
    if (state.domainInUse?.[domain.id] === false) continue;
    const ds = scoreAssessmentForDomain(state, domain);
    score += ds.score;
    max += ds.max;
  }
  return { score, max, pct: max > 0 ? Math.round((score / max) * 100) : 0 };
}

/**
 * Count number of objectives that have been scored (non-null score or marked N/A).
 */
export function countScoredObjectives(state: AssessmentState, domains: Domain[]): { scored: number; total: number } {
  let scored = 0;
  let total = 0;
  for (const domain of domains) {
    for (const section of domain.sections) {
      for (const obj of section.objectives) {
        total += 1;
        const resp = state.responses[obj.id];
        if (resp && (resp.isNA || resp.score != null)) scored += 1;
      }
    }
  }
  return { scored, total };
}

/**
 * Produce a per-domain diff between two assessment states.
 * Conventionally A = earlier / baseline, B = later / current.
 */
export function diffSnapshots(a: AssessmentState, b: AssessmentState, domains: Domain[]): DomainDiff[] {
  return domains.map((domain) => {
    const aS = scoreAssessmentForDomain(a, domain);
    const bS = scoreAssessmentForDomain(b, domain);
    return {
      domainId: domain.id,
      name: domain.name,
      nickname: domain.nickname,
      aScore: aS.score,
      aMax: aS.max,
      aPct: aS.pct,
      aInUse: aS.inUse,
      bScore: bS.score,
      bMax: bS.max,
      bPct: bS.pct,
      bInUse: bS.inUse,
      deltaPts: bS.score - aS.score,
      deltaPct: bS.pct - aS.pct,
      scopeChanged: aS.inUse !== bS.inUse,
    };
  });
}

export type ObjectiveChangeKind =
  | 'improved'
  | 'regressed'
  | 'newly-scored'
  | 'unscored'
  | 'became-na'
  | 'left-na';

export interface ObjectiveChange {
  objectiveId: string;
  sectionName: string;
  maturityLevel: string;
  text: string;
  aScore: number | null;
  bScore: number | null;
  aIsNA: boolean;
  bIsNA: boolean;
  delta: number; // numeric delta when both sides have a score; 0 otherwise
  kind: ObjectiveChangeKind;
}

const MATURITY_ORDER: Record<string, number> = {
  CTI0: 0,
  CTI1: 1,
  CTI2: 2,
  CTI3: 3,
};

function classifyChange(
  aScore: number | null,
  aIsNA: boolean,
  bScore: number | null,
  bIsNA: boolean
): ObjectiveChangeKind | null {
  // Treat unset score (null) as "not scored"
  const aHas = !aIsNA && aScore != null;
  const bHas = !bIsNA && bScore != null;

  // N/A transitions
  if (!aIsNA && bIsNA) return 'became-na';
  if (aIsNA && !bIsNA) return 'left-na';

  // Newly scored / unscored
  if (!aHas && bHas) return 'newly-scored';
  if (aHas && !bHas) return 'unscored';

  // Score moved
  if (aHas && bHas) {
    if (bScore! > aScore!) return 'improved';
    if (bScore! < aScore!) return 'regressed';
    return null; // identical
  }

  // Both unscored or both N/A — no meaningful change
  return null;
}

/**
 * Produce a per-objective change list for a single domain between two states.
 * Returns only objectives whose (score, isNA) tuple differs.
 * Sorted by maturity level → section order → objective id.
 */
export function diffDomainObjectives(
  a: AssessmentState,
  b: AssessmentState,
  domain: Domain
): ObjectiveChange[] {
  const changes: ObjectiveChange[] = [];
  for (let si = 0; si < domain.sections.length; si++) {
    const section = domain.sections[si];
    for (const obj of section.objectives) {
      const aResp = a.responses[obj.id];
      const bResp = b.responses[obj.id];
      const aScore = aResp?.score ?? null;
      const bScore = bResp?.score ?? null;
      const aIsNA = !!aResp?.isNA;
      const bIsNA = !!bResp?.isNA;
      const kind = classifyChange(aScore, aIsNA, bScore, bIsNA);
      if (!kind) continue;

      const delta =
        !aIsNA && !bIsNA && aScore != null && bScore != null ? bScore - aScore : 0;

      changes.push({
        objectiveId: obj.id,
        sectionName: section.name,
        maturityLevel: obj.maturityLevel,
        text: obj.text,
        aScore,
        bScore,
        aIsNA,
        bIsNA,
        delta,
        kind,
      });
    }
  }
  // Stable sort: maturity → section index (preserved by lookup) → objective id
  const sectionIndex = new Map<string, number>();
  domain.sections.forEach((s, i) => sectionIndex.set(s.name, i));
  changes.sort((x, y) => {
    const mx = MATURITY_ORDER[x.maturityLevel] ?? 99;
    const my = MATURITY_ORDER[y.maturityLevel] ?? 99;
    if (mx !== my) return mx - my;
    const sx = sectionIndex.get(x.sectionName) ?? 99;
    const sy = sectionIndex.get(y.sectionName) ?? 99;
    if (sx !== sy) return sx - sy;
    return x.objectiveId.localeCompare(y.objectiveId);
  });
  return changes;
}

/**
 * Roll up an overall diff between two states (only counting domains in use in either side).
 */
export function diffOverall(a: AssessmentState, b: AssessmentState, domains: Domain[]): OverallDiff {
  const aOverall = scoreAssessmentOverall(a, domains);
  const bOverall = scoreAssessmentOverall(b, domains);
  return {
    aScore: aOverall.score,
    aMax: aOverall.max,
    aPct: aOverall.pct,
    bScore: bOverall.score,
    bMax: bOverall.max,
    bPct: bOverall.pct,
    deltaPts: bOverall.score - aOverall.score,
    deltaPct: bOverall.pct - aOverall.pct,
  };
}

export function useAssessmentStore() {
  const [state, setState] = useState<AssessmentState>(loadState);
  const [snapshots, setSnapshots] = useState<Snapshot[]>(loadSnapshots);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem(SNAPSHOTS_KEY, JSON.stringify(snapshots));
  }, [snapshots]);

  const getResponse = useCallback(
    (objectiveId: string): ObjectiveResponse => {
      return state.responses[objectiveId] ?? { ...defaultResponse };
    },
    [state.responses]
  );

  const updateResponse = useCallback(
    (objectiveId: string, partial: Partial<ObjectiveResponse>) => {
      setState((prev) => ({
        ...prev,
        responses: {
          ...prev.responses,
          [objectiveId]: {
            ...(prev.responses[objectiveId] ?? { ...defaultResponse }),
            ...partial,
          },
        },
      }));
    },
    []
  );

  const setDomainInUse = useCallback((domainId: number, inUse: boolean) => {
    setState((prev) => ({
      ...prev,
      domainInUse: { ...prev.domainInUse, [domainId]: inUse },
    }));
  }, []);

  const setAssessmentName = useCallback((name: string) => {
    setState((prev) => ({ ...prev, assessmentName: name }));
  }, []);

  const getDomainScore = useCallback(
    (domain: Domain): { score: number; max: number; pct: number } => {
      const r = scoreAssessmentForDomain(state, domain);
      return { score: r.score, max: r.max, pct: r.pct };
    },
    [state]
  );

  const getSectionScore = useCallback(
    (section: { objectives: { id: string; maxScore: number }[] }): { score: number; max: number; pct: number } => {
      let score = 0;
      let max = 0;
      for (const obj of section.objectives) {
        const resp = state.responses[obj.id];
        if (resp?.isNA) continue;
        max += obj.maxScore;
        if (resp?.score != null) {
          score += resp.score;
        }
      }
      return { score, max, pct: max > 0 ? Math.round((score / max) * 100) : 0 };
    },
    [state.responses]
  );

  const getOverallScore = useMemo(() => {
    return scoreAssessmentOverall(state, domainsData.domains as Domain[]);
  }, [state]);

  const resetAll = useCallback(() => {
    const fresh = createInitialState();
    setState(fresh);
  }, []);

  // ---------- Snapshots ----------

  const createSnapshot = useCallback(
    (label?: string): Snapshot => {
      const snap: Snapshot = {
        id: generateId(),
        label: (label && label.trim()) || defaultSnapshotLabel(),
        createdAt: new Date().toISOString(),
        state: deepCloneState(state),
      };
      setSnapshots((prev) => [snap, ...prev]);
      return snap;
    },
    [state]
  );

  const renameSnapshot = useCallback((id: string, label: string) => {
    setSnapshots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, label: label.trim() || s.label } : s))
    );
  }, []);

  const deleteSnapshot = useCallback((id: string) => {
    setSnapshots((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const getSnapshot = useCallback(
    (id: string): Snapshot | undefined => snapshots.find((s) => s.id === id),
    [snapshots]
  );

  // ---------- Import / Export ----------

  const exportJSON = useCallback((): string => {
    return JSON.stringify({ ...state, snapshots }, null, 2);
  }, [state, snapshots]);

  const importJSON = useCallback((json: string) => {
    const parsed = JSON.parse(json);
    if (!isAssessmentStateLike(parsed)) {
      throw new Error('Invalid assessment data');
    }
    // Pull out snapshots (if any) before treating the rest as live state.
    const maybeSnaps = (parsed as unknown as { snapshots?: unknown }).snapshots;
    const incomingSnapshots: Snapshot[] = Array.isArray(maybeSnaps)
      ? (maybeSnaps.filter(isSnapshotLike) as Snapshot[])
      : [];

    const liveOnly: AssessmentState = {
      responses: parsed.responses,
      domainInUse: parsed.domainInUse ?? {},
      dateLastAssessed: parsed.dateLastAssessed ?? {},
      assessmentName: parsed.assessmentName ?? 'CTI-CMM Assessment',
    };
    setState(liveOnly);

    if (incomingSnapshots.length) {
      setSnapshots((prev) => {
        const byId = new Map<string, Snapshot>();
        // Existing snapshots take precedence on id collisions.
        for (const s of incomingSnapshots) byId.set(s.id, s);
        for (const s of prev) byId.set(s.id, s);
        // Sort newest-first by createdAt.
        return Array.from(byId.values()).sort((x, y) =>
          y.createdAt.localeCompare(x.createdAt)
        );
      });
    }
  }, []);

  return {
    state,
    snapshots,
    getResponse,
    updateResponse,
    setDomainInUse,
    setAssessmentName,
    getDomainScore,
    getSectionScore,
    getOverallScore,
    resetAll,
    exportJSON,
    importJSON,
    createSnapshot,
    renameSnapshot,
    deleteSnapshot,
    getSnapshot,
  };
}
