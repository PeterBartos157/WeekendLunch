import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LoginComponent } from './login/login.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { Auth, onAuthStateChanged, User } from '@angular/fire/auth';

@Component({
  selector: 'app-wrapper',
  standalone: true,
  imports: [CommonModule],
  template: `<ng-container *ngComponentOutlet="component"></ng-container>`,
})

export class AppWrapperComponent {
  private auth = inject(Auth);
  component: any = null;

  constructor() {
    onAuthStateChanged(this.auth, (user: User | null) => {
      this.component = user ? DashboardComponent : LoginComponent;
    });
  }
}
