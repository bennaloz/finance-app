import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DataStore } from '../../core/data-store';
import { DisplayExpense } from '../../models/models';
import { computeContrib, fmt } from '../../util/finance-calc';
import { MODELS, memberColor } from '../../util/i18n';
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

  // Editor inline delle entrate del mese (reddito per-membro, datato con carry-forward).
  editingIncome = signal(false);
  savingIncome = signal(false);
  incomeError = signal('');
  incomeDraft = signal<Record<number, string>>({});

  toggleEditIncome(): void {
    if (this.editingIncome()) { this.editingIncome.set(false); return; }
    // Prefill con il reddito effettivo del mese mostrato.
    const draft: Record<number, string> = {};
    for (const m of this.ds.monthMembers()) draft[m.id] = String(m.monthlyIncome);
    this.incomeDraft.set(draft);
    this.editingIncome.set(true);
  }

  setDraft(id: number, value: string): void {
    this.incomeDraft.update(d => ({ ...d, [id]: value }));
  }

  saveIncome(): void {
    const draft = this.incomeDraft();
    const month = this.ds.monthKey();
    const calls = this.ds.members().map(m => this.ds.setMemberIncome(m.id, month, Number((draft[m.id] ?? '').replace(',', '.')) || 0));
    if (!calls.length) { this.editingIncome.set(false); return; }
    this.incomeError.set('');
    this.savingIncome.set(true);
    forkJoin(calls).subscribe({
      next: () => { this.savingIncome.set(false); this.editingIncome.set(false); },
      error: () => { this.savingIncome.set(false); this.incomeError.set('Salvataggio non riuscito. Riprova.'); },
    });
  }

  vm = computed(() => {
    const exps = this.exps();
    const s = this.ds.settings();
    const members = this.ds.monthMembers();
    const totR = this.ds.totalIncome();
    const confirmed = exps.filter(e => !e.projected);
    const projected = exps.filter(e => e.projected);
    const totalConfirmed = confirmed.reduce((a, e) => a + e.amount, 0);
    const totalAll = exps.reduce((a, e) => a + e.amount, 0);
    const surplus = totR - totalAll;
    const pct = totR > 0 ? Math.min((totalAll / totR) * 100, 100) : 0;
    const c = computeContrib(exps, s, this.ds.categories(), members);
    // Una riga di contribuzione per membro, con colore e % pagato/dovuto.
    const contribRows = c.members.map((mc, i) => ({
      ...mc, color: memberColor(i),
      pct: Math.min(mc.due > 0 ? (mc.paid / mc.due) * 100 : 0, 100),
    }));
    const incomeLine = members.map(m => `${m.displayName}: ${fmt(m.monthlyIncome)}`).join(' · ');
    const recent = [...exps].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 4);
    return {
      totR, totalConfirmed, totalAll, surplus, pct,
      fillClass: 'therm-fill' + (pct > 90 ? ' over' : pct > 75 ? ' warn' : ''),
      projectedAmount: totalAll - totalConfirmed,
      hasProjected: projected.length > 0,
      confirmedCount: confirmed.length,
      modelLabel: MODELS[s.model]?.label ?? s.model,
      incomeLine, contribRows,
      recent,
    };
  });

  pay(e: DisplayExpense): void { this.ds.payProjected(e).subscribe(); }
  edit(e: DisplayExpense): void { this.router.navigate(['/aggiungi'], { queryParams: { edit: e.id } }); }
  remove(e: DisplayExpense): void {
    if (typeof e.id === 'number') this.ds.deleteExpenseById(e.id).subscribe();
  }
}
