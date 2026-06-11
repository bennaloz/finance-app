// Logica di calcolo PORTATA dall'app vanilla (index.html). Funzioni pure,
// così sono testabili e identiche al comportamento originale.

import { CustomCategory, DisplayExpense, Expense, Recurring, Scheduled, Settings } from '../models/models';
import { CAT_ICONS, CAT_LABELS, CAT_FORM_LABELS } from './i18n';

export const FREQ_MONTHS: Record<string, number> = { mensile: 1, bimestrale: 2, trimestrale: 3, semestrale: 6, annuale: 12 };
export const BUILTIN_COMMON = ['common', 'risparmio', 'variabile', 'extra'];
const BUILTIN_IDS = ['common', 'risparmio', 'variabile', 'riccardo', 'valentina', 'extra'];

export function monthKey(y: number, m: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

// Riferimento stringa di una categoria custom (es. "c5"), come faceva l'app originale con "c"+id.
export function customCatRef(c: CustomCategory): string {
  return 'c' + c.id;
}

export function allCatIds(cats: CustomCategory[]): string[] {
  return [...BUILTIN_IDS, ...cats.map(customCatRef)];
}

export function catIsCommon(id: string, cats: CustomCategory[]): boolean {
  if (BUILTIN_COMMON.includes(id)) return true;
  const c = cats.find(x => customCatRef(x) === id);
  return c ? c.common : false;
}

export function catClassFor(id: string): string {
  if (['common', 'risparmio', 'riccardo', 'valentina', 'extra'].includes(id)) return id;
  if (id === 'variabile') return 'common';
  return 'custom';
}

export function catLabel(id: string, cats: CustomCategory[]): string {
  if (CAT_LABELS[id]) return CAT_LABELS[id];
  const c = cats.find(x => customCatRef(x) === id);
  return c ? c.label : id;
}

export function catFormLabel(id: string, cats: CustomCategory[]): string {
  return CAT_FORM_LABELS[id] || catLabel(id, cats);
}

export function catIcon(id: string, cats: CustomCategory[]): string {
  if (CAT_ICONS[id]) return CAT_ICONS[id];
  const c = cats.find(x => customCatRef(x) === id);
  return c && c.icon ? c.icon : 'ti-tag';
}

export function recurringInMonth(r: Recurring, mk: string): boolean {
  const [y, m] = mk.split('-').map(Number);
  const [fy, fm] = r.fromMonth.split('-').map(Number);
  const step = FREQ_MONTHS[r.freq] || 1;
  const diff = (y - fy) * 12 + (m - fm);
  if (diff < 0) return false;
  if (r.toMonth) {
    const [ty, tm] = r.toMonth.split('-').map(Number);
    if (y > ty || (y === ty && m > tm)) return false;
  }
  return diff % step === 0;
}

// Spese reali del mese + proiezioni (ricorrenti/programmate non ancora "pagate").
export function getProjectedExpenses(mk: string, expenses: Expense[], recurrings: Recurring[], scheduleds: Scheduled[]): DisplayExpense[] {
  const actualRecIds = new Set(expenses.filter(e => e.recurringId).map(e => e.recurringId));
  const result: DisplayExpense[] = expenses.map(e => ({ ...e, tipo: e.tipo || 'singola' }));

  for (const r of recurrings) {
    if (recurringInMonth(r, mk) && !actualRecIds.has(r.id)) {
      const day = r.chargeDay ? String(Math.min(31, Math.max(1, r.chargeDay))).padStart(2, '0') : '01';
      result.push({ id: `proj_${r.id}_${mk}`, desc: r.desc, amount: r.amount, cat: r.cat, payer: r.payer, date: `${mk}-${day}`, tipo: 'ricorrente', projected: true, recurringId: r.id });
    }
  }
  for (const p of scheduleds) {
    if (p.month === mk && !expenses.some(e => e.scheduledId === p.id)) {
      result.push({ id: `proj_prog_${p.id}`, desc: p.desc, amount: p.amount, cat: p.cat, payer: p.payer, date: `${mk}-01`, tipo: 'programmata', projected: true, scheduledId: p.id });
    }
  }
  return result;
}

export interface Contrib {
  totalCommon: number; dR: number; dV: number; paidR: number; paidV: number; saldoR: number; saldoV: number;
}

export function computeContrib(exps: DisplayExpense[], settings: Settings, cats: CustomCategory[]): Contrib {
  const tot = settings.redditoR + settings.redditoV;
  const totalCommon = exps.filter(e => catIsCommon(e.cat, cats)).reduce((a, e) => a + e.amount, 0);
  let dR: number, dV: number;
  if (settings.model === 'prop') {
    const p = tot > 0 ? settings.redditoR / tot : 0.5;
    dR = totalCommon * p; dV = totalCommon * (1 - p);
  } else {
    dR = totalCommon / 2; dV = totalCommon / 2;
  }
  const paidR = exps.filter(e => e.payer === 'riccardo' && catIsCommon(e.cat, cats)).reduce((a, e) => a + e.amount, 0);
  const paidV = exps.filter(e => e.payer === 'valentina' && catIsCommon(e.cat, cats)).reduce((a, e) => a + e.amount, 0);
  return { totalCommon, dR, dV, paidR, paidV, saldoR: paidR - dR, saldoV: paidV - dV };
}

export function fmt(n: number): string {
  return '€' + Math.round(n).toLocaleString('it-IT');
}

export function fmtDec(n: number): string {
  return '€' + n.toFixed(2).replace('.', ',');
}
