import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../service/firebase/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent { //implements OnInit {
  feedbackMessage: string = 'Pri prihlasovaní vyskočí okno pre prihlasovanie, je potrebné povoliť vyskakovacie okná v prehliadači';
  feedbackMessageColor: string = 'gray';

  constructor(private authService: AuthService, private router: Router) {}

  // async ngOnInit() {
  //   this.authService.setAuthStateChangeListener(this);
  // }

  async signIn() {
    const response: { status: boolean, msg: string, color: string } = await this.authService.signInWithPopup();
    this.feedbackMessage = response.msg;
    this.feedbackMessageColor = response.color;
    if (response.status) {
      this.router.navigate(['/']);
    }
  }
}
