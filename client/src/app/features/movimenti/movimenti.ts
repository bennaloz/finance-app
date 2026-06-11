import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { DataStore } from '../../core/data-store';
import { DisplayExpense } from '../../models/models';
import { ExpenseRow } from '../shared/expense-row';

@Component({
  selector: 'app-movimenti',
  imports: [ExpenseRow],
  templateUrl: './movimenti.html',
})
export class Movimenti {
  ds = inject(DataStore);
  private router = inject(Router);

  expenses = computed(() =>
    [...this.ds.projected()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

  pay(e: DisplayExpense): void { this.ds.payProjected(e).subscribe(); }
  edit(e: DisplayExpense): void { this.router.navigate(['/aggiungi'], { queryParams: { edit: e.id } }); }
  remove(e: DisplayExpense): void {
    if (typeof e.id === 'number') this.ds.deleteExpenseById(e.id).subscribe();
  }
}
