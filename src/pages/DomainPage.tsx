import { useState, useCallback, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import domainsData from '../data/domains.json';
import type { Domain, ObjectiveResponse } from '../types';
import { useAssessment } from '../store/AssessmentContext';
import ObjectiveRow from '../components/ObjectiveRow';
import ProgressBar from '../components/ProgressBar';

const domains = domainsData.domains as Domain[];

export default function DomainPage() {
  const { domainId } = useParams<{ domainId: string }>();
  const id = Number(domainId);
  const domain = useMemo(() => domains.find((d) => d.id === id), [id]);

  const [tab, setTab] = useState<'assessment' | 'planning'>('assessment');
  const showPlanning = tab === 'planning';
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = useCallback((sectionId: string) => {
    setCollapsedSections((prev) => ({ ...prev, [sectionId]: !prev[sectionId] }));
  }, []);

  const { state, getResponse, updateResponse, getDomainScore, getSectionScore, setDomainInUse } =
    useAssessment();

  const handleUpdate = useCallback(
    (objectiveId: string) => (partial: Partial<ObjectiveResponse>) => {
      updateResponse(objectiveId, partial);
    },
    [updateResponse]
  );

  if (!domain) return <Navigate to="/dashboard" replace />;

  const { score, max, pct } = getDomainScore(domain);
  const inUse = state.domainInUse[domain.id] !== false;

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200">
                Domain {domain.id}
              </span>
              <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200">
                {domain.nickname}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-2">{domain.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold tabular-nums">{score}</span>
                <span className="text-sm text-slate-400">/ {max}</span>
              </div>
              <span className="text-sm font-semibold text-slate-500 tabular-nums">{pct}%</span>
            </div>
            <label className="flex items-center gap-2">
              <span className="text-sm text-slate-500 font-medium">In Use</span>
              <input
                type="checkbox"
                checked={inUse}
                onChange={() => setDomainInUse(domain.id, !inUse)}
                className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
                aria-label="Toggle domain in use"
              />
            </label>
          </div>
        </div>
        <ProgressBar score={score} max={max} />

        {/* Tabs */}
        <div className="flex gap-1 mt-4 border-b border-slate-200">
          <button
            onClick={() => setTab('assessment')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === 'assessment'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Assessment
          </button>
          <button
            onClick={() => setTab('planning')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              tab === 'planning'
                ? 'border-brand-600 text-brand-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Planning
          </button>
        </div>
      </div>

      {/* Sections */}
      {domain.sections.map((section) => {
        const secScore = getSectionScore(section);
        const isCollapsed = collapsedSections[section.id] ?? false;
        return (
          <div key={section.id} className="space-y-3">
            {/* Section header — clickable to collapse */}
            <button
              type="button"
              onClick={() => toggleSection(section.id)}
              className="sticky top-0 z-10 w-full bg-slate-50/95 backdrop-blur-sm border border-slate-200 rounded-xl px-5 py-3 flex items-center gap-3 shadow-sm cursor-pointer hover:bg-slate-100/80 transition-colors text-left"
              aria-expanded={!isCollapsed}
            >
              <ChevronDown
                size={16}
                className={`text-slate-400 shrink-0 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : ''}`}
              />
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-bold text-slate-700">{section.name}</h2>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-semibold text-slate-500 tabular-nums">
                  {secScore.score} / {secScore.max}
                </span>
                <div className="w-32">
                  <ProgressBar score={secScore.score} max={secScore.max} />
                </div>
              </div>
            </button>

            {/* Objectives — collapsible */}
            {!isCollapsed && section.objectives.map((obj) => (
              <ObjectiveRow
                key={obj.id}
                objective={obj}
                response={getResponse(obj.id)}
                onUpdate={handleUpdate(obj.id)}
                showPlanningFields={showPlanning}
              />
            ))}
          </div>
        );
      })}
    </div>
  );
}
