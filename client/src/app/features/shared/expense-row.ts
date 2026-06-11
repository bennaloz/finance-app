import { Component, computed, inject, input, output } from '@angular/core';
import { DisplayExpense } from '../../models/models';
import { DataStore } from '../../core/data-store';
import { catClassFor, catIcon, catLabel } from '../../util/finance-calc';
import { fmtDec } from '../../util/finance-calc';
import { PAYERS } from '../../util/i18n';

// Riga di una spesa (reale o proiezione). Presentazionale: emette gli eventi, non muta lo stato.
@Component({
  selector: 'app-expense-row',
  template: `
    <div class="expense-row" [style.opacity]="e().projected ? 0.6 : 1">
      <div class="exp-icon cat-{{ catClass() }}" aria-hidden="true"><i class="ti {{ icon() }}"></i></div>
      <div class="exp-info">
        <div class="exp-name">
          {{ e().desc }}
          @if (e().tipo === 'ricorrente') {
            <span class="pill pill-rec"><i class="ti ti-repeat" aria-hidden="true"></i> ric.</span>
          } @else if (e().tipo === 'programmata') {
            <span class="pill pill-prog"><i class="ti ti-calendar-event" aria-hidden="true"></i> prog.</span>
          }
        </div>
        <div class="exp-cat">{{ label() }} · {{ payer() }}</div>
      </div>
      <span class="exp-amount">{{ fmtDec(e().amount) }}</span>
      <div class="exp-actions">
        @if (e().projected) {
          <button (click)="pay.emit(e())" aria-label="Segna come pagata" title="Segna come pagata"><i class="ti ti-check" aria-hidden="true"></i></button>
          <span style="font-size:10px;color:var(--color-text-secondary);margin-left:2px">prev.</span>
        } @else {
          @if ((e().tipo || 'singola') === 'singola') {
            <button (click)="edit.emit(e())" aria-label="Modifica"><i class="ti ti-pencil" aria-hidden="true"></i></button>
          }
          <button (click)="remove.emit(e())" aria-label="Elimina"><i class="ti ti-trash" aria-hidden="true"></i></button>
        }
      </div>
    </div>
  `,
})
export class ExpenseRow {
  private ds = inject(DataStore);
  e = input.required<DisplayExpense>();
  pay = output<DisplayExpense>();
  edit = output<DisplayExpense>();
  remove = output<DisplayExpense>();

  catClass = computed(() => catClassFor(this.e().cat));
  icon = computed(() => catIcon(this.e().cat, this.ds.categories()));
  label = computed(() => catLabel(this.e().cat, this.ds.categories()));
  payer = computed(() => PAYERS[this.e().payer] ?? this.e().payer);
  fmtDec = fmtDec;
}
