// src/app/app.component.ts
import { Component, inject } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    <div class="app-wrapper">
      @if (auth.currentUser()) {
        <!-- TOPBAR -->
        <div class="topbar">
          <div class="topbar-left">
            <div class="logo-text">luo<span class="logo-dot">●</span></div>
            <nav class="topbar-nav">
              <a routerLink="/dashboard" routerLinkActive="active" class="nav-btn">
                <span class="nav-icon">▦</span> Dashboard
              </a>
              <a routerLink="/projects" routerLinkActive="active" class="nav-btn">
                <span class="nav-icon">≡</span> Progetti
              </a>
              @if (auth.isAdmin) {
                <a routerLink="/users" routerLinkActive="active" class="nav-btn">
                  <span class="nav-icon">◎</span> Utenti
                </a>
                <a routerLink="/config" routerLinkActive="active" class="nav-btn">
                  <span class="nav-icon">⚙</span> Config
                </a>
              }
            </nav>
          </div>
          <div class="topbar-right">
            <div class="user-chip">
              <div class="user-avatar">{{ initials() }}</div>
              <span class="user-name">{{ auth.currentUser()?.name }}</span>
              <span class="role-badge role-{{auth.currentUser()?.role}}">{{ auth.currentUser()?.role }}</span>
            </div>
            <button class="icon-btn" title="Logout" (click)="logout()">⏻</button>
          </div>
        </div>

        <!-- LAYOUT -->
        <div class="layout">
          <div class="main-content">
            <router-outlet />
          </div>
        </div>
      } @else {
        <router-outlet />
      }
    </div>
  `,
  styles: [`
    .app-wrapper { min-height: 100vh; background: var(--gray-50); }
    .topbar { background: var(--black); display: flex; align-items: center; justify-content: space-between; padding: 0 24px; height: 54px; position: sticky; top: 0; z-index: 100; }
    .topbar-left { display: flex; align-items: center; gap: 20px; }
    .logo-text { font-size: 22px; font-weight: 700; color: white; letter-spacing: -1px; }
    .logo-dot { color: var(--green); }
    .topbar-nav { display: flex; gap: 2px; }
    .nav-btn { background: none; border: none; color: #9b9b96; font-size: 13px; font-weight: 500; padding: 6px 14px; border-radius: 6px; cursor: pointer; text-decoration: none; display: flex; align-items: center; gap: 6px; transition: all .15s; }
    .nav-btn:hover, .nav-btn.active { color: white; background: rgba(255,255,255,.13); }
    .topbar-right { display: flex; align-items: center; gap: 10px; }
    .user-chip { display: flex; align-items: center; gap: 8px; background: rgba(255,255,255,.08); border-radius: 20px; padding: 4px 12px 4px 4px; }
    .user-avatar { width: 28px; height: 28px; border-radius: 50%; background: var(--green); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--black); }
    .user-name { font-size: 12px; font-weight: 500; color: white; }
    .role-badge { font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 4px; }
    .role-admin { background: var(--green); color: var(--black); }
    .role-editor { background: #378add; color: white; }
    .role-viewer { background: #5e5e5a; color: white; }
    .icon-btn { padding: 6px; background: none; border: none; cursor: pointer; color: #9b9b96; font-size: 16px; }
    .icon-btn:hover { color: white; }
    .layout { display: flex; }
    .main-content { flex: 1; padding: 28px 32px; max-width: 1400px; margin: 0 auto; width: 100%; }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
  private router = inject(Router);

  initials(): string {
    const name = this.auth.currentUser()?.name || '';
    return name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
