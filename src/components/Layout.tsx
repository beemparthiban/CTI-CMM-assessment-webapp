import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ExportImport from './ExportImport';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="shrink-0 flex items-center justify-end gap-3 px-6 py-2.5 border-b border-slate-200/80 bg-white/80 backdrop-blur-sm">
          <ExportImport />
        </header>
        <main className="flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
