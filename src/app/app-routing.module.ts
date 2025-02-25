import { Routes } from '@angular/router';
import { AppWrapperComponent } from './components/app.wrapper';

// Define routes
export const routeConfig: Routes = [
  {
    path: '',
    component: AppWrapperComponent,
  },
  { path: '**', redirectTo: ''}  // Catch-all redirects
];
