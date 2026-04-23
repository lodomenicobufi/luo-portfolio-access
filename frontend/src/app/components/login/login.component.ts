// src/app/components/login/login.component.ts
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-logo">
          <span class="logo-big">luo</span>
          <span class="logo-sub">PEOPLE AND TECH</span>
        </div>
        <h2 class="login-title">Portfolio Progetti</h2>
        <p class="login-sub">Versione GitHub — inserisci le tue credenziali di accesso</p>

        @if (auth.error()) {
          <div class="login-err">{{ auth.error() }}</div>
        }

        <div class="fg">
          <label class="fl">Email</label>
          <input class="fi" type="email" [(ngModel)]="email" placeholder="nome@azienda.com" (keydown.enter)="login()"/>
        </div>
        <div class="fg">
          <label class="fl">GitHub Personal Access Token</label>
          <input class="fi" type="password" [(ngModel)]="token" placeholder="ghp_xxxxxxxxxxxx" (keydown.enter)="login()"/>
          <span class="fi-hint">Necessario per leggere e scrivere i dati nel repository</span>
        </div>
        <div class="fr2">
          <div class="fg">
            <label class="fl">GitHub Owner</label>
            <input class="fi" [(ngModel)]="owner" placeholder="nomeutente"/>
          </div>
          <div class="fg">
            <label class="fl">Repository</label>
            <input class="fi" [(ngModel)]="repo" placeholder="luo-portfolio-access"/>
          </div>
        </div>

        <button class="btn btn-p" [disabled]="auth.isLoading()" (click)="login()">
          @if (auth.isLoading()) {
            <span class="spinner-sm"></span> Connessione...
          } @else {
            Accedi
          }
        </button>

        <div class="login-info">
          <strong>Come ottenere il token GitHub:</strong><br/>
          GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate new token → seleziona scope <strong>repo</strong> → Generate.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--black); }
    .login-card { background: white; border-radius: 14px; padding: 40px; width: 440px; box-shadow: 0 30px 80px rgba(0,0,0,.4); }
    .login-logo { text-align: center; margin-bottom: 20px; }
    .logo-big { display: block; font-size: 56px; font-weight: 700; color: var(--black); line-height: 1; }
    .logo-sub { font-size: 11px; font-weight: 700; letter-spacing: 2px; color: var(--green); }
    .login-title { font-size: 17px; font-weight: 700; margin-bottom: 4px; }
    .login-sub { font-size: 12px; color: var(--gray-400); margin-bottom: 20px; }
    .login-err { background: #fcebeb; color: #a32d2d; font-size: 12px; padding: 10px 12px; border-radius: 6px; margin-bottom: 14px; }
    .fi-hint { font-size: 11px; color: var(--gray-400); margin-top: 3px; display: block; }
    .fr2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .btn { width: 100%; justify-content: center; margin-top: 4px; display: flex; align-items: center; gap: 8px; }
    .spinner-sm { width: 14px; height: 14px; border: 2px solid rgba(0,0,0,.2); border-top-color: var(--black); border-radius: 50%; animation: spin .7s linear infinite; display: inline-block; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .login-info { margin-top: 20px; font-size: 11px; color: var(--gray-400); background: var(--gray-50); padding: 12px; border-radius: 6px; line-height: 1.6; }
  `]
})
export class LoginComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  email = '';
  token = '';
  owner = '';
  repo = 'luo-portfolio-access';

  async login(): Promise<void> {
    if (!this.email || !this.token || !this.owner || !this.repo) return;
    const ok = await this.auth.login(this.email, this.token, this.owner, this.repo);
    if (ok) this.router.navigate(['/dashboard']);
  }
}
