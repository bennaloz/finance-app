import { Injectable, computed, signal } from '@angular/core';

/**
 * Conta le richieste HTTP verso l'API in volo, così l'overlay di caricamento
 * globale (vedi App) sa quando mostrarsi. Pilotato da loadingInterceptor.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly count = signal(0);

  /** true finché c'è almeno una richiesta API in corso. */
  readonly active = computed(() => this.count() > 0);

  start(): void { this.count.update(c => c + 1); }
  stop(): void { this.count.update(c => Math.max(0, c - 1)); }
}
