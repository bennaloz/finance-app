import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { environment } from '../../environments/environment';
import { CustomCategory, Expense, Recurring, Scheduled, Settings } from '../models/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  // Base URL del backend: vuoto in dev (proxy), URL dell'App Service in prod.
  private base = environment.apiBaseUrl;

  getExpenses(month: string) { return this.http.get<Expense[]>(`${this.base}/api/expenses?month=${month}`); }
  createExpense(e: Partial<Expense>) { return this.http.post<Expense>(`${this.base}/api/expenses`, e); }
  updateExpense(id: number, e: Partial<Expense>) { return this.http.put<Expense>(`${this.base}/api/expenses/${id}`, e); }
  deleteExpense(id: number) { return this.http.delete(`${this.base}/api/expenses/${id}`); }

  getRecurrings() { return this.http.get<Recurring[]>(`${this.base}/api/recurring`); }
  createRecurring(r: Partial<Recurring>) { return this.http.post<Recurring>(`${this.base}/api/recurring`, r); }
  deleteRecurring(id: number) { return this.http.delete(`${this.base}/api/recurring/${id}`); }

  getScheduleds() { return this.http.get<Scheduled[]>(`${this.base}/api/scheduled`); }
  createScheduled(s: Partial<Scheduled>) { return this.http.post<Scheduled>(`${this.base}/api/scheduled`, s); }
  deleteScheduled(id: number) { return this.http.delete(`${this.base}/api/scheduled/${id}`); }

  getSettings() { return this.http.get<Settings>(`${this.base}/api/settings`); }
  updateSettings(s: { redditoR: number; redditoV: number; risparmio: number; model: string; modelLabel?: string }) {
    return this.http.put<Settings>(`${this.base}/api/settings`, s);
  }

  getCategories() { return this.http.get<CustomCategory[]>(`${this.base}/api/categories`); }
  createCategory(c: { label: string; common: boolean; icon?: string }) { return this.http.post<CustomCategory>(`${this.base}/api/categories`, c); }
  deleteCategory(id: number) { return this.http.delete(`${this.base}/api/categories/${id}`); }
}
