import { useMemo, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';
import domainsData from '../data/domains.json';
import type { Domain } from '../types';
import { useAssessment } from '../store/AssessmentContext';
import DomainCard from '../components/DomainCard';
import ProgressBar, { getPctColor } from '../components/ProgressBar';

const domains = domainsData.domains as Domain[];

function getMaturityTier(pct: number): { label: string; color: string } {
  if (pct >= 75) return { label: 'CTI3 — Fully Implemented', color: 'text-green-600' };
  if (pct >= 50) return { label: 'CTI2 — Largely Implemented', color: 'text-yellow-600' };
  if (pct >= 25) return { label: 'CTI1 — Partial Implementation', color: 'text-orange-500' };
  return { label: 'CTI0 — No Capability', color: 'text-red-500' };
}

export default function Dashboard() {
  const navigate = useNavigate();
  const {
    state,
    getDomainScore,
    getOverallScore,
    setDomainInUse,
    setAssessmentName,
  } = useAssessment();

  const [editingName, setEditingName] = useState(false);

  const domainScores = useMemo(() => {
    return domains.map((d) => ({
      domain: d,
      ...getDomainScore(d),
      inUse: state.domainInUse[d.id] !== false,
    }));
  }, [getDomainScore, state.domainInUse]);

  const overall = getOverallScore;
  const tier = getMaturityTier(overall.pct);

  const radarData = useMemo(() => {
    return domainScores
      .filter((d) => d.inUse)
      .map((d) => ({
        domain: d.domain.nickname,
        value: d.pct,
        fullMark: 100,
      }));
  }, [domainScores]);

  const barData = useMemo(() => {
    return domainScores
      .filter((d) => d.inUse)
      .map((d) => ({
        name: d.domain.nickname,
        score: d.score,
        max: d.max,
        pct: d.pct,
      }));
  }, [domainScores]);

  const handleNavigate = useCallback(
    (domainId: number) => navigate(`/domain/${domainId}`),
    [navigate]
  );

  const hasAnyScores = Object.values(state.responses).some(
    (r) => r.score !== null || r.isNA
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {editingName ? (
                <input
                  type="text"
                  value={state.assessmentName}
                  onChange={(e) => setAssessmentName(e.target.value)}
                  onBlur={() => setEditingName(false)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingName(false)}
                  className="text-2xl font-bold text-gray-900 border-b-2 border-blue-400 focus:outline-none bg-transparent"
                  autoFocus
                />
              ) : (
                <h1
                  className="text-2xl font-bold text-gray-900 cursor-pointer hover:text-blue-600"
                  onClick={() => setEditingName(true)}
                  title="Click to edit"
                >
                  {state.assessmentName}
                </h1>
              )}
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                v1.3
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Cyber Threat Intelligence Capability Maturity Model
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-4xl font-bold text-gray-900">{overall.score}</span>
              <span className="text-lg text-gray-500">/ {overall.max}</span>
            </div>
            <div className="flex items-center gap-2 justify-end mt-1">
              <span className={`text-2xl font-bold ${getPctColor(overall.pct)}`}>
                {overall.pct}%
              </span>
            </div>
            <p className={`text-sm font-semibold mt-1 ${tier.color}`}>{tier.label}</p>
          </div>
        </div>
        <ProgressBar score={overall.score} max={overall.max} />
      </div>

      {/* Empty state */}
      {!hasAnyScores && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">Start Your Assessment</h2>
          <p className="text-sm text-blue-700 mb-4">
            Begin scoring objectives to see your maturity profile. Click on any domain to get started.
          </p>
          <button
            onClick={() => navigate('/domain/1')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
          >
            Start with Domain 1 — ASSET
          </button>
        </div>
      )}

      {/* Charts */}
      {hasAnyScores && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Maturity Radar</h2>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  dataKey="value"
                  stroke="rgb(59, 130, 246)"
                  fill="rgba(59, 130, 246, 0.3)"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Domain Scores</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 'dataMax']} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="max" fill="#e5e7eb" radius={[0, 4, 4, 0]} />
                <Bar dataKey="score" fill="rgb(59, 130, 246)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Domain table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">#</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Domain</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Score</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">Max</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">%</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600">In Use</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {domainScores.map(({ domain, score, max, pct, inUse }) => (
                <tr
                  key={domain.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleNavigate(domain.id)}
                >
                  <td className="px-4 py-3 text-gray-500">{domain.id}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-gray-900">{domain.nickname}</span>
                    <span className="text-gray-500 ml-2 hidden sm:inline">{domain.name}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono">{score}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-500">{max}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${getPctColor(pct)}`}>
                    {pct}%
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={inUse}
                      onChange={() => setDomainInUse(domain.id, !inUse)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      aria-label={`Toggle ${domain.nickname} in use`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Domain Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {domainScores.map(({ domain, score, max, pct, inUse }) => (
          <DomainCard
            key={domain.id}
            domain={domain}
            score={score}
            max={max}
            pct={pct}
            inUse={inUse}
            onToggleInUse={() => setDomainInUse(domain.id, !inUse)}
            onClick={() => handleNavigate(domain.id)}
          />
        ))}
      </div>
    </div>
  );
}
