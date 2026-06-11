import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthResponse } from '../models/models';

const TOKEN_KEY = 'casafinanze_token';
const USER_KEY = 'casafinanze_user';

interface CurrentUser { email: string; displayName: string; householdId: number; }

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private base = environment.apiBaseUrl;
  private _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  user = signal<CurrentUser | null>(JSON.parse(localStorage.getItem(USER_KEY) || 'null'));
  isLoggedIn = computed(() => !!this._token());

  get token(): string | null { return this._token(); }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/api/auth/login`, { email, password }).pipe(tap(r => this.store(r)));
  }

  register(email: string, password: string, displayName: string, householdName: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/api/auth/register`, { email, password, displayName, householdName }).pipe(tap(r => this.store(r)));
  }

  addUser(email: string, password: string, displayName: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/api/auth/users`, { email, password, displayName });
  }

  logout(): void {
    this._token.set(null);
    this.user.set(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  private store(r: AuthResponse): void {
    this._token.set(r.token);
    this.user.set({ email: r.email, displayName: r.displayName, householdId: r.householdId });
    localStorage.setItem(TOKEN_KEY, r.token);
    localStorage.setItem(USER_KEY, JSON.stringify(this.user()));
  }
}
