import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DataStore } from '../../core/data-store';
import { fmt } from '../../util/finance-calc';
import { MODELS } from '../../util/i18n';

@Component({
  selector: 'app-impostazioni',
  imports: [FormsModule],
  templateUrl: './impostazioni.html',
})
export class Impostazioni {
  ds = inject(DataStore);
  auth = inject(AuthService);
  private router = inject(Router);
  fmt = fmt;
  models = MODELS;
  modelKeys = Object.keys(MODELS);

  redditoR = signal(0);
  redditoV = signal(0);
  risparmio = signal(0);
  pendingModel = signal('5050');
  newCatLabel = signal('');
  newCatCommon = signal('1');
  private touched = signal(false);

  constructor() {
    // Popola i campi dai settings finché l'utente non inizia a modificarli (come renderImpostazioni).
    effect(() => {
      const s = this.ds.settings();
      if (this.touched()) return;
      this.redditoR.set(s.redditoR);
      this.redditoV.set(s.redditoV);
      this.risparmio.set(s.risparmio || 0);
      this.pendingModel.set(s.model);
    });
  }

  modelDesc = computed(() => MODELS[this.pendingModel()]?.desc ?? '');

  preview = computed(() => {
    const rR = Number(this.redditoR()) || this.ds.settings().redditoR;
    const rV = Number(this.redditoV()) || this.ds.settings().redditoV;
    const ex = 2800;
    const p = rR / (rR + rV || 1);
    const m = this.pendingModel();
    const dR = m === 'prop' ? ex * p : ex / 2;
    const dV = m === 'prop' ? ex * (1 - p) : ex / 2;
    return { ex, dR, dV, pctR: Math.round(dR / ex * 100), pctV: Math.round(dV / ex * 100) };
  });

  markTouched(): void { this.touched.set(true); }
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
    this.ds.saveSettings({
      redditoR: Number(this.redditoR()) || 0,
      redditoV: Number(this.redditoV()) || 0,
      risparmio: Number(this.risparmio()) || 0,
      model: m,
      modelLabel: MODELS[m]?.label ?? m,
    }).subscribe(() => { this.touched.set(false); this.router.navigateByUrl('/'); });
  }

  logout(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}
