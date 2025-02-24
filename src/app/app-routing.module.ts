import { Routes } from '@angular/router';
import { authGuard } from './middleware/auth/auth.guard';
import { LoginComponent } from './components/login/login.component';
import { DashboardComponent } from './components/dashboard/dashboard.component';

// Define routes
export const routeConfig: Routes = [
  { path: 'auth', component: LoginComponent },
  {
    path: '',
    component: DashboardComponent,
    canActivate: [authGuard]
  },
  { path: '**', redirectTo: 'auth'}  // Catch-all redirect to /auth
];
