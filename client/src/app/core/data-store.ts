import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, forkJoin, tap } from 'rxjs';
import { CustomCategory, DisplayExpense, Expense, Member, Recurring, Scheduled, Settings } from '../models/models';
import { getProjectedExpenses } from '../util/finance-calc';
import { ApiService } from './api.service';

// Stato dell'app (online-first): tiene il mese corrente e i dati scaricati dall'API.
@Injectable({ providedIn: 'root' })
export class DataStore {
  private api = inject(ApiService);

  year = signal(new Date().getFullYear());
  month = signal(new Date().getMonth());
  expenses = signal<Expense[]>([]);
  recurrings = signal<Recurring[]>([]);
  scheduleds = signal<Scheduled[]>([]);
  categories = signal<CustomCategory[]>([]);
  members = signal<Member[]>([]);
  settings = signal<Settings>({ risparmio: 0, model: '5050', modelLog: [] });
  loaded = signal(false);

  // Stato di apertura degli accordion nella schermata Uscite: vive nello store così
  // resta aperto quando si va a modificare una voce e si torna indietro.
  usciteRecOpen = signal(false);
  usciteSchedOpen = signal(false);

  // Reddito totale del nucleo = somma dei redditi dei membri (sostituisce redditoR+redditoV).
  totalIncome = computed(() => this.members().reduce((a, m) => a + m.monthlyIncome, 0));

  monthKey = computed(() => `${this.year()}-${String(this.month() + 1).padStart(2, '0')}`);
  projected = computed(() => getProjectedExpenses(this.monthKey(), this.expenses(), this.recurrings(), this.scheduleds()));

  changeMonth(dir: number): void {
    let m = this.month() + dir, y = this.year();
    if (m > 11) { m = 0; y++; }
    if (m < 0) { m = 11; y--; }
    this.month.set(m); this.year.set(y);
    this.loadMonth();
  }

  // Carica tutto (al login / avvio).
  loadAll(): void {
    forkJoin({
      recurrings: this.api.getRecurrings(),
      scheduleds: this.api.getScheduleds(),
      categories: this.api.getCategories(),
      settings: this.api.getSettings(),
      members: this.api.getMembers(),
      expenses: this.api.getExpenses(this.monthKey()),
    }).subscribe(r => {
      this.recurrings.set(r.recurrings);
      this.scheduleds.set(r.scheduleds);
      this.categories.set(r.categories);
      this.settings.set(r.settings);
      this.members.set(r.members);
      this.expenses.set(r.expenses);
      this.loaded.set(true);
    });
  }

  loadMonth(): void { this.api.getExpenses(this.monthKey()).subscribe(e => this.expenses.set(e)); }
  reloadRecurrings(): void { this.api.getRecurrings().subscribe(r => this.recurrings.set(r)); }
  reloadScheduleds(): void { this.api.getScheduleds().subscribe(s => this.scheduleds.set(s)); }
  reloadCategories(): void { this.api.getCategories().subscribe(c => this.categories.set(c)); }
  reloadSettings(): void { this.api.getSettings().subscribe(s => this.settings.set(s)); }
  reloadMembers(): void { this.api.getMembers().subscribe(m => this.members.set(m)); }

  // --- Mutazioni (online-first): scrivono sull'API e ricaricano lo stato interessato. ---

  addExpense(e: Partial<Expense>): Observable<Expense> {
    return this.api.createExpense(e).pipe(tap(() => this.loadMonth()));
  }

  updateExpenseById(id: number, e: Partial<Expense>): Observable<Expense> {
    return this.api.updateExpense(id, e).pipe(tap(() => this.loadMonth()));
  }

  deleteExpenseById(id: number): Observable<unknown> {
    return this.api.deleteExpense(id).pipe(tap(() => this.loadMonth()));
  }

  // "Segna come pagata": trasforma una proiezione in spesa reale (con recurringId/scheduledId).
  payProjected(d: DisplayExpense): Observable<Expense> {
    return this.addExpense({
      desc: d.desc, amount: d.amount, cat: d.cat, payer: d.payer, date: d.date,
      tipo: d.tipo, recurringId: d.recurringId ?? null, scheduledId: d.scheduledId ?? null,
    });
  }

  addRecurring(r: Partial<Recurring>): Observable<Recurring> {
    return this.api.createRecurring(r).pipe(tap(() => { this.reloadRecurrings(); this.loadMonth(); }));
  }

  updateRecurringById(id: number, r: Partial<Recurring>): Observable<Recurring> {
    return this.api.updateRecurring(id, r).pipe(tap(() => { this.reloadRecurrings(); this.loadMonth(); }));
  }

  deleteRecurringById(id: number): Observable<unknown> {
    return this.api.deleteRecurring(id).pipe(tap(() => { this.reloadRecurrings(); this.loadMonth(); }));
  }

  addScheduled(s: Partial<Scheduled>): Observable<Scheduled> {
    return this.api.createScheduled(s).pipe(tap(() => { this.reloadScheduleds(); this.loadMonth(); }));
  }

  deleteScheduledById(id: number): Observable<unknown> {
    return this.api.deleteScheduled(id).pipe(tap(() => { this.reloadScheduleds(); this.loadMonth(); }));
  }

  addCategory(c: { label: string; common: boolean; icon?: string }): Observable<CustomCategory> {
    return this.api.createCategory(c).pipe(tap(() => this.reloadCategories()));
  }

  deleteCategoryById(id: number): Observable<unknown> {
    return this.api.deleteCategory(id).pipe(tap(() => this.reloadCategories()));
  }

  saveSettings(s: { risparmio: number; model: string; modelLabel?: string }): Observable<Settings> {
    return this.api.updateSettings(s).pipe(tap(r => this.settings.set(r)));
  }

  updateMemberIncome(id: number, monthlyIncome: number, displayName?: string): Observable<Member> {
    return this.api.updateMember(id, { monthlyIncome, displayName }).pipe(tap(() => this.reloadMembers()));
  }
}
