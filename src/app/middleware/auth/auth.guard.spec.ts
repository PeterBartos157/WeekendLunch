import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { authGuard } from './auth.guard';
import { of } from 'rxjs';

describe('authGuard', () => {
  let router: Router;
  let afAuth: AngularFireAuth;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate: jasmine.createSpy() } },
        { provide: AngularFireAuth, useValue: { authState: of(null) } },
      ],
    });
    router = TestBed.inject(Router);
    afAuth = TestBed.inject(AngularFireAuth);
  });

  it('should be created', () => {
    expect(authGuard).toBeTruthy();
  });
});
