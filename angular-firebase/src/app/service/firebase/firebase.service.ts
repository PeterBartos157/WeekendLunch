import { Injectable } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { Router } from '@angular/router';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import { initializeApp } from 'firebase/app';
import { environment } from '../../env/environment';

const app = initializeApp(environment.firebaseConfig);
const auth = getAuth(app);

@Injectable({ providedIn: 'root' })
export class FirebaseService {
  allowedEmails = [
    'bartos.jan454@gmail.com',
    'peterbartos17@gmail.com',
    'pavolbartos411@gmail.com',
    'veronika.bartosova26@gmail.com',
    'jan.bartos051@gmail.com',
  ];

  constructor(private afAuth: AngularFireAuth, private router: Router) {}

  async login() {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      if (!this.allowedEmails.includes(result.user.email!)) {
        alert('Access denied. Unauthorized email.');
        await this.logout();
      } else {
        this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      console.error('Login error:', error);
    }
  }

  async logout() {
    await this.afAuth.signOut();
    this.router.navigate(['/auth']);
  }
}
