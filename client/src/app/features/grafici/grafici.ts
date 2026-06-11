import { Component, computed, effect, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { ApiService } from '../../core/api.service';
import { DataStore } from '../../core/data-store';
import { catClassFor, catLabel, fmtDec, monthKey } from '../../util/finance-calc';
import { CAT_COLORS, MONTHS } from '../../util/i18n';

@Component({
  selector: 'app-grafici',
  imports: [],
  templateUrl: './grafici.html',
})
export class Grafici {
  ds = inject(DataStore);
  private api = inject(ApiService);
  fmtDec = fmtDec;

  // Totali reali degli ultimi 6 mesi (caricati dall'API, perché lo store tiene solo il mese corrente).
  private monthsTotals = signal<{ label: string; total: number }[]>([]);

  // Geometria grafico a barre (identica all'app vanilla).
  private readonly W = 320; private readonly H = 180;
  private readonly padT = 18; private readonly padB = 28; private readonly padL = 4; private readonly padR = 4;

  constructor() {
    // Ricarica il trend quando cambia il mese visualizzato.
    effect(() => { this.ds.year(); this.ds.month(); this.loadTrend(); });
  }

  private loadTrend(): void {
    const mks: { mk: string; label: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      let y = this.ds.year(), m = this.ds.month() - i;
      while (m < 0) { m += 12; y--; }
      mks.push({ mk: monthKey(y, m), label: MONTHS[m].slice(0, 3) });
    }
    forkJoin(mks.map(x => this.api.getExpenses(x.mk))).subscribe(results => {
      this.monthsTotals.set(results.map((exps, i) => ({
        label: mks[i].label, total: exps.reduce((a, e) => a + e.amount, 0),
      })));
    });
  }

  chart = computed(() => {
    const s = this.ds.settings();
    const totR = s.redditoR + s.redditoV;
    const months = this.monthsTotals();
    const maxVal = Math.max(totR, ...months.map(x => x.total), 1);
    const chartH = this.H - this.padT - this.padB;
    const bw = (this.W - this.padL - this.padR) / (months.length || 1);
    const bars = months.map((x, i) => {
      const bh = Math.max(chartH * (x.total / maxVal), x.total > 0 ? 2 : 0);
      const bWidth = bw * 0.6, bx = this.padL + i * bw + bw * 0.2, by = this.padT + chartH - bh;
      return {
        x: bx, y: by, w: bWidth, h: bh, over: totR > 0 && x.total > totR,
        cx: bx + bWidth / 2, valY: by - 4, labelY: this.H - this.padB + 14,
        valLabel: (Math.round(x.total / 100) / 10).toLocaleString('it-IT') + 'k',
        showVal: x.total > 0, label: x.label,
      };
    });
    let lineY: number | null = null;
    if (totR > 0 && totR <= maxVal) lineY = this.padT + chartH * (1 - totR / maxVal);
    return { W: this.W, H: this.H, padL: this.padL, padR: this.padR, bars, lineY };
  });

  catRows = computed(() => {
    const exps = this.ds.projected();
    const byCat: Record<string, number> = {};
    for (const e of exps) byCat[e.cat] = (byCat[e.cat] || 0) + e.amount;
    const rows = Object.keys(byCat).map(c => ({ cat: c, total: byCat[c] })).sort((a, b) => b.total - a.total);
    const maxCat = Math.max(...rows.map(r => r.total), 1);
    return rows.map(r => ({
      label: catLabel(r.cat, this.ds.categories()),
      total: r.total,
      pct: (r.total / maxCat) * 100,
      color: CAT_COLORS[catClassFor(r.cat)] || CAT_COLORS['custom'],
    }));
  });
}
