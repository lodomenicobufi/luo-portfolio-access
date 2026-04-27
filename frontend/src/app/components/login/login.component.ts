import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

const LOGO_DARK = 'data:image/png;base64,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';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  template: `
    <div class="login-page">
      <div class="login-card">
        <div class="login-header">
          <img [src]="logo" alt="LUO" class="login-logo" />
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
      background: var(--luo-dark);
      background-image:
        radial-gradient(ellipse at 20% 50%, rgba(110,192,170,.12) 0%, transparent 60%),
        radial-gradient(ellipse at 80% 20%, rgba(110,192,170,.08) 0%, transparent 50%);
      padding: 24px;
    }
    .login-card {
      background: white;
      border-radius: var(--r-xl);
      padding: 36px 32px 28px;
      width: 100%;
      max-width: 420px;
      box-shadow: 0 20px 60px rgba(0,0,0,.35);
    }
    .login-header { text-align: center; margin-bottom: 28px; }
    .login-logo { height: 52px; width: auto; margin-bottom: 10px; }
    .login-subtitle {
      font-size: 12px; font-weight: 600;
      letter-spacing: 1.5px; text-transform: uppercase;
      color: var(--gray-400);
    }
    .login-form { display: flex; flex-direction: column; gap: 14px; }
    .login-btn { width: 100%; justify-content: center; padding: 11px; font-size: 14px; margin-top: 4px; }
    .login-error {
      background: var(--danger-l); color: #8B2500;
      border-radius: var(--r-sm); padding: 9px 13px; font-size: 13px;
    }
    .login-footer {
      text-align: center; margin-top: 20px;
      font-size: 11px; color: var(--gray-400); letter-spacing: .5px;
    }
  `]
})
export class LoginComponent {
  logo = LOGO_DARK;
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
