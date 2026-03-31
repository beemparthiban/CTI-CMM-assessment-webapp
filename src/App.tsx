import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AssessmentProvider } from './store/AssessmentContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DomainPage from './pages/DomainPage';
import PrioritiesPage from './pages/PrioritiesPage';

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
          </Route>
        </Routes>
      </AssessmentProvider>
    </HashRouter>
  );
}
