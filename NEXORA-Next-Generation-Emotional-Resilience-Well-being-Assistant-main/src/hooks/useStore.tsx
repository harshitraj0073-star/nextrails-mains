import React, { createContext, useContext, useState, useEffect } from 'react';
import { Role, Case, Intervention } from '../types';
import { MOCK_CASES } from '../data/mockData';

interface AppState {
  role: Role;
  cases: Case[];
  language: 'en' | 'hi' | 'bn';
}

interface AppContextType {
  state: AppState;
  setRole: (role: Role) => void;
  setLanguage: (lang: 'en' | 'hi' | 'bn') => void;
  updateCase: (caseId: string, updates: Partial<Case>) => void;
  addIntervention: (caseId: string, intervention: Intervention) => void;
  getCase: (caseId: string) => Case | undefined;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('nexora_app_state');
    if (saved) {
      return JSON.parse(saved);
    }
    return {
      role: null,
      cases: MOCK_CASES,
      language: 'en'
    };
  });

  useEffect(() => {
    localStorage.setItem('nexora_app_state', JSON.stringify(state));
  }, [state]);

  const setRole = (role: Role) => setState(prev => ({ ...prev, role }));
  const setLanguage = (language: 'en' | 'hi' | 'bn') => setState(prev => ({ ...prev, language }));

  const updateCase = (caseId: string, updates: Partial<Case>) => {
    setState(prev => ({
      ...prev,
      cases: prev.cases.map(c => c.id === caseId ? { ...c, ...updates } : c)
    }));
  };

  const addIntervention = (caseId: string, intervention: Intervention) => {
    setState(prev => ({
      ...prev,
      cases: prev.cases.map(c => {
        if (c.id === caseId) {
          return {
            ...c,
            interventions: [...c.interventions, intervention],
            timeline: [
              {
                id: `t_${Date.now()}`,
                date: new Date().toISOString(),
                title: 'Intervention Recorded',
                description: `${intervention.type} - Assigned to: ${intervention.assignedTo}`,
                type: 'intervention'
              },
              ...c.timeline
            ]
          };
        }
        return c;
      })
    }));
  };

  const getCase = (caseId: string) => {
    return state.cases.find(c => c.id === caseId);
  };

  return (
    <AppContext.Provider value={{ state, setRole, setLanguage, updateCase, addIntervention, getCase }}>
      {children}
    </AppContext.Provider>
  );
};

export const useStore = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useStore must be used within an AppProvider');
  }
  return context;
};
