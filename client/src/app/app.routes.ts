import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';
import { Layout } from './layout/layout';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login').then(m => m.Login) },
  {
    path: '',
    component: Layout,
    canActivate: [authGuard],
    children: [
      { path: '', loadComponent: () => import('./features/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'movimenti', loadComponent: () => import('./features/movimenti/movimenti').then(m => m.Movimenti) },
      { path: 'uscite', loadComponent: () => import('./features/uscite/uscite').then(m => m.Uscite) },
      { path: 'aggiungi', loadComponent: () => import('./features/aggiungi/aggiungi').then(m => m.Aggiungi) },
      { path: 'previsione', loadComponent: () => import('./features/previsione/previsione').then(m => m.Previsione) },
      { path: 'grafici', loadComponent: () => import('./features/grafici/grafici').then(m => m.Grafici) },
      { path: 'impostazioni', loadComponent: () => import('./features/impostazioni/impostazioni').then(m => m.Impostazioni) },
    ],
  },
  { path: '**', redirectTo: '' },
];
