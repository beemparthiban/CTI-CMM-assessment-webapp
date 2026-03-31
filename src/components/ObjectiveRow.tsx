import { memo } from 'react';
import type { Objective, ObjectiveResponse, ImpactLOE } from '../types';
import { getStatus, getStatusColor, computePriority } from '../store/useAssessmentStore';
import ScoreSelector from './ScoreSelector';
import MaturityBadge from './MaturityBadge';

interface Props {
  objective: Objective;
  response: ObjectiveResponse;
  onUpdate: (partial: Partial<ObjectiveResponse>) => void;
  showPlanningFields: boolean;
}

const priorityColors: Record<string, string> = {
  P1: 'bg-rose-50 text-rose-700 ring-rose-200',
  P2: 'bg-amber-50 text-amber-700 ring-amber-200',
  P3: 'bg-sky-50 text-sky-700 ring-sky-200',
  P4: 'bg-slate-100 text-slate-600 ring-slate-200',
  Unset: 'bg-slate-50 text-slate-400 ring-slate-200 border-dashed',
};

const targetLevels = [
  { label: '0', score: 0, active: 'bg-rose-600 text-white shadow-sm', inactive: 'border-slate-300 text-slate-600 hover:border-rose-400 hover:bg-rose-50' },
  { label: '1', score: 1, active: 'bg-amber-500 text-white shadow-sm', inactive: 'border-slate-300 text-slate-600 hover:border-amber-400 hover:bg-amber-50' },
  { label: '2', score: 2, active: 'bg-sky-500 text-white shadow-sm', inactive: 'border-slate-300 text-slate-600 hover:border-sky-400 hover:bg-sky-50' },
  { label: '3', score: 3, active: 'bg-emerald-600 text-white shadow-sm', inactive: 'border-slate-300 text-slate-600 hover:border-emerald-400 hover:bg-emerald-50' },
];

function ObjectiveRow({ objective, response, onUpdate, showPlanningFields }: Props) {
  const status = getStatus(response.score, response.isNA);
  const statusColor = getStatusColor(status);
  const priority = computePriority(response.estImpact, response.estLOE);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-start gap-2.5">
        <MaturityBadge level={objective.maturityLevel} />
        <p className="text-sm text-slate-700 leading-relaxed flex-1">{objective.text}</p>
      </div>

      {/* Score and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Score:</span>
          <ScoreSelector
            value={response.score}
            isNA={response.isNA}
            onChange={(score, isNA) => onUpdate({ score, isNA })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Status:</span>
          <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${statusColor}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Evidence, POC, Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">Evidence</label>
          <input
            type="text"
            value={response.evidence}
            onChange={(e) => onUpdate({ evidence: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 focus:border-brand-400 bg-slate-50 placeholder:text-slate-400 transition-colors"
            placeholder="Evidence..."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 mb-1.5">POC</label>
          <input
            type="text"
            value={response.poc}
            onChange={(e) => onUpdate({ poc: e.target.value })}
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 focus:border-brand-400 bg-slate-50 placeholder:text-slate-400 transition-colors"
            placeholder="Point of contact..."
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-semibold text-slate-500 mb-1.5">Notes</label>
        <textarea
          value={response.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          rows={2}
          className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 focus:border-brand-400 bg-slate-50 placeholder:text-slate-400 resize-none transition-colors"
          placeholder="Additional notes..."
        />
      </div>

      {/* Planning Fields */}
      {showPlanningFields && (
        <div className="border-t border-slate-100 pt-4 space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Planning</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Target Score */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Target Score</label>
              <div className="flex gap-1">
                {targetLevels.map((level) => {
                  const isActive = response.targetScore === level.score;
                  return (
                    <button
                      key={level.score}
                      type="button"
                      onClick={() =>
                        onUpdate({
                          targetScore: isActive ? null : level.score,
                        })
                      }
                      className={`px-2 py-0.5 rounded-md text-xs font-semibold border transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-1 ${
                        isActive ? level.active : `bg-white ${level.inactive}`
                      }`}
                      aria-pressed={isActive}
                    >
                      {level.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Est. Impact */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Est. Impact</label>
              <select
                value={response.estImpact}
                onChange={(e) => onUpdate({ estImpact: e.target.value as ImpactLOE })}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-400 bg-slate-50 transition-colors"
              >
                <option value="">--</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Est. LOE */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Est. LOE</label>
              <select
                value={response.estLOE}
                onChange={(e) => onUpdate({ estLOE: e.target.value as ImpactLOE })}
                className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-400 bg-slate-50 transition-colors"
              >
                <option value="">--</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5">Priority</label>
              <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-semibold ring-1 ring-inset ${priorityColors[priority]}`}>
                {priority}
              </span>
            </div>
          </div>

          {/* Target Date */}
          <div className="max-w-xs">
            <label className="block text-xs font-semibold text-slate-500 mb-1.5">Target Date</label>
            <input
              type="date"
              value={response.targetDate}
              onChange={(e) => onUpdate({ targetDate: e.target.value })}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-400 bg-slate-50 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ObjectiveRow);
