import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <img src="assets/logo-luo.jpeg" alt="LUO People and Tech" class="login-logo" />
          <p class="login-subtitle">Portfolio Progetti</p>
        </div>
        <form class="login-form" (ngSubmit)="onLogin()">
          <div class="fg">
            <label class="fl req">Email</label>
            <input class="fi" type="email" [(ngModel)]="email" name="email"
              placeholder="nome@luo.it" autocomplete="email" required />
          </div>
          <div class="fg">
            <label class="fl req">GitHub Personal Access Token</label>
            <input class="fi" type="password" [(ngModel)]="token" name="token"
              placeholder="ghp_..." required />
          </div>
          <div class="fr2">
            <div class="fg" style="margin-bottom:0">
              <label class="fl req">Owner</label>
              <input class="fi" type="text" [(ngModel)]="owner" name="owner"
                placeholder="username o org" required />
            </div>
            <div class="fg" style="margin-bottom:0">
              <label class="fl req">Repository</label>
              <input class="fi" type="text" [(ngModel)]="repo" name="repo"
                placeholder="luo-portfolio-access" required />
            </div>
          </div>
          @if (error) {
            <div class="login-error">{{ error }}</div>
          }
          <button type="submit" class="btn btn-p login-btn" [disabled]="loading">
            @if (loading) {
              <span class="spinner"></span> Accesso in corso...
            } @else {
              Accedi
            }
          </button>
        </form>
        <p class="login-footer">LUO &mdash; People and Tech</p>
      </div>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #F4F1EC;
      background-image:
        radial-gradient(ellipse at 20% 50%, rgba(110,192,170,.18) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 80%, rgba(46,46,46,.06) 0%, transparent 55%);
      padding: 24px;
      font-family: 'Geist', system-ui, sans-serif;
    }
    .login-card {
      background: #FFFFFF;
      border-radius: 16px;
      padding: 32px 32px 24px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 24px 60px rgba(46,46,46,.10), 0 4px 12px rgba(46,46,46,.04);
      border: 1px solid rgba(46,46,46,0.06);
    }
    .login-header { text-align: center; margin-bottom: 28px; }
    .login-logo {
      width: 130px; height: auto; display: block; margin: 0 auto 12px;
      border-radius: 12px;
    }
    .login-subtitle {
      font-size: 11px; font-weight: 600;
      letter-spacing: 1.8px; text-transform: uppercase;
      color: rgba(46,46,46,0.55);
      margin: 0;
    }
    .login-form { display: flex; flex-direction: column; gap: 14px; }
    .login-btn {
      width: 100%; justify-content: center;
      padding: 12px; font-size: 14px; margin-top: 4px;
    }
    .login-error {
      background: rgba(232,155,138,0.16);
      color: #8B2500;
      border-radius: 8px;
      padding: 10px 13px;
      font-size: 13px;
      border: 1px solid rgba(232,155,138,0.30);
    }
    .login-footer {
      text-align: center; margin-top: 20px;
      font-size: 10px;
      color: rgba(46,46,46,0.35);
      letter-spacing: 1.5px;
      text-transform: uppercase;
      font-weight: 500;
    }
    .spinner {
      display: inline-block;
      width: 14px; height: 14px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin .7s linear infinite;
      margin-right: 6px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoginComponent {
  email = ''; token = ''; owner = ''; repo = '';
  error = ''; loading = false;

  constructor(private auth: AuthService, private router: Router) {}

  async onLogin() {
    this.error = '';
    if (!this.email || !this.token || !this.owner || !this.repo) {
      this.error = 'Compila tutti i campi obbligatori.';
      return;
    }
    this.loading = true;
    try {
      const ok = await this.auth.login(this.email, this.token, this.owner, this.repo);
      if (ok) { this.router.navigate(['/dashboard']); }
      else { this.error = 'Credenziali non valide o utente non trovato.'; }
    } catch (e) {
      this.error = 'Errore di connessione. Verifica il token e il repository.';
    } finally {
      this.loading = false;
    }
  }
}
