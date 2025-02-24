import { Router } from "@angular/router";
import { Auth } from "@angular/fire/auth";
import { Injectable, inject } from "@angular/core";
import { browserPopupRedirectResolver, getRedirectResult, GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { LoginComponent } from "../../components/login/login.component";

@Injectable({
  providedIn: "root"
})
export class AuthService {
  private auth = inject(Auth);
  private allowedUsers = [
    "bartos.jan454@gmail.com",
    "peterbartos17@gmail.com",
    "pavolbartos411@gmail.com",
    "veronika.bartosova26@gmail.com",
    "jan.bartos051@gmail.com"
  ];

  constructor(private router: Router) { }

  setAuthStateChangeListener(loginComponent: LoginComponent) {
    this.auth.onAuthStateChanged(async (user) => {
      console.log("h1", user, loginComponent.feedbackMessage);
      await this.handleRedirectSignIn();
    });
  }

  signinWithRedirect(): { status: boolean; msg: string; color: string } {
    const provider = new GoogleAuthProvider(); // Initialize Google Auth provider
    try {
      signInWithRedirect(this.auth, provider, browserPopupRedirectResolver);
      // No return value here because authentication happens after redirection
      return { status: true, msg: "Prebieha presmerovanie na prihlásenie", color: "blue" };
    } catch (error: any) {
      console.error("Error starting Google login redirect:", error);
      return { status: false, msg: "Chyba pri presmerovaní, skús to znova", color: "red" };
    }
  }

  async handleRedirectSignIn(): Promise<{ status: boolean; msg: string; color: string }> {
    return getRedirectResult(this.auth).then((result) => {
      console.log(result);
      if (result) {
        const user = result.user;
        // Check if user email is allowed
        if (!this.allowedUsers.includes(user.email ?? "")) {
          console.log("Unauthorized email address!");
          return { status: false, msg: "Neautorizovaná emailová adresa!", color: "red" };
        }
        console.log("Logged in successfully with Google:", user);
        return { status: true, msg: "Úspešné prihlásenie!", color: "green" };
      }
      else return { status: false, msg: "Žiadny výsledok prihlásenia sa nenašiel", color: "gray" };
    }).catch((error: any) => {
      console.error("Error handling login redirect:", error);
      return { status: false, msg: "Chyba pri prihlasovaní, skús to znova", color: "red" };
    });
  }

  async signInWithPopup(): Promise<{ status: boolean, msg: string, color: string }> {
    const provider = new GoogleAuthProvider(); // Google Auth provider
    try {
      const result = await signInWithPopup(this.auth, provider, browserPopupRedirectResolver);
      const user = result.user;
      // Unauthorized email address
      if (!this.allowedUsers.includes(user.email ?? "")) {
        console.log("Unauthorized email address!");
        return { status: false, msg: "Nepovolená emailová adresa", color: "red" };
      }
      // Successfully logged in with Google
      console.log("Logged in successfully with Google!");
      return { status: true, msg: "Úspešné prihlásenie", color: "green" };
    } catch (error: any) {
      // User closed the popup
      if (error.code === "auth/cancelled-popup-request") {
        console.log("User closed the popup!");
        return { status: false, msg: "Prihlasovacie okno bolo zatvorené, skús to znova", color: "red" };
      }
      // Error in login
      console.error("Error logging in with Google:", error);
      return { status: false, msg: "Pri prihlasovaní došlo k chybe, skús to znova", color: "red" };
    }
  }

  // Logout user
  async logOut(): Promise<void> {
    try {
      await this.auth.signOut();
      console.log("Logged out successfully");
      this.router.navigate(["/auth"]); // Redirect to login page
    } catch (error) {
      console.error("Error logging out:", error);
    }
  }

  // Get current authenticated user
  getCurrentUser() {
    return this.auth.currentUser;
  }
}
