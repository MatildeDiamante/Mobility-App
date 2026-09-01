// Guard checks if the user has the required role to access a route
import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/auth-user.model';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService); // receives the authenticated user's service
  const router = inject(Router); // receives the router to redirect the user to the login

  const requiredRole = route.data['role'] as UserRole;

  // checks the authenticated's role against the required role
  if (authService.currentUser?.role === requiredRole) {
    return true;
  }

  return router.createUrlTree(['/login']); // the role is wrong or the user doesn't exist, the page is not opened
};
