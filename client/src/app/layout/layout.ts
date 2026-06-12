import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { DataStore } from '../core/data-store';
import { MONTHS, SCREENS } from '../util/i18n';

// Shell dell'app: topbar con navigazione mese + bottom-nav a 6 voci, come l'app vanilla.
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.html',
})
export class Layout implements OnInit {
  ds = inject(DataStore);
  private router = inject(Router);

  // path della route figlia corrente (per il titolo in topbar)
  private path = signal(this.cleanUrl(this.router.url));
  title = computed(() => SCREENS[this.pathToKey(this.path())] ?? 'CasaFinanze');
  monthLabel = computed(() => `${MONTHS[this.ds.month()]} ${this.ds.year()}`);

  // Lo swipe per cambiare mese ha senso solo sulle schermate legate al mese,
  // non su Aggiungi (form) e Impostazioni.
  private monthSwipeEnabled = computed(() => !['aggiungi', 'impostazioni'].includes(this.path()));
  private touchX = 0;
  private touchY = 0;

  onTouchStart(e: TouchEvent): void {
    const t = e.changedTouches[0];
    this.touchX = t.clientX;
    this.touchY = t.clientY;
  }

  onTouchEnd(e: TouchEvent): void {
    if (!this.monthSwipeEnabled()) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - this.touchX;
    const dy = t.clientY - this.touchY;
    // Solo swipe orizzontali netti, per non scattare durante lo scroll verticale.
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.8) {
      this.ds.changeMonth(dx < 0 ? 1 : -1);
    }
  }

  ngOnInit(): void {
    if (!this.ds.loaded()) this.ds.loadAll();
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(e => this.path.set(this.cleanUrl(e.urlAfterRedirects)));
  }

  private cleanUrl(url: string): string {
    return url.split('?')[0].replace(/^\//, '');
  }

  // mappa il path della route alla chiave usata in SCREENS (i18n)
  private pathToKey(path: string): string {
    const map: Record<string, string> = {
      '': 'dash', movimenti: 'uscite', uscite: 'ricorrenti', aggiungi: 'aggiungi',
      previsione: 'previsione', grafici: 'grafici', impostazioni: 'impostazioni',
    };
    return map[path] ?? 'dash';
  }
}
