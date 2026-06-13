import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from './loading.service';

// Segnala al LoadingService le chiamate API in corso, così l'app può mostrare
// un overlay di caricamento. Serve soprattutto al primo accesso: l'App Service
// può essere "freddo" (cold start) e la prima risposta tardare diverse decine
// di secondi, durante le quali l'interfaccia sembrerebbe altrimenti congelata.
export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes('/api/')) return next(req);
  const loading = inject(LoadingService);
  loading.start();
  return next(req).pipe(finalize(() => loading.stop()));
};
