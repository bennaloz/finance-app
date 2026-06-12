import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { DataStore } from '../../core/data-store';
import { fmt } from '../../util/finance-calc';
import { MODELS } from '../../util/i18n';
import { environment } from '../../../environments/environment';
import { ThemeService, ThemePref } from '../../core/theme.service';

@Component({
  selector: 'app-impostazioni',
  imports: [FormsModule],
  templateUrl: './impostazioni.html',
})
export class Impostazioni {
  ds = inject(DataStore);
  auth = inject(AuthService);
  theme = inject(ThemeService);
  private router = inject(Router);
  fmt = fmt;
  models = MODELS;
  modelKeys = Object.keys(MODELS);
  appVersion = environment.version;
  themeOptions: { key: ThemePref; label: string; icon: string }[] = [
    { key: 'system', label: 'Sistema', icon: 'ti-device-mobile' },
    { key: 'light', label: 'Chiaro', icon: 'ti-sun' },
    { key: 'dark', label: 'Scuro', icon: 'ti-moon' },
  ];

  // Redditi editabili per membro (popolati dai membri del nucleo).
  editMembers = signal<{ id: number; displayName: string; income: number }[]>([]);
  risparmio = signal(0);
  pendingModel = signal('5050');
  newCatLabel = signal('');
  newCatCommon = signal('1');
  copied = signal(false);
  private touched = signal(false);

  copyCode(): void {
    const code = this.auth.user()?.joinCode;
    if (!code) return;
    navigator.clipboard?.writeText(code);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }

  constructor() {
    // Aggiorna i membri all'apertura: un nuovo membro può essersi unito col codice
    // dopo il login (quando la lista era stata caricata).
    this.ds.reloadMembers();
    // Popola i campi dai settings/membri finché l'utente non inizia a modificarli.
    effect(() => {
      const s = this.ds.settings();
      const members = this.ds.members();
      if (this.touched()) return;
      this.risparmio.set(s.risparmio || 0);
      this.pendingModel.set(s.model);
      this.editMembers.set(members.map(m => ({ id: m.id, displayName: m.displayName, income: m.monthlyIncome })));
    });
  }

  modelDesc = computed(() => MODELS[this.pendingModel()]?.desc ?? '');

  // Esempio di divisione di una spesa comune, per ciascun membro col modello scelto.
  preview = computed(() => {
    const members = this.editMembers();
    const ex = 2800;
    const totalIncome = members.reduce((a, m) => a + (Number(m.income) || 0), 0);
    const n = members.length;
    const rows = members.map(m => {
      const due = this.pendingModel() === 'prop' && totalIncome > 0
        ? ex * ((Number(m.income) || 0) / totalIncome)
        : (n > 0 ? ex / n : 0);
      return { name: m.displayName, due, pct: Math.round(due / ex * 100) };
    });
    return { ex, rows };
  });

  // Parsifica lo snapshot redditi dello storico in un testo "Nome: €x · ...".
  incomesSummary(json: string): string {
    try {
      const obj = JSON.parse(json || '{}') as Record<string, number>;
      return Object.entries(obj).map(([k, v]) => `${k}: ${fmt(v)}`).join(' · ');
    } catch {
      return '';
    }
  }

  markTouched(): void { this.touched.set(true); }
  setIncome(id: number, value: number): void {
    this.touched.set(true);
    this.editMembers.update(list => list.map(m => m.id === id ? { ...m, income: value } : m));
  }
  selectModel(m: string): void { this.touched.set(true); this.pendingModel.set(m); }

  addCat(): void {
    const label = this.newCatLabel().trim();
    if (!label) return;
    this.ds.addCategory({ label, common: this.newCatCommon() === '1', icon: 'ti-tag' })
      .subscribe(() => this.newCatLabel.set(''));
  }

  removeCat(id: number): void {
    if (!confirm('Rimuovere questa categoria? Le spese esistenti che la usano resteranno, ma senza nome categoria.')) return;
    this.ds.deleteCategoryById(id).subscribe();
  }

  save(): void {
    const m = this.pendingModel();
    // Salva in parallelo le impostazioni e il reddito di ogni membro.
    forkJoin([
      this.ds.saveSettings({ risparmio: Number(this.risparmio()) || 0, model: m, modelLabel: MODELS[m]?.label ?? m }),
      ...this.editMembers().map(em => this.ds.updateMemberIncome(em.id, Number(em.income) || 0)),
    ]).subscribe(() => { this.touched.set(false); this.router.navigateByUrl('/'); });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
