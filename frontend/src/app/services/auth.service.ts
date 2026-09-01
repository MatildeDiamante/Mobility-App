// Authentication service for handling user login, logout, and session management
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, tap } from 'rxjs';
import { AuthUser } from '../models/auth-user.model';

// Describes the answer Angular expects to receive from POST /api/auth/login
interface LoginResponse {
  user: AuthUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
    // dependencies HTTP
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:3000/api/auth';

  private readonly userSubject = new BehaviorSubject<AuthUser | null>(null); // user status

  readonly user$ = this.userSubject.asObservable();

  get currentUser(): AuthUser | null {
    return this.userSubject.value;
  }

  // Login method
  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>(
        `${this.apiUrl}/login`,
        { email, password },
        { withCredentials: true }, // it consents to send cookies towards the backend
      )
      .pipe(
        tap((response) => {
          this.userSubject.next(response.user);
        }),
      );
  }

  // Session reload method
  loadCurrentUser() {
    return this.http
      .get<AuthUser>(`${this.apiUrl}/me`, {
        withCredentials: true,
      })
      .pipe(
        tap((user) => {
          this.userSubject.next(user);
        }),
      );
  }

  // Logout method
  logout() {
    return this.http
      .post(`${this.apiUrl}/logout`, {}, { withCredentials: true })
      .pipe(
        tap(() => {
          this.userSubject.next(null);
        }),
      );
  }
}
