// Logica di calcolo PORTATA dall'app vanilla (index.html). Funzioni pure,
// così sono testabili e identiche al comportamento originale.

import { CustomCategory, DisplayExpense, Expense, Member, Recurring, Scheduled, Settings } from '../models/models';
import { CAT_COLORS, CAT_ICONS, CAT_LABELS, CAT_FORM_LABELS, memberColor } from './i18n';

export const FREQ_MONTHS: Record<string, number> = { mensile: 1, bimestrale: 2, trimestrale: 3, semestrale: 6, annuale: 12 };
export const BUILTIN_COMMON = ['common', 'risparmio', 'variabile', 'extra'];

// Riferimenti membro: payer 'u{id}', categoria personale 'p{id}'.
export function memberPayerRef(id: number): string { return 'u' + id; }
export function memberCatRef(id: number): string { return 'p' + id; }
function isMemberCat(id: string): boolean { return /^p\d+$/.test(id); }

export function monthKey(y: number, m: number): string {
  return `${y}-${String(m + 1).padStart(2, '0')}`;
}

// Riferimento stringa di una categoria custom (es. "c5"), come faceva l'app originale con "c"+id.
export function customCatRef(c: CustomCategory): string {
  return 'c' + c.id;
}

// Ordine categorie: comuni fisse, poi una "personale" per membro, poi extra e custom.
export function allCatIds(cats: CustomCategory[], members: Member[]): string[] {
  return [
    'common', 'risparmio', 'variabile',
    ...members.map(m => memberCatRef(m.id)),
    'extra',
    ...cats.map(customCatRef),
  ];
}

export function catIsCommon(id: string, cats: CustomCategory[]): boolean {
  if (BUILTIN_COMMON.includes(id)) return true;
  const c = cats.find(x => customCatRef(x) === id);
  return c ? c.common : false;
}

export function catClassFor(id: string): string {
  if (id === 'variabile') return 'common';
  if (['common', 'risparmio', 'extra'].includes(id)) return id;
  if (isMemberCat(id)) return 'member';
  return 'custom';
}

export function catLabel(id: string, cats: CustomCategory[], members: Member[]): string {
  if (CAT_LABELS[id]) return CAT_LABELS[id];
  if (isMemberCat(id)) {
    const m = members.find(x => memberCatRef(x.id) === id);
    return m ? `Personali ${m.displayName}` : 'Personali';
  }
  const c = cats.find(x => customCatRef(x) === id);
  return c ? c.label : id;
}

export function catFormLabel(id: string, cats: CustomCategory[], members: Member[]): string {
  return CAT_FORM_LABELS[id] || catLabel(id, cats, members);
}

export function catIcon(id: string, cats: CustomCategory[]): string {
  if (CAT_ICONS[id]) return CAT_ICONS[id];
  if (isMemberCat(id)) return 'ti-user';
  const c = cats.find(x => customCatRef(x) === id);
  return c && c.icon ? c.icon : 'ti-tag';
}

// Colore della categoria: fisse da CAT_COLORS, personali dalla palette membro per indice.
export function catColor(id: string, cats: CustomCategory[], members: Member[]): string {
  if (isMemberCat(id)) {
    const idx = members.findIndex(m => memberCatRef(m.id) === id);
    return idx >= 0 ? memberColor(idx) : CAT_COLORS['custom'];
  }
  return CAT_COLORS[catClassFor(id)] || CAT_COLORS['custom'];
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
      let day: string;
      if (r.chargeDay === 0) {
        const [y, m] = mk.split('-').map(Number);
        day = String(new Date(y, m, 0).getDate()).padStart(2, '0');
      } else {
        day = r.chargeDay ? String(Math.min(31, Math.max(1, r.chargeDay))).padStart(2, '0') : '01';
      }
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

// Contributo per singolo membro alle spese comuni del mese.
export interface MemberContrib { id: number; name: string; due: number; paid: number; saldo: number; }
export interface Contrib { totalCommon: number; members: MemberContrib[]; }

export function computeContrib(exps: DisplayExpense[], settings: Settings, cats: CustomCategory[], members: Member[]): Contrib {
  const totalCommon = exps.filter(e => catIsCommon(e.cat, cats)).reduce((a, e) => a + e.amount, 0);
  const totalIncome = members.reduce((a, m) => a + m.monthlyIncome, 0);
  const n = members.length;
  const list = members.map(m => {
    // 'prop' divide in proporzione al reddito; '5050'/'unico' in parti uguali.
    const due = settings.model === 'prop' && totalIncome > 0
      ? totalCommon * (m.monthlyIncome / totalIncome)
      : (n > 0 ? totalCommon / n : 0);
    const paid = exps
      .filter(e => e.payer === memberPayerRef(m.id) && catIsCommon(e.cat, cats))
      .reduce((a, e) => a + e.amount, 0);
    return { id: m.id, name: m.displayName, due, paid, saldo: paid - due };
  });
  return { totalCommon, members: list };
}

export function fmt(n: number): string {
  return '€' + Math.round(n).toLocaleString('it-IT');
}

export function fmtDec(n: number): string {
  return '€' + n.toFixed(2).replace('.', ',');
}
