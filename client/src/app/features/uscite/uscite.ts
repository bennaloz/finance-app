import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DataStore } from '../../core/data-store';
import { catLabel, fmtDec, memberPayerRef, monthKey } from '../../util/finance-calc';
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

  recOpen = signal(false);
  schedOpen = signal(false);

  catLabel(id: string): string { return catLabel(id, this.ds.categories(), this.ds.members()); }
  freqLabel(f: string): string { return FREQS[f] ?? f; }
  payerLabel(p: string): string {
    if (PAYERS[p]) return PAYERS[p];
    const m = this.ds.members().find(x => memberPayerRef(x.id) === p);
    return m ? m.displayName : p;
  }

  removeRecurring(id: number): void { this.ds.deleteRecurringById(id).subscribe(); }
  removeScheduled(id: number): void { this.ds.deleteScheduledById(id).subscribe(); }
}
