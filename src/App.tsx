import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AssessmentProvider } from './store/AssessmentContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DomainPage from './pages/DomainPage';
import PrioritiesPage from './pages/PrioritiesPage';
import HistoryPage from './pages/HistoryPage';
import ComparePage from './pages/ComparePage';

export default function App() {
  return (
    <HashRouter>
      <AssessmentProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/domain/:domainId" element={<DomainPage />} />
            <Route path="/priorities" element={<PrioritiesPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/history/compare" element={<ComparePage />} />
          </Route>
        </Routes>
      </AssessmentProvider>
    </HashRouter>
  );
}
