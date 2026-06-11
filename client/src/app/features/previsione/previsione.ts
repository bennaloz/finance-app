import { Component, computed, inject } from '@angular/core';
import { DataStore } from '../../core/data-store';
import { getProjectedExpenses, monthKey, fmt } from '../../util/finance-calc';
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

  cards = computed(() => {
    const s = this.ds.settings();
    const totR = s.redditoR + s.redditoV;
    const now = new Date();
    const nowMk = monthKey(now.getFullYear(), now.getMonth());
    const out = [];
    for (let i = 0; i < 6; i++) {
      let y = now.getFullYear(), m = now.getMonth() + i;
      while (m > 11) { m -= 12; y++; }
      const mk = monthKey(y, m);
      // Solo le spese reali del mese visualizzato sono in memoria: le filtro per mese per non contarle altrove.
      const real = this.ds.expenses().filter(e => e.date.startsWith(mk));
      const exps = getProjectedExpenses(mk, real, this.ds.recurrings(), this.ds.scheduleds());
      const total = exps.reduce((a, e) => a + e.amount, 0);
      const surplus = totR - total;
      const pct = totR > 0 ? Math.min((total / totR) * 100, 100) : 0;
      const recCount = exps.filter(e => e.tipo === 'ricorrente' || e.tipo === 'programmata').length;
      out.push({
        label: `${MONTHS[m]} ${y}`, isCurrent: mk === nowMk, recCount, total, totR, surplus, pct,
        barColor: pct > 90 ? '#E24B4A' : pct > 75 ? 'var(--c-amber)' : 'var(--c-teal)',
      });
    }
    return out;
  });
}
