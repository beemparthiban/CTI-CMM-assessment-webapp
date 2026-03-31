import { useState, useEffect, useCallback, useMemo } from 'react';
import type { AssessmentState, ObjectiveResponse, Domain, ImpactLOE, Priority } from '../types';
import domainsData from '../data/domains.json';

const STORAGE_KEY = 'cti-cmm-assessment-v1';

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
    case 'Not Implemented': return 'bg-red-100 text-red-800';
    case 'Partially Implemented': return 'bg-orange-100 text-orange-800';
    case 'Largely Implemented': return 'bg-yellow-100 text-yellow-800';
    case 'Fully Implemented': return 'bg-green-100 text-green-800';
    case 'N/A': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export function useAssessmentStore() {
  const [state, setState] = useState<AssessmentState>(loadState);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

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
      return { score, max, pct: max > 0 ? Math.round((score / max) * 100) : 0 };
    },
    [state.responses]
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
    let score = 0;
    let max = 0;
    for (const domain of domainsData.domains) {
      if (!state.domainInUse[domain.id]) continue;
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
    }
    return { score, max, pct: max > 0 ? Math.round((score / max) * 100) : 0 };
  }, [state.responses, state.domainInUse]);

  const resetAll = useCallback(() => {
    const fresh = createInitialState();
    setState(fresh);
  }, []);

  const exportJSON = useCallback((): string => {
    return JSON.stringify(state, null, 2);
  }, [state]);

  const importJSON = useCallback((json: string) => {
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed.responses === 'object') {
      setState(parsed as AssessmentState);
    } else {
      throw new Error('Invalid assessment data');
    }
  }, []);

  return {
    state,
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
  };
}
