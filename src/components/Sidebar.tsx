import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, Menu, X } from 'lucide-react';
import { useState } from 'react';
import { useAssessment } from '../store/AssessmentContext';
import { getDotColor } from './ProgressBar';
import domainsData from '../data/domains.json';
import type { Domain } from '../types';

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { getDomainScore } = useAssessment();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
    }`;

  const nav = (
    <nav className="flex flex-col gap-1 p-4 flex-1 overflow-y-auto">
      <div className="px-3 py-2 mb-2">
        <h1 className="text-lg font-bold text-white">CTI-CMM</h1>
        <p className="text-xs text-gray-400">Assessor</p>
      </div>

      <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>
        <LayoutDashboard size={16} />
        Dashboard
      </NavLink>

      <div className="mt-3 mb-1 px-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Domains</span>
      </div>

      {(domainsData.domains as Domain[]).map((domain) => {
        const { pct } = getDomainScore(domain);
        return (
          <NavLink
            key={domain.id}
            to={`/domain/${domain.id}`}
            className={linkClass}
            onClick={() => setOpen(false)}
          >
            <span className={`w-2 h-2 rounded-full shrink-0 ${getDotColor(pct)}`} />
            <span className="truncate">
              {domain.id}. {domain.nickname}
            </span>
          </NavLink>
        );
      })}

      <div className="mt-3" />
      <NavLink to="/priorities" className={linkClass} onClick={() => setOpen(false)}>
        <Target size={16} />
        Priorities
      </NavLink>
    </nav>
  );

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-md bg-gray-900 text-white"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-40 top-0 left-0 h-full w-64 bg-gray-900 flex flex-col transition-transform duration-200 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {nav}
      </aside>
    </>
  );
}
