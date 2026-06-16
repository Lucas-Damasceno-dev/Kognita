import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, timeout, TimeoutError } from 'rxjs';
import { ToastService } from '../services/toast.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const token = localStorage.getItem('kognita_token');
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req).pipe(
    timeout(30_000),
    catchError(err => {
      if (err instanceof TimeoutError) {
        toast.error('Request timed out. Check if the server is running.');
      } else if (!req.url.includes('/api/auth/')) {
        toast.error(err.status === 0 ? 'Network error' : `Request failed (${err.status})`);
      }
      return throwError(() => err);
    }),
  );
};
