import { computeContrib, getProjectedExpenses, recurringInMonth, catIsCommon } from './finance-calc';
import { Expense, Member, Recurring, Scheduled, Settings } from '../models/models';

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

  it('computeContrib: proporzionale al reddito', () => {
    const exps = [{ id: 1, desc: 'a', amount: 300, cat: 'common', payer: 'comune', date: '2026-03-01', tipo: 'singola' }];
    const c = computeContrib(exps, { ...settings, model: 'prop' }, [], members);
    expect(c.members.find(m => m.id === 1)!.due).toBeCloseTo(200); // 2000/3000 * 300
    expect(c.members.find(m => m.id === 2)!.due).toBeCloseTo(100);
  });
});
