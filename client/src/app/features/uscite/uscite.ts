import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataStore } from '../../core/data-store';
import { catLabel, fmtDec, monthKey } from '../../util/finance-calc';
import { FREQS, PAYERS } from '../../util/i18n';

@Component({
  selector: 'app-uscite',
  imports: [RouterLink],
  templateUrl: './uscite.html',
})
export class Uscite {
  ds = inject(DataStore);
  fmtDec = fmtDec;
  FREQS = FREQS;
  PAYERS = PAYERS;

  private now = new Date();
  nowMonth = monthKey(this.now.getFullYear(), this.now.getMonth());

  scheduledSorted = computed(() => [...this.ds.scheduleds()].sort((a, b) => a.month.localeCompare(b.month)));

  catLabel(id: string): string { return catLabel(id, this.ds.categories()); }
  freqLabel(f: string): string { return FREQS[f] ?? f; }
  payerLabel(p: string): string { return PAYERS[p] ?? p; }

  removeRecurring(id: number): void { this.ds.deleteRecurringById(id).subscribe(); }
  removeScheduled(id: number): void { this.ds.deleteScheduledById(id).subscribe(); }
}
