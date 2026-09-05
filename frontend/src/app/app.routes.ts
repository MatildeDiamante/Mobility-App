// Routes configuration for the Angular applicaiton
import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { StudentDashboardComponent } from './student-dashboard/student-dashboard.component';
import { authGuard } from './guards/auth.guard';
import { roleGuard } from './guards/role.guard';
import { ProfessorDashboardComponent } from './professor-dashboard/professor-dashboard.component';

export const routes: Routes = [
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'student',
    component: StudentDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'student' },
  },
  {
    path: 'professor',
    component: ProfessorDashboardComponent,
    canActivate: [authGuard, roleGuard],
    data: { role: 'professor' },
  },
  // Manages the main URL of the app
  {
    path: '',
    pathMatch: 'full',
    redirectTo: 'login',
  },
  {
    path: '**',
    redirectTo: 'login',
  },
];
