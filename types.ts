export enum BusinessStatus {
  HEALTHY = 'Saudável',
  ATTENTION = 'Atenção',
  RISK = 'Risco'
}

export type AnalysisType = 'CNPJ' | 'CPF';

export interface StaffRole {
  role: string;
  count: number;
  totalSalary: number;
}

export interface BusinessProfile {
  general: {
    name: string;
    segment: string;
    yearsInBusiness: string;
    location: string;
  };
  structure: {
    type: 'physical' | 'online' | 'both' | '';
    hours: string;
    units: string;
  };
  team: {
    total: number;
    roles: string[];
  };
  operation: {
    offerings: string;
    salesChannel: string[];
    suppliers: string;
  };
  finance: {
    hasControl: boolean;
    method: 'spreadsheet' | 'system' | 'none' | '';
    frequency: string;
  };
}

export interface BusinessData {
  period: string;
  revenue: number;
  directCosts: number;
  fixedCosts: {
    energy: number;
    water: number;
    internet: number;
    software: number;
    rent: number;
    maintenance: number;
  };
  staff: {
    totalCount: number;
    roles: StaffRole[];
  };
  variableCosts: {
    taxes: number;
    marketing: number;
    commissions: number;
    logistics: number;
  };
  otherCosts: {
    description: string;
    value: number;
  }[];
}

export interface PersonalData {
  period: string;
  income: number;
  housing: number;
  utilities: number; // energia, água, internet
  food: number;
  transport: number;
  creditCard: number;
  health: number;
  education: number;
  leisure: number;
  other: number;
}

export interface HistoryRecord {
  id: string;
  type: AnalysisType;
  date: string; // ISO string
  monthYear: string; // ex: "Março 2024"
  input: string;
  result: string;
  summary: {
    faturamento: string;
    lucroBruto: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}