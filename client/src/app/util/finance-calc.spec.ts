import { computeContrib, getProjectedExpenses, recurringInMonth, catIsCommon, projectBalance, addMonths, memberIncomeFor, totalIncomeFor } from './finance-calc';
import { Expense, Member, MemberIncome, Recurring, Scheduled, Settings } from '../models/models';

describe('finance-calc', () => {
  const settings: Settings = { risparmio: 0, model: '5050', modelLog: [] };
  const members: Member[] = [
    { id: 1, displayName: 'Riccardo', monthlyIncome: 2000 },
    { id: 2, displayName: 'Valentina', monthlyIncome: 1000 },
  ];

  it('recurringInMonth: mensile sempre dal mese di partenza', () => {
    const r = { freq: 'mensile', fromMonth: '2026-01', toMonth: null } as Recurring;
    expect(recurringInMonth(r, '2026-01')).toBe(true);
    expect(recurringInMonth(r, '2026-05')).toBe(true);
    expect(recurringInMonth(r, '2025-12')).toBe(false);
  });

  it('recurringInMonth: trimestrale ogni 3 mesi, rispetta toMonth', () => {
    const r = { freq: 'trimestrale', fromMonth: '2026-01', toMonth: '2026-07' } as Recurring;
    expect(recurringInMonth(r, '2026-01')).toBe(true);
    expect(recurringInMonth(r, '2026-02')).toBe(false);
    expect(recurringInMonth(r, '2026-04')).toBe(true);
    expect(recurringInMonth(r, '2026-10')).toBe(false); // oltre toMonth
  });

  it('getProjectedExpenses: aggiunge proiezione ricorrente non pagata e la deduplica se pagata', () => {
    const recs: Recurring[] = [{ id: 1, desc: 'Netflix', amount: 12, cat: 'variabile', payer: 'comune', freq: 'mensile', fromMonth: '2026-01', toMonth: null, chargeDay: 15 }];
    const noPaid = getProjectedExpenses('2026-03', [], recs, []);
    expect(noPaid.length).toBe(1);
    expect(noPaid[0].projected).toBe(true);
    expect(noPaid[0].date).toBe('2026-03-15');

    const paid: Expense[] = [{ id: 9, desc: 'Netflix', amount: 12, cat: 'variabile', payer: 'comune', date: '2026-03-15', tipo: 'ricorrente', recurringId: 1, scheduledId: null }];
    const withPaid = getProjectedExpenses('2026-03', paid, recs, []);
    expect(withPaid.length).toBe(1);
    expect(withPaid[0].projected).toBeFalsy();
  });

  it('getProjectedExpenses: programmata appare solo nel mese target', () => {
    const sched: Scheduled[] = [{ id: 1, desc: 'Bollo', amount: 200, cat: 'extra', payer: 'comune', month: '2026-04' }];
    expect(getProjectedExpenses('2026-03', [], [], sched).length).toBe(0);
    expect(getProjectedExpenses('2026-04', [], [], sched).length).toBe(1);
  });

  it('catIsCommon: builtin comuni e custom in base al flag; personali escluse', () => {
    const cats = [{ id: 5, label: 'Vacanze', common: true, icon: 'ti-tag' }, { id: 6, label: 'Hobby', common: false, icon: 'ti-tag' }];
    expect(catIsCommon('variabile', cats)).toBe(true);
    expect(catIsCommon('p1', cats)).toBe(false); // personale di un membro
    expect(catIsCommon('c5', cats)).toBe(true);
    expect(catIsCommon('c6', cats)).toBe(false);
  });

  it('computeContrib: parti uguali divide a metà le sole comuni', () => {
    const exps = [
      { id: 1, desc: 'a', amount: 100, cat: 'variabile', payer: 'u1', date: '2026-03-01', tipo: 'singola' },
      { id: 2, desc: 'b', amount: 40, cat: 'p1', payer: 'u1', date: '2026-03-02', tipo: 'singola' }, // personale → esclusa
    ];
    const c = computeContrib(exps, settings, [], members);
    expect(c.totalCommon).toBe(100);
    const r = c.members.find(m => m.id === 1)!;
    const v = c.members.find(m => m.id === 2)!;
    expect(r.due).toBe(50);
    expect(v.due).toBe(50);
    expect(r.paid).toBe(100);
    expect(r.saldo).toBe(50);  // ha pagato 100, doveva 50
    expect(v.saldo).toBe(-50);
  });

  it('addMonths: somma mesi attraversando l\'anno', () => {
    expect(addMonths('2026-01', 2)).toBe('2026-03');
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(addMonths('2026-03', 0)).toBe('2026-03');
  });

  it('projectBalance: ancora sul mese corrente, saldo che si trascina', () => {
    const recs: Recurring[] = [{ id: 1, desc: 'Affitto', amount: 500, cat: 'common', payer: 'comune', freq: 'mensile', fromMonth: '2026-01', toMonth: null, chargeDay: 1 }];
    const f = projectBalance('2026-03', 3, { month: '2026-03', amount: 1000 }, () => 3000, [], recs, []);
    expect(f.length).toBe(3);
    // mese 0: 1000 + 3000 − 500 = 3500
    expect(f[0].startBalance).toBe(1000);
    expect(f[0].outflow).toBe(500);
    expect(f[0].endBalance).toBe(3500);
    expect(f[0].disponibileGiroconto).toBe(2500); // income − outflow
    // mese 1: parte da 3500 (trascinato)
    expect(f[1].startBalance).toBe(3500);
    expect(f[1].endBalance).toBe(6000);
  });

  it('projectBalance: senza ancora il saldo parte da 0', () => {
    const f = projectBalance('2026-03', 2, null, () => 3000, [], [], []);
    expect(f[0].startBalance).toBe(0);
    expect(f[0].endBalance).toBe(3000); // nessuna uscita
    expect(f[1].startBalance).toBe(3000);
  });

  it('projectBalance: ancora nel passato si propaga fino al mese mostrato', () => {
    const recs: Recurring[] = [{ id: 1, desc: 'Affitto', amount: 500, cat: 'common', payer: 'comune', freq: 'mensile', fromMonth: '2026-01', toMonth: null, chargeDay: 1 }];
    // ancora a gennaio = 1000; gen/feb aggiungono ciascuno (3000−500)=2500 → marzo parte da 6000
    const f = projectBalance('2026-03', 1, { month: '2026-01', amount: 1000 }, () => 3000, [], recs, []);
    expect(f.length).toBe(1);
    expect(f[0].mk).toBe('2026-03');
    expect(f[0].startBalance).toBe(6000);
  });

  it('memberIncomeFor: carry-forward dall\'ultimo override, fallback al reddito base', () => {
    const incomes: MemberIncome[] = [
      { id: 1, userId: 1, month: '2026-02', amount: 2500 },
      { id: 2, userId: 1, month: '2026-04', amount: 1800 },
    ];
    const ric = members[0]; // id 1, base 2000
    expect(memberIncomeFor(ric, '2026-01', incomes)).toBe(2000); // nessun override → base
    expect(memberIncomeFor(ric, '2026-02', incomes)).toBe(2500); // override del mese
    expect(memberIncomeFor(ric, '2026-03', incomes)).toBe(2500); // carry-forward da febbraio
    expect(memberIncomeFor(ric, '2026-05', incomes)).toBe(1800); // carry-forward da aprile
    expect(memberIncomeFor(members[1], '2026-05', incomes)).toBe(1000); // altro membro → base
  });

  it('totalIncomeFor: somma i redditi effettivi del mese', () => {
    const incomes: MemberIncome[] = [{ id: 1, userId: 1, month: '2026-03', amount: 2500 }];
    expect(totalIncomeFor(members, '2026-03', incomes)).toBe(3500); // 2500 + 1000 base
    expect(totalIncomeFor(members, '2026-01', incomes)).toBe(3000); // 2000 + 1000 base
  });

  it('computeContrib: proporzionale al reddito', () => {
    const exps = [{ id: 1, desc: 'a', amount: 300, cat: 'common', payer: 'comune', date: '2026-03-01', tipo: 'singola' }];
    const c = computeContrib(exps, { ...settings, model: 'prop' }, [], members);
    expect(c.members.find(m => m.id === 1)!.due).toBeCloseTo(200); // 2000/3000 * 300
    expect(c.members.find(m => m.id === 2)!.due).toBeCloseTo(100);
  });
});
