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
  if (pct >= 75) return { label: 'CTI3 — Fully Implemented', color: 'text-emerald-600' };
  if (pct >= 50) return { label: 'CTI2 — Largely Implemented', color: 'text-sky-600' };
  if (pct >= 25) return { label: 'CTI1 — Partial Implementation', color: 'text-amber-600' };
  return { label: 'CTI0 — No Capability', color: 'text-rose-600' };
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
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
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
                  className="text-2xl font-bold text-slate-900 border-b-2 border-brand-400 focus:outline-none bg-transparent"
                  autoFocus
                />
              ) : (
                <h1
                  className="text-2xl font-bold text-slate-900 cursor-pointer hover:text-brand-600 transition-colors"
                  onClick={() => setEditingName(true)}
                  title="Click to edit"
                >
                  {state.assessmentName}
                </h1>
              )}
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200 uppercase tracking-wide">
                v1.3
              </span>
            </div>
            <p className="text-sm text-slate-500">
              Cyber Threat Intelligence Capability Maturity Model
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-baseline gap-1 justify-end">
              <span className="text-4xl font-bold text-slate-900 tabular-nums">{overall.score}</span>
              <span className="text-lg text-slate-400">/ {overall.max}</span>
            </div>
            <div className="flex items-center gap-2 justify-end mt-1">
              <span className={`text-2xl font-bold tabular-nums ${getPctColor(overall.pct)}`}>
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
        <div className="bg-brand-50 border border-brand-200 rounded-xl p-8 text-center">
          <h2 className="text-lg font-semibold text-brand-900 mb-2">Start Your Assessment</h2>
          <p className="text-sm text-brand-700/80 mb-5">
            Begin scoring objectives to see your maturity profile. Click on any domain to get started.
          </p>
          <button
            onClick={() => navigate('/domain/1')}
            className="px-5 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 text-sm font-semibold shadow-sm transition-colors"
          >
            Start with Domain 1 — ASSET
          </button>
        </div>
      )}

      {/* Charts */}
      {hasAnyScores && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Maturity Radar</h2>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="domain" tick={{ fontSize: 11 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar
                  dataKey="value"
                  stroke="rgb(99, 102, 241)"
                  fill="rgba(99, 102, 241, 0.15)"
                  fillOpacity={0.6}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Domain Scores</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={barData} layout="vertical" margin={{ left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 'dataMax']} />
                <YAxis type="category" dataKey="name" width={90} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="max" fill="#e2e8f0" radius={[0, 4, 4, 0]} />
                <Bar dataKey="score" fill="rgb(99, 102, 241)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Domain table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">#</th>
                <th className="text-left px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Domain</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Score</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">Max</th>
                <th className="text-right px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">%</th>
                <th className="text-center px-4 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wide">In Use</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {domainScores.map(({ domain, score, max, pct, inUse }) => (
                <tr
                  key={domain.id}
                  className="hover:bg-slate-50/60 cursor-pointer transition-colors"
                  onClick={() => handleNavigate(domain.id)}
                >
                  <td className="px-4 py-3 text-slate-400 font-medium">{domain.id}</td>
                  <td className="px-4 py-3">
                    <span className="font-semibold text-slate-800">{domain.nickname}</span>
                    <span className="text-slate-400 ml-2 hidden sm:inline">{domain.name}</span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums font-medium">{score}</td>
                  <td className="px-4 py-3 text-right font-mono tabular-nums text-slate-400">{max}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${getPctColor(pct)}`}>
                    {pct}%
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={inUse}
                      onChange={() => setDomainInUse(domain.id, !inUse)}
                      className="rounded border-slate-300 text-brand-600 focus:ring-brand-500 h-4 w-4"
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
