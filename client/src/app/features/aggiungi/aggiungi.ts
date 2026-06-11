import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataStore } from '../../core/data-store';
import { allCatIds, catFormLabel, monthKey } from '../../util/finance-calc';
import { FREQS } from '../../util/i18n';

type Tipo = 'singola' | 'ricorrente' | 'programmata';

@Component({
  selector: 'app-aggiungi',
  imports: [FormsModule],
  templateUrl: './aggiungi.html',
})
export class Aggiungi implements OnInit {
  ds = inject(DataStore);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  freqList = Object.entries(FREQS).map(([key, value]) => ({ key, value }));

  tipo = signal<Tipo>('singola');
  editingId = signal<number | null>(null);

  // campi del form
  desc = signal('');
  amount = signal<number | null>(null);
  cat = signal('common');
  payer = signal('comune');
  date = signal('');
  freq = signal('mensile');
  fromMonth = signal('');
  toMonth = signal('');
  chargeDay = signal<number | null>(null);
  progMonth = signal('');
  error = signal('');

  catOptions = computed(() =>
    allCatIds(this.ds.categories()).map(id => ({ id, label: catFormLabel(id, this.ds.categories()) })));

  saveLabel = computed(() => (this.tipo() === 'singola' && this.editingId()) ? 'Aggiorna' : 'Salva');

  ngOnInit(): void {
    const now = new Date();
    const nowMonth = monthKey(now.getFullYear(), now.getMonth());
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    this.date.set(today);
    this.fromMonth.set(nowMonth);
    this.progMonth.set(nowMonth);

    const qp = this.route.snapshot.queryParamMap;
    const editId = qp.get('edit');
    const tipo = qp.get('tipo') as Tipo | null;

    if (editId && /^\d+$/.test(editId)) {
      const e = this.ds.expenses().find(x => x.id === Number(editId));
      if (e) {
        this.editingId.set(e.id);
        this.tipo.set('singola');
        this.desc.set(e.desc); this.amount.set(e.amount); this.cat.set(e.cat);
        this.payer.set(e.payer); this.date.set(e.date);
        return;
      }
    }
    if (tipo === 'singola' || tipo === 'ricorrente' || tipo === 'programmata') this.tipo.set(tipo);
  }

  setTipo(t: Tipo): void {
    if (t !== 'singola') this.editingId.set(null);
    this.tipo.set(t);
  }

  save(): void {
    this.error.set('');
    const desc = this.desc().trim();
    const amount = Number(this.amount());
    if (!desc || isNaN(amount) || amount <= 0) { this.error.set('Compila descrizione e importo.'); return; }
    const base = { desc, amount, cat: this.cat(), payer: this.payer() };

    if (this.tipo() === 'ricorrente') {
      if (!this.fromMonth()) { this.error.set('Indica il mese di inizio.'); return; }
      const cd = Number(this.chargeDay());
      this.ds.addRecurring({
        ...base, freq: this.freq(), fromMonth: this.fromMonth(),
        toMonth: this.toMonth() || null,
        chargeDay: (!isNaN(cd) && cd >= 1 && cd <= 31) ? cd : null,
      }).subscribe(() => this.router.navigateByUrl('/uscite'));
    } else if (this.tipo() === 'programmata') {
      if (!this.progMonth()) { this.error.set('Indica il mese previsto.'); return; }
      this.ds.addScheduled({ ...base, month: this.progMonth() })
        .subscribe(() => this.router.navigateByUrl('/uscite'));
    } else {
      if (!this.date()) { this.error.set('Indica la data.'); return; }
      const id = this.editingId();
      if (id) {
        this.ds.updateExpenseById(id, { ...base, date: this.date() })
          .subscribe(() => this.router.navigateByUrl('/movimenti'));
      } else {
        this.ds.addExpense({ ...base, date: this.date(), tipo: 'singola' })
          .subscribe(() => this.router.navigateByUrl('/movimenti'));
      }
    }
  }

  cancel(): void {
    this.router.navigateByUrl(this.tipo() === 'singola' ? '/movimenti' : '/uscite');
  }
}
