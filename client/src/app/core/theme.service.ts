import { Injectable, signal } from '@angular/core';

// Preferenza di tema scelta dall'utente. 'system' segue le impostazioni del dispositivo.
export type ThemePref = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'casafinanze_theme';

// Gestisce il tema chiaro/scuro. La preferenza è una scelta del dispositivo (non del
// nucleo) → vive in localStorage, non sul backend. Applica il tema impostando
// `data-theme` su <html>; gli override di colore stanno in styles.css.
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly pref = signal<ThemePref>(this.read());
  // matchMedia può mancare in ambienti non-browser (test/SSR): in tal caso restiamo sul chiaro.
  private readonly media =
    typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;

  init(): void {
    this.apply(this.pref());
    // Se siamo in modalità "system", segui i cambi di tema del dispositivo in tempo reale.
    this.media?.addEventListener('change', () => {
      if (this.pref() === 'system') this.apply('system');
    });
  }

  set(pref: ThemePref): void {
    this.pref.set(pref);
    try {
      localStorage.setItem(STORAGE_KEY, pref);
    } catch {
      /* storage non disponibile: il tema resta valido per la sessione corrente */
    }
    this.apply(pref);
  }

  private apply(pref: ThemePref): void {
    const dark = pref === 'dark' || (pref === 'system' && !!this.media?.matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  }

  private read(): ThemePref {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === 'light' || v === 'dark' || v === 'system') return v;
    } catch {
      /* ignora */
    }
    return 'system';
  }
}
