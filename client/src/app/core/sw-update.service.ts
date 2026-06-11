import { ApplicationRef, Injectable, inject, signal } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { concat, interval } from 'rxjs';
import { filter, first } from 'rxjs/operators';

// Gestisce gli aggiornamenti della PWA: rileva una nuova versione pubblicata
// e la espone tramite `updateReady` così il layout può mostrare il banner.
@Injectable({ providedIn: 'root' })
export class SwUpdateService {
  private swUpdate = inject(SwUpdate);
  private appRef = inject(ApplicationRef);

  // true quando una nuova versione è stata scaricata ed è pronta da attivare.
  readonly updateReady = signal(false);

  init(): void {
    // In sviluppo il service worker è disabilitato: non c'è nulla da controllare.
    if (!this.swUpdate.isEnabled) return;

    // Una nuova versione è stata scaricata in background ed è pronta.
    this.swUpdate.versionUpdates
      .pipe(filter((e): e is VersionReadyEvent => e.type === 'VERSION_READY'))
      .subscribe(() => this.updateReady.set(true));

    // Controlla appena l'app è stabile e poi ogni 6 ore.
    const appStable$ = this.appRef.isStable.pipe(first((stable) => stable === true));
    const everySixHours$ = interval(6 * 60 * 60 * 1000);
    concat(appStable$, everySixHours$).subscribe(() => this.checkForUpdate());

    // Controlla anche ogni volta che l'app torna in primo piano (riapertura PWA).
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') this.checkForUpdate();
    });
  }

  // Attiva la nuova versione e ricarica l'app.
  async applyUpdate(): Promise<void> {
    try {
      await this.swUpdate.activateUpdate();
    } finally {
      document.location.reload();
    }
  }

  private checkForUpdate(): void {
    this.swUpdate.checkForUpdate().catch(() => {
      /* offline o errore di rete: riproveremo al prossimo controllo */
    });
  }
}
