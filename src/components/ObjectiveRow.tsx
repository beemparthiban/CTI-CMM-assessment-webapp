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
  P1: 'bg-red-100 text-red-800 border-red-300',
  P2: 'bg-orange-100 text-orange-800 border-orange-300',
  P3: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  P4: 'bg-gray-100 text-gray-700 border-gray-300',
  Unset: 'bg-gray-50 text-gray-400 border-dashed border-gray-300',
};

const targetLevels = [
  { label: '0', score: 0, active: 'bg-red-500 text-white', inactive: 'border-red-400 text-red-600 hover:bg-red-50' },
  { label: '1', score: 1, active: 'bg-orange-400 text-white', inactive: 'border-orange-400 text-orange-600 hover:bg-orange-50' },
  { label: '2', score: 2, active: 'bg-yellow-400 text-white', inactive: 'border-yellow-400 text-yellow-700 hover:bg-yellow-50' },
  { label: '3', score: 3, active: 'bg-green-500 text-white', inactive: 'border-green-500 text-green-700 hover:bg-green-50' },
];

function ObjectiveRow({ objective, response, onUpdate, showPlanningFields }: Props) {
  const status = getStatus(response.score, response.isNA);
  const statusColor = getStatusColor(status);
  const priority = computePriority(response.estImpact, response.estLOE);

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-2">
        <MaturityBadge level={objective.maturityLevel} />
        <p className="text-sm text-gray-800 leading-snug flex-1">{objective.text}</p>
      </div>

      {/* Score and Status */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Score:</span>
          <ScoreSelector
            value={response.score}
            isNA={response.isNA}
            onChange={(score, isNA) => onUpdate({ score, isNA })}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">Status:</span>
          <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${statusColor}`}>
            {status}
          </span>
        </div>
      </div>

      {/* Evidence, POC, Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Evidence</label>
          <input
            type="text"
            value={response.evidence}
            onChange={(e) => onUpdate({ evidence: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            placeholder="Evidence..."
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">POC</label>
          <input
            type="text"
            value={response.poc}
            onChange={(e) => onUpdate({ poc: e.target.value })}
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400"
            placeholder="Point of contact..."
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">Notes</label>
        <textarea
          value={response.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          rows={2}
          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400 focus:border-blue-400 resize-none"
          placeholder="Additional notes..."
        />
      </div>

      {/* Planning Fields */}
      {showPlanningFields && (
        <div className="border-t border-gray-200 pt-3 space-y-3">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Planning</span>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Target Score */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Target Score</label>
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
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-blue-400 ${
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
              <label className="block text-xs font-medium text-gray-500 mb-1">Est. Impact</label>
              <select
                value={response.estImpact}
                onChange={(e) => onUpdate({ estImpact: e.target.value as ImpactLOE })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400"
              >
                <option value="">--</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Est. LOE */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Est. LOE</label>
              <select
                value={response.estLOE}
                onChange={(e) => onUpdate({ estLOE: e.target.value as ImpactLOE })}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400"
              >
                <option value="">--</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Priority</label>
              <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[priority]}`}>
                {priority}
              </span>
            </div>
          </div>

          {/* Target Date */}
          <div className="max-w-xs">
            <label className="block text-xs font-medium text-gray-500 mb-1">Target Date</label>
            <input
              type="date"
              value={response.targetDate}
              onChange={(e) => onUpdate({ targetDate: e.target.value })}
              className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-400"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(ObjectiveRow);
