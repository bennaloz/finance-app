import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  templateUrl: './login.html',
})
export class Login {
  private auth = inject(AuthService);
  private router = inject(Router);

  mode = signal<'login' | 'register'>('login');
  // In registrazione: 'new' crea una nuova casa, 'join' entra in una casa esistente col codice.
  joinMode = signal<'new' | 'join'>('new');
  email = signal('');
  password = signal('');
  displayName = signal('');
  householdName = signal('');
  joinCode = signal('');
  error = signal('');
  busy = signal(false);

  toggle(): void {
    this.error.set('');
    this.mode.set(this.mode() === 'login' ? 'register' : 'login');
  }

  setJoinMode(m: 'new' | 'join'): void {
    this.error.set('');
    this.joinMode.set(m);
  }

  submit(): void {
    if (this.busy()) return;
    this.error.set('');
    this.busy.set(true);
    const done = {
      next: () => this.router.navigateByUrl('/'),
      error: (e: { error?: { message?: string } }) => {
        this.error.set(e?.error?.message || 'Operazione non riuscita. Controlla i dati e riprova.');
        this.busy.set(false);
      },
    };
    if (this.mode() === 'login') {
      this.auth.login(this.email().trim(), this.password()).subscribe(done);
    } else {
      const joining = this.joinMode() === 'join';
      this.auth.register(
        this.email().trim(), this.password(), this.displayName().trim() || 'Riccardo',
        joining ? '' : (this.householdName().trim() || 'Casa'),
        joining ? this.joinCode().trim() : '',
      ).subscribe(done);
    }
  }
}
