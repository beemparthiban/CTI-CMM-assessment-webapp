import { useState, useCallback, useMemo } from 'react';
import { useParams, Navigate } from 'react-router-dom';
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
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-800">
                Domain {domain.id}
              </span>
              <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 text-gray-700">
                {domain.nickname}
              </span>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mt-1">{domain.name}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">{score}</span>
                <span className="text-sm text-gray-500">/ {max}</span>
              </div>
              <span className="text-sm font-medium text-gray-500">{pct}%</span>
            </div>
            <label className="flex items-center gap-2">
              <span className="text-sm text-gray-600">In Use</span>
              <input
                type="checkbox"
                checked={inUse}
                onChange={() => setDomainInUse(domain.id, !inUse)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                aria-label="Toggle domain in use"
              />
            </label>
          </div>
        </div>
        <ProgressBar score={score} max={max} />

        {/* Tabs */}
        <div className="flex gap-1 mt-4 border-b border-gray-200">
          <button
            onClick={() => setTab('assessment')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === 'assessment'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Assessment
          </button>
          <button
            onClick={() => setTab('planning')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors -mb-px ${
              tab === 'planning'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Planning
          </button>
        </div>
      </div>

      {/* Sections */}
      {domain.sections.map((section) => {
        const secScore = getSectionScore(section);
        return (
          <div key={section.id} className="space-y-2">
            {/* Section header */}
            <div className="sticky top-0 z-10 bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-gray-800">{section.name}</h2>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-sm font-medium text-gray-600">
                  {secScore.score} / {secScore.max}
                </span>
                <div className="w-32">
                  <ProgressBar score={secScore.score} max={secScore.max} />
                </div>
              </div>
            </div>

            {/* Objectives */}
            {section.objectives.map((obj) => (
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
