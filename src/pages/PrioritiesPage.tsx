import { useMemo, useState } from 'react';
import domainsData from '../data/domains.json';
import type { Domain, Priority } from '../types';
import { useAssessment } from '../store/AssessmentContext';
import { computePriority, getStatus, getStatusColor } from '../store/useAssessmentStore';

const domains = domainsData.domains as Domain[];

const priorityColors: Record<string, string> = {
  P1: 'bg-red-100 text-red-800',
  P2: 'bg-orange-100 text-orange-800',
  P3: 'bg-yellow-100 text-yellow-800',
  P4: 'bg-gray-100 text-gray-700',
  Unset: 'bg-gray-50 text-gray-400',
};

type SortField = 'priority' | 'domain' | 'currentScore' | 'targetScore' | 'targetDate';
type SortDir = 'asc' | 'desc';

const priorityOrder: Record<string, number> = { P1: 1, P2: 2, P3: 3, P4: 4, Unset: 5 };

export default function PrioritiesPage() {
  const { state, getResponse } = useAssessment();
  const [filterPriority, setFilterPriority] = useState<Priority | 'All'>('All');
  const [filterDomain, setFilterDomain] = useState<number | 0>(0);
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [sortField, setSortField] = useState<SortField>('priority');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const allItems = useMemo(() => {
    const items: Array<{
      objectiveId: string;
      domainId: number;
      domainNickname: string;
      sectionName: string;
      text: string;
      currentScore: number | null;
      targetScore: number | null;
      estImpact: string;
      estLOE: string;
      priority: Priority;
      status: string;
      targetDate: string;
      notes: string;
    }> = [];

    for (const domain of domains) {
      for (const section of domain.sections) {
        for (const obj of section.objectives) {
          const resp = getResponse(obj.id);
          if (resp.targetScore === null) continue;
          const priority = computePriority(resp.estImpact, resp.estLOE);
          const status = getStatus(resp.score, resp.isNA);
          items.push({
            objectiveId: obj.id,
            domainId: domain.id,
            domainNickname: domain.nickname,
            sectionName: section.name,
            text: obj.text,
            currentScore: resp.score,
            targetScore: resp.targetScore,
            estImpact: resp.estImpact,
            estLOE: resp.estLOE,
            priority,
            status,
            targetDate: resp.targetDate,
            notes: resp.notes,
          });
        }
      }
    }
    return items;
  }, [getResponse, state.responses]);

  const filtered = useMemo(() => {
    let items = allItems;
    if (filterPriority !== 'All') {
      items = items.filter((i) => i.priority === filterPriority);
    }
    if (filterDomain !== 0) {
      items = items.filter((i) => i.domainId === filterDomain);
    }
    if (filterStatus !== 'All') {
      items = items.filter((i) => i.status === filterStatus);
    }

    items.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'priority':
          cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        case 'domain':
          cmp = a.domainId - b.domainId;
          break;
        case 'currentScore':
          cmp = (a.currentScore ?? -1) - (b.currentScore ?? -1);
          break;
        case 'targetScore':
          cmp = (a.targetScore ?? -1) - (b.targetScore ?? -1);
          break;
        case 'targetDate':
          cmp = a.targetDate.localeCompare(b.targetDate);
          break;
      }
      if (cmp === 0) cmp = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (cmp === 0) cmp = a.domainId - b.domainId;
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return items;
  }, [allItems, filterPriority, filterDomain, filterStatus, sortField, sortDir]);

  const summaryStats = useMemo(() => {
    const counts = { P1: 0, P2: 0, P3: 0, P4: 0 };
    let withDates = 0;
    let completed = 0;
    for (const item of allItems) {
      if (item.priority in counts)
        counts[item.priority as keyof typeof counts]++;
      if (item.targetDate) withDates++;
      if (item.currentScore !== null && item.targetScore !== null && item.currentScore >= item.targetScore)
        completed++;
    }
    return { counts, withDates, completed, total: allItems.length };
  }, [allItems]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortIcon = (field: SortField) => {
    if (sortField !== field) return ' ↕';
    return sortDir === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Priorities</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3 text-center">
          <span className="text-2xl font-bold text-gray-900">{summaryStats.total}</span>
          <p className="text-xs text-gray-500 mt-1">Total Items</p>
        </div>
        {(['P1', 'P2', 'P3', 'P4'] as const).map((p) => (
          <div key={p} className={`rounded-lg p-3 text-center border ${priorityColors[p]}`}>
            <span className="text-2xl font-bold">{summaryStats.counts[p]}</span>
            <p className="text-xs mt-1">{p}</p>
          </div>
        ))}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-center">
          <span className="text-2xl font-bold text-green-700">{summaryStats.completed}</span>
          <p className="text-xs text-green-600 mt-1">Completed</p>
        </div>
      </div>

      {/* Empty state */}
      {allItems.length === 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">No Priorities Set</h2>
          <p className="text-sm text-blue-700">
            Set target scores on objectives in any domain's Planning tab to see them here.
          </p>
        </div>
      )}

      {/* Filters */}
      {allItems.length > 0 && (
        <>
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Priority</label>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value as Priority | 'All')}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md"
              >
                <option value="All">All</option>
                <option value="P1">P1</option>
                <option value="P2">P2</option>
                <option value="P3">P3</option>
                <option value="P4">P4</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Domain</label>
              <select
                value={filterDomain}
                onChange={(e) => setFilterDomain(Number(e.target.value))}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md"
              >
                <option value={0}>All</option>
                {domains.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.nickname}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-300 rounded-md"
              >
                <option value="All">All</option>
                <option value="Not Implemented">Not Implemented</option>
                <option value="Partially Implemented">Partially</option>
                <option value="Largely Implemented">Largely</option>
                <option value="Fully Implemented">Fully</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th
                      className="text-left px-3 py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('priority')}
                    >
                      Priority{sortIcon('priority')}
                    </th>
                    <th
                      className="text-left px-3 py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('domain')}
                    >
                      Domain{sortIcon('domain')}
                    </th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Objective</th>
                    <th
                      className="text-center px-3 py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('currentScore')}
                    >
                      Current{sortIcon('currentScore')}
                    </th>
                    <th
                      className="text-center px-3 py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('targetScore')}
                    >
                      Target{sortIcon('targetScore')}
                    </th>
                    <th className="text-center px-3 py-2 font-medium text-gray-600">Impact</th>
                    <th className="text-center px-3 py-2 font-medium text-gray-600">LOE</th>
                    <th
                      className="text-left px-3 py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900"
                      onClick={() => handleSort('targetDate')}
                    >
                      Date{sortIcon('targetDate')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map((item) => (
                    <tr key={item.objectiveId} className="hover:bg-gray-50">
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${priorityColors[item.priority]}`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-gray-700 font-medium">{item.domainNickname}</td>
                      <td className="px-3 py-2 text-gray-700 max-w-xs">
                        <p className="line-clamp-2 text-xs">{item.text}</p>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${getStatusColor(item.status)}`}
                        >
                          {item.currentScore ?? '-'}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center font-medium text-gray-700">
                        {item.targetScore}
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-gray-600">
                        {item.estImpact || '-'}
                      </td>
                      <td className="px-3 py-2 text-center text-xs text-gray-600">
                        {item.estLOE || '-'}
                      </td>
                      <td className="px-3 py-2 text-xs text-gray-600">
                        {item.targetDate || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && (
              <div className="p-6 text-center text-sm text-gray-500">
                No items match the current filters.
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
