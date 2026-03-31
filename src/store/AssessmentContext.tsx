import { createContext, useContext, type ReactNode } from 'react';
import { useAssessmentStore } from './useAssessmentStore';

type StoreType = ReturnType<typeof useAssessmentStore>;

const AssessmentContext = createContext<StoreType | null>(null);

export function AssessmentProvider({ children }: { children: ReactNode }) {
  const store = useAssessmentStore();
  return (
    <AssessmentContext.Provider value={store}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment(): StoreType {
  const ctx = useContext(AssessmentContext);
  if (!ctx) throw new Error('useAssessment must be used within AssessmentProvider');
  return ctx;
}
