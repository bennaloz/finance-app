// Interfacce che rispecchiano i DTO del backend .NET.

export interface AuthResponse {
  token: string;
  email: string;
  displayName: string;
  householdId: number;
}

export interface ModelLogEntry {
  date: string;
  model: string;
  modelLabel: string;
  redditoR: number;
  redditoV: number;
}

export interface Settings {
  redditoR: number;
  redditoV: number;
  risparmio: number;
  model: string;
  modelLog: ModelLogEntry[];
}

export interface Expense {
  id: number;
  desc: string;
  amount: number;
  cat: string;
  payer: string;
  date: string;        // yyyy-MM-dd
  tipo: string;        // singola | ricorrente | programmata
  recurringId: number | null;
  scheduledId: number | null;
}

export interface Recurring {
  id: number;
  desc: string;
  amount: number;
  cat: string;
  payer: string;
  freq: string;
  fromMonth: string;   // yyyy-MM
  toMonth: string | null;
  chargeDay: number | null;
}

export interface Scheduled {
  id: number;
  desc: string;
  amount: number;
  cat: string;
  payer: string;
  month: string;       // yyyy-MM
}

export interface CustomCategory {
  id: number;
  label: string;
  common: boolean;
  icon: string;
}

// Voce mostrata a video: spesa reale oppure proiezione calcolata dal client.
export interface DisplayExpense {
  id: number | string;
  desc: string;
  amount: number;
  cat: string;
  payer: string;
  date: string;
  tipo: string;
  recurringId?: number | null;
  scheduledId?: number | null;
  projected?: boolean;
}
