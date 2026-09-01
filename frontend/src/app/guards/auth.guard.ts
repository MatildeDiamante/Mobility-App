// Authentication guard to protect routes that require a logged-in user
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router); // calls Angular's router to redirect the user to the login page

  if (authService.currentUser) {
    return true; // user authenticated, and can access the route
  }

  return router.createUrlTree(['/login']); // user not authenticated, redirect to login page
};
