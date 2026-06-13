// Interfacce che rispecchiano i DTO del backend .NET.

export interface AuthResponse {
  token: string;
  email: string;
  displayName: string;
  householdId: number;
  householdName: string;
  joinCode: string;
}

// Un membro del nucleo = un utente, con il proprio reddito mensile.
export interface Member {
  id: number;
  displayName: string;
  monthlyIncome: number;
}

export interface ModelLogEntry {
  date: string;
  model: string;
  modelLabel: string;
  // Snapshot {nome: reddito} dei membri al momento del cambio.
  incomesJson: string;
}

export interface Settings {
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

// Ancora di saldo del conto comune per un mese: da qui parte la Previsione.
export interface Alignment {
  id: number;
  month: string;       // yyyy-MM
  amount: number;
}

// Reddito di un membro per un mese specifico (override datato, con carry-forward).
export interface MemberIncome {
  id: number;
  userId: number;
  month: string;       // yyyy-MM
  amount: number;
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
