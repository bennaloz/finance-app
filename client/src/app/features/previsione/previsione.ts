import { Component, computed, inject, signal } from '@angular/core';
import { DataStore } from '../../core/data-store';
import { getProjectedExpenses, monthKey, projectBalance, totalIncomeFor, fmt } from '../../util/finance-calc';
import { MONTHS } from '../../util/i18n';

@Component({
  selector: 'app-previsione',
  imports: [],
  templateUrl: './previsione.html',
})
export class Previsione {
  ds = inject(DataStore);
  fmt = fmt;
  abs = Math.abs;

  // Mese corrente come chiave 'yyyy-MM'.
  private nowMk = monthKey(new Date().getFullYear(), new Date().getMonth());

  // Ancora più recente non successiva al mese corrente: il saldo reale del conto comune
  // da cui la previsione parte e si trascina. null = nessun allineamento impostato.
  anchor = computed(() => {
    const past = this.ds.alignments().filter(a => a.month <= this.nowMk);
    return past.length ? past.reduce((a, b) => (b.month > a.month ? b : a)) : null;
  });

  // Campo "fissa saldo" + feedback di salvataggio.
  saldoInput = signal('');
  saving = signal(false);
  savedMsg = signal(false);

  cards = computed(() => {
    // Reddito per-mese: somma dei redditi effettivi dei membri in quel mese (carry-forward).
    const incomeFor = (mk: string) => totalIncomeFor(this.ds.members(), mk, this.ds.memberIncomes());
    const fc = projectBalance(this.nowMk, 6, this.anchor(), incomeFor, this.ds.expenses(), this.ds.recurrings(), this.ds.scheduleds());
    return fc.map(c => {
      const [y, m] = c.mk.split('-').map(Number);
      // recCount = quante voci proiettate (ric./prog.) nel mese, per il badge.
      const real = this.ds.expenses().filter(e => e.date.startsWith(c.mk));
      const recCount = getProjectedExpenses(c.mk, real, this.ds.recurrings(), this.ds.scheduleds())
        .filter(e => e.tipo === 'ricorrente' || e.tipo === 'programmata').length;
      const pct = c.income > 0 ? Math.min((c.outflow / c.income) * 100, 100) : 0;
      return {
        label: `${MONTHS[m - 1]} ${y}`, isCurrent: c.mk === this.nowMk, recCount,
        outflow: c.outflow, income: c.income, endBalance: c.endBalance, disponibile: c.disponibileGiroconto, pct,
        barColor: pct > 90 ? '#E24B4A' : pct > 75 ? 'var(--c-amber)' : 'var(--c-teal)',
      };
    });
  });

  // Saldo proiettato all'ultimo mese mostrato (sintesi a 6 mesi).
  saldoFinale = computed(() => {
    const cs = this.cards();
    return cs.length ? cs[cs.length - 1].endBalance : 0;
  });

  setAnchor(): void {
    const amount = parseFloat(this.saldoInput().replace(',', '.'));
    if (isNaN(amount)) return;
    this.saving.set(true);
    this.ds.setAlignment(this.nowMk, amount).subscribe({
      next: () => {
        this.saving.set(false);
        this.savedMsg.set(true);
        this.saldoInput.set('');
        setTimeout(() => this.savedMsg.set(false), 2000);
      },
      error: () => this.saving.set(false),
    });
  }
}
