import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SwUpdateService } from './core/sw-update.service';
import { ThemeService } from './core/theme.service';

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

  constructor() {
    this.sw.init();
    this.theme.init();
  }
}
