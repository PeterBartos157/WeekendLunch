import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const auth = inject(Auth);
  const router = inject(Router);

  return new Promise((resolve) => {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log("✅ User is logged in:", user.email);
        resolve(true);  // Allow access
      } else {
        console.log("❌ User is NOT logged in, redirecting...");
        router.navigate(['/auth']);
        resolve(false);  // Block access
      }
    });
  });
};
