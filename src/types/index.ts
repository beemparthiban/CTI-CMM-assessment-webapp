export type MaturityLevel = 'CTI0' | 'CTI1' | 'CTI2' | 'CTI3' | 'NA';

export interface Objective {
  id: string;
  maturityLevel: string;
  text: string;
  maxScore: number;
}

export interface Section {
  id: string;
  name: string;
  objectives: Objective[];
}

export interface Domain {
  id: number;
  name: string;
  nickname: string;
  maxScore: number;
  sections: Section[];
}

export interface ObjectiveResponse {
  score: number | null;
  isNA: boolean;
  evidence: string;
  poc: string;
  notes: string;
  targetScore: number | null;
  estImpact: ImpactLOE;
  estLOE: ImpactLOE;
  targetDate: string;
}

export type ImpactLOE = 'High' | 'Medium' | 'Low' | '';

export type Priority = 'P1' | 'P2' | 'P3' | 'P4' | 'Unset';

export interface AssessmentState {
  responses: Record<string, ObjectiveResponse>;
  domainInUse: Record<number, boolean>;
  dateLastAssessed: Record<number, string>;
  assessmentName: string;
}

export interface DomainsData {
  domains: Domain[];
}
