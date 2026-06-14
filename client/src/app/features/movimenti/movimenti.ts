import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataStore } from '../../core/data-store';
import { DisplayExpense } from '../../models/models';
import { catLabel, memberPayerRef } from '../../util/finance-calc';
import { PAYERS } from '../../util/i18n';
import { ExpenseRow } from '../shared/expense-row';

@Component({
  selector: 'app-movimenti',
  imports: [ExpenseRow, FormsModule],
  templateUrl: './movimenti.html',
})
export class Movimenti {
  ds = inject(DataStore);
  private router = inject(Router);

  // Stato dei filtri (testo, categoria, fascia di prezzo). Il pannello avanzato è richiudibile.
  search = signal('');
  catFilter = signal('');
  minPrice = signal<number | null>(null);
  maxPrice = signal<number | null>(null);
  filtersOpen = signal(false);

  private allExpenses = computed(() =>
    [...this.ds.projected()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

  // Categorie effettivamente presenti tra le uscite del mese, per il menu a tendina.
  catOptions = computed(() => {
    const ids = new Set(this.allExpenses().map(e => e.cat));
    return [...ids]
      .map(id => ({ id, label: this.catLabel(id) }))
      .sort((a, b) => a.label.localeCompare(b.label));
  });

  expenses = computed(() => {
    const q = this.search().trim().toLowerCase();
    const cat = this.catFilter();
    const min = this.minPrice();
    const max = this.maxPrice();
    return this.allExpenses().filter(e => {
      if (cat && e.cat !== cat) return false;
      if (min != null && e.amount < min) return false;
      if (max != null && e.amount > max) return false;
      if (q) {
        const hay = `${e.desc} ${this.catLabel(e.cat)} ${this.payerLabel(e.payer)}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  filtersActive = computed(() =>
    this.search().trim() !== '' || this.catFilter() !== '' || this.minPrice() != null || this.maxPrice() != null);

  totalCount = computed(() => this.allExpenses().length);

  catLabel(id: string): string { return catLabel(id, this.ds.categories(), this.ds.members()); }
  payerLabel(p: string): string {
    if (PAYERS[p]) return PAYERS[p];
    const m = this.ds.members().find(x => memberPayerRef(x.id) === p);
    return m ? m.displayName : p;
  }

  resetFilters(): void {
    this.search.set('');
    this.catFilter.set('');
    this.minPrice.set(null);
    this.maxPrice.set(null);
  }

  pay(e: DisplayExpense): void { this.ds.payProjected(e).subscribe(); }
  edit(e: DisplayExpense): void { this.router.navigate(['/aggiungi'], { queryParams: { edit: e.id } }); }
  remove(e: DisplayExpense): void {
    if (typeof e.id === 'number') this.ds.deleteExpenseById(e.id).subscribe();
  }
}
