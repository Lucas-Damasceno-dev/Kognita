import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, timeout, TimeoutError } from 'rxjs';
import { ToastService } from '../services/toast.service';

const statusMessages: Record<number, string> = {
  0: 'Erro de conexão. Verifique se o servidor está rodando.',
  401: 'Sessão expirada. Faça login novamente.',
  403: 'Acesso negado.',
  404: 'Recurso não encontrado.',
  409: 'Conflito — o registro já existe.',
  422: 'Dados inválidos.',
  500: 'Erro interno do servidor.',
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const toast = inject(ToastService);
  const token = localStorage.getItem('kognita_token');
  const isApiRequest = req.url.includes('/api/');
  if (token && isApiRequest) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req).pipe(
    timeout(30_000),
    catchError((err) => {
      if (err instanceof TimeoutError) {
        toast.error('O servidor não respondeu. Tente novamente.');
      } else if (!req.url.includes('/api/auth/')) {
        const msg = statusMessages[err.status] || `Erro na requisição (${err.status})`;
        toast.error(msg);
      }
      return throwError(() => err);
    }),
  );
};
