import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap, of, filter, take, timeout, catchError } from 'rxjs';
import { toObservable } from '@angular/core/rxjs-interop';
import { User } from '../models/user';

interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = '/api/auth';
  private readonly tokenKey = 'kognita_token';
  private readonly userKey = 'kognita_user';

  readonly user = signal<User | null>(null);
  readonly isAuthenticated = computed(() => !!this.user());

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    this.loadSession();
  }

  register(name: string, email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/register`, { name, email, password });
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.api}/login`, { email, password })
      .pipe(tap((res) => this.saveSession(res)));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.user.set(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  waitForUser(): Observable<User> {
    const current = this.user();
    if (current) {
      return of(current);
    }
    return toObservable(this.user).pipe(
      filter((u): u is User => u !== null),
      take(1),
      timeout(10_000),
      catchError(() => of(null as unknown as User)),
    );
  }

  updateUserSession(updatedUser: User): void {
    localStorage.setItem(this.userKey, JSON.stringify(updatedUser));
    this.user.set(updatedUser);
  }

  private saveSession(res: AuthResponse): void {
    localStorage.setItem(this.tokenKey, res.token);
    localStorage.setItem(this.userKey, JSON.stringify(res.user));
    this.user.set(res.user);
  }

  private loadSession(): void {
    const token = localStorage.getItem(this.tokenKey);
    const userJson = localStorage.getItem(this.userKey);
    if (token && userJson) {
      try {
        this.user.set(JSON.parse(userJson));
      } catch (e) {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
      }
    }
  }
}
