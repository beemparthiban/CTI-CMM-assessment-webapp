import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import ExportImport from './ExportImport';

export default function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="shrink-0 flex items-center justify-end gap-3 px-6 py-3 border-b border-gray-200 bg-white">
          <ExportImport />
        </header>
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
