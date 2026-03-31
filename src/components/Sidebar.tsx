import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Target, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';
import { useAssessment } from '../store/AssessmentContext';
import { getDotColor } from './ProgressBar';
import domainsData from '../data/domains.json';
import type { Domain } from '../types';

export default function Sidebar() {
  const [open, setOpen] = useState(false);
  const { getDomainScore } = useAssessment();

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
      isActive
        ? 'bg-brand-600 text-white shadow-sm shadow-brand-900/30'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`;

  const nav = (
    <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1 overflow-y-auto">
      <div className="flex items-center gap-2.5 px-3 py-3 mb-4">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shadow-sm">
          <Shield size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight">CTI-CMM</h1>
          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-widest">Assessor v1.3</p>
        </div>
      </div>

      <NavLink to="/dashboard" className={linkClass} onClick={() => setOpen(false)}>
        <LayoutDashboard size={16} />
        Dashboard
      </NavLink>

      <div className="mt-5 mb-1.5 px-3">
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Domains</span>
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
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${getDotColor(pct)}`} />
            <span className="truncate">
              {domain.id}. {domain.nickname}
            </span>
          </NavLink>
        );
      })}

      <div className="mt-5 mb-1.5 px-3">
        <span className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest">Planning</span>
      </div>
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
        className="fixed top-3 left-3 z-50 md:hidden p-2 rounded-lg bg-slate-900 text-white shadow-lg"
        onClick={() => setOpen(!open)}
        aria-label="Toggle navigation"
      >
        {open ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed md:static z-40 top-0 left-0 h-full w-64 bg-slate-950 flex flex-col transition-transform duration-200 border-r border-slate-800/50 ${
          open ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {nav}
      </aside>
    </>
  );
}
