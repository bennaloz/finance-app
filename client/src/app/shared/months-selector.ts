import { Component, computed, input, model, signal } from '@angular/core';

/**
 * Selettore dell'orizzonte in mesi: una combo con valori predefiniti più la voce
 * "Personalizzato…", che rivela un campo numerico per un valore libero.
 * Il valore è in two-way binding (model) così il genitore può persisterlo.
 */
@Component({
  selector: 'app-months-selector',
  imports: [],
  template: `
    <div class="ms">
      <span class="ms-label">{{ label() }}</span>
      <select class="field-input ms-select" [value]="selectValue()"
              (change)="onSelect($any($event.target).value)" aria-label="Numero di mesi">
        @for (p of presets(); track p) { <option [value]="p">{{ p }} mesi</option> }
        <option value="custom">Personalizzato…</option>
      </select>
      @if (isCustom()) {
        <input class="field-input ms-custom" type="number" inputmode="numeric"
               [min]="min()" [max]="max()" [value]="value()"
               (input)="onCustom($any($event.target).value)"
               aria-label="Numero di mesi personalizzato" />
      }
    </div>
  `,
  styles: [`
    .ms { display: flex; align-items: center; gap: .5rem; flex-wrap: wrap; }
    .ms-label { font-size: 12px; color: var(--color-text-secondary); text-transform: uppercase; letter-spacing: .05em; }
    .ms-select { flex: 1; min-width: 0; }
    .ms-custom { width: 5rem; flex: 0 0 auto; }
  `],
})
export class MonthsSelector {
  /** Numero di mesi selezionato (two-way). */
  value = model.required<number>();
  label = input('Mesi');
  presets = input<number[]>([3, 6, 12, 24]);
  min = input(1);
  max = input(36);

  // Una volta scelto "Personalizzato…" resta in modalità custom anche se il valore
  // digitato coincide con un preset, finché l'utente non torna a sceglierne uno.
  private forceCustom = signal(false);

  isCustom = computed(() => this.forceCustom() || !this.presets().includes(this.value()));
  selectValue = computed(() => (this.isCustom() ? 'custom' : String(this.value())));

  onSelect(v: string): void {
    if (v === 'custom') { this.forceCustom.set(true); return; }
    this.forceCustom.set(false);
    this.value.set(+v);
  }

  onCustom(raw: string): void {
    const n = parseInt(raw, 10);
    if (isNaN(n)) return;
    this.value.set(Math.min(this.max(), Math.max(this.min(), n)));
  }
}
