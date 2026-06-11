import { DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DataStore } from '../../core/data-store';
import { DisplayExpense } from '../../models/models';
import { computeContrib, fmt } from '../../util/finance-calc';
import { MODELS } from '../../util/i18n';
import { ExpenseRow } from '../shared/expense-row';

@Component({
  selector: 'app-dashboard',
  imports: [ExpenseRow, RouterLink, DecimalPipe],
  templateUrl: './dashboard.html',
})
export class Dashboard {
  ds = inject(DataStore);
  private router = inject(Router);
  fmt = fmt;
  abs = Math.abs;

  private exps = computed(() => this.ds.projected());

  vm = computed(() => {
    const exps = this.exps();
    const s = this.ds.settings();
    const totR = s.redditoR + s.redditoV;
    const confirmed = exps.filter(e => !e.projected);
    const projected = exps.filter(e => e.projected);
    const totalConfirmed = confirmed.reduce((a, e) => a + e.amount, 0);
    const totalAll = exps.reduce((a, e) => a + e.amount, 0);
    const surplus = totR - totalAll;
    const pct = totR > 0 ? Math.min((totalAll / totR) * 100, 100) : 0;
    const c = computeContrib(exps, s, this.ds.categories());
    const recent = [...exps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);
    return {
      totR, totalConfirmed, totalAll, surplus, pct,
      fillClass: 'therm-fill' + (pct > 90 ? ' over' : pct > 75 ? ' warn' : ''),
      projectedAmount: totalAll - totalConfirmed,
      hasProjected: projected.length > 0,
      confirmedCount: confirmed.length,
      modelLabel: MODELS[s.model]?.label ?? s.model,
      redditoR: s.redditoR, redditoV: s.redditoV,
      c,
      pctR: Math.min(c.dR > 0 ? (c.paidR / c.dR) * 100 : 0, 100),
      pctV: Math.min(c.dV > 0 ? (c.paidV / c.dV) * 100 : 0, 100),
      recent,
    };
  });

  pay(e: DisplayExpense): void { this.ds.payProjected(e).subscribe(); }
  edit(e: DisplayExpense): void { this.router.navigate(['/aggiungi'], { queryParams: { edit: e.id } }); }
  remove(e: DisplayExpense): void {
    if (typeof e.id === 'number') this.ds.deleteExpenseById(e.id).subscribe();
  }
}
