import { Component, effect, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdateService } from './core/sw-update.service';
import { ThemeService } from './core/theme.service';
import { LoadingService } from './core/loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  protected readonly title = signal('client');
  protected readonly sw = inject(SwUpdateService);
  private readonly theme = inject(ThemeService);
  private readonly loading = inject(LoadingService);

  // Overlay di caricamento globale: compare solo se l'attesa supera una breve
  // soglia (per non lampeggiare sulle risposte veloci) e, se si prolunga,
  // mostra il messaggio di "avvio del server" tipico del cold start.
  protected readonly showOverlay = signal(false);
  protected readonly slow = signal(false);
  private showTimer?: ReturnType<typeof setTimeout>;
  private slowTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.sw.init();
    this.theme.init();

    effect(() => {
      if (this.loading.active()) {
        this.showTimer ??= setTimeout(() => this.showOverlay.set(true), 400);
        this.slowTimer ??= setTimeout(() => this.slow.set(true), 4000);
      } else {
        this.clearTimers();
        this.showOverlay.set(false);
        this.slow.set(false);
      }
    });
  }

  private clearTimers(): void {
    clearTimeout(this.showTimer); this.showTimer = undefined;
    clearTimeout(this.slowTimer); this.slowTimer = undefined;
  }
}
