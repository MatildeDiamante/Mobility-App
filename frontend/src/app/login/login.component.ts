import { Component, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: ` <main class="login-page">
    <div class="login-panel">
      <h1>Accedi</h1>
      <p>Accedi e inizia la tua esperienza di mobilità all'estero</p>

      <form class="login-form" [formGroup]="loginForm" (ngSubmit)="submit()">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          formControlName="email"
          autocomplete="email"
        />

        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          formControlName="password"
          autocomplete="current-password"
        />

        @if (errorMessage) {
          <p class="error-message">{{ errorMessage }}</p>
        }

        <button type="submit" [disabled]="loginForm.invalid || isSubmitting">
          {{ isSubmitting ? 'Accesso in corso...' : 'Accedi' }}
        </button>
      </form>
    </div>
  </main>`,
  styles: `
    .login-page {
      display: grid;
      min-height: 100vh;
      place-items: center;
      padding: 24px;
    }

    .login-form {
      display: grid;
      width: min(100%, 360px);
      gap: 12px;
    }

    .login-panel {
      width: min(100%, 420px);
      padding: 32px;
      border-radius: 16px;
      background: #fef7e1;
      box-shadow: 0 12px 28px rgba(46, 36, 72, 0.14);
    }

    .login-panel h1,
    .login-panel p {
      margin-top: 0;
    }

    .login-panel p {
      margin-bottom: 24px;
      color: #665c7d;
      font-family: 'Source Code Pro', monospace;
    }

    label,
    button {
      font-family: 'Source Code Pro', monospace;
    }

    input,
    button {
      box-sizing: border-box;
      min-height: 42px;
      padding: 8px 12px;
      border-radius: 10px;
    }

    input {
      border: 1px solid #2c234d;
    }

    button {
      border: 1px solid #5d2cd5;
      background: #5d2cd5;
      color: #ffffff;
      cursor: pointer;
    }

    button:not(:disabled):hover {
      background: #ffffff;
      color: #5d2cd5;
    }

    .error-message {
      color: #b42318;
      margin: 0;
    }
  `,
})
export class LoginComponent {
  // Injected dependencies
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Variables that determine the state of the form
  isSubmitting = false;
  errorMessage = '';

  // Creates the form
  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  // Method invoked when the form is submitted
  submit(): void {
    if (this.loginForm.invalid || this.isSubmitting) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Reads the values inputted by the user in the form
    const { email, password } = this.loginForm.getRawValue();

    // HTTP request
    this.authService.login(email, password).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        const destinations: Record<string, string> = {
          student: '/student',
          professor: '/professor',
          office_staff: '/office',
        };

        const destination = destinations[response.user.role] ?? '/login';

        void this.router.navigateByUrl(destination);
      },
      error: (error) => {
        this.isSubmitting = false;

        this.errorMessage =
          error.status === 401
            ? 'Email or password not correct'
            : 'Impossible to reach server. Try again in a few moments.';
      },
    });
  }
}
