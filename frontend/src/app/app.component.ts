// src/app/app.component.ts
import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  template: `
    @if (auth.currentUser()) {
      <div class="app-root">
        <!-- ─── SIDEBAR ─────────────────────────────────── -->
        <aside class="sidebar">
          <div class="sidebar-logo">
            <img src="assets/logo-luo.jpeg" alt="LUO People and Tech" class="sidebar-logo-img"
              (error)="onLogoError($event)" />
          </div>

          <a routerLink="/dashboard" routerLinkActive="active" class="side-nav-item">
            <svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 10l9-7 9 7v11a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z"/>
            </svg>
            <span class="nav-lbl">Dashboard</span>
          </a>

          <a routerLink="/projects" routerLinkActive="active" class="side-nav-item">
            <svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            </svg>
            <span class="nav-lbl">Progetti</span>
          </a>

          <a routerLink="/richieste" routerLinkActive="active" class="side-nav-item">
            <svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="12" y1="11" x2="12" y2="17"/>
              <line x1="9" y1="14" x2="15" y2="14"/>
            </svg>
            <span class="nav-lbl">Richieste</span>
          </a>

          <a routerLink="/activities" routerLinkActive="active" class="side-nav-item">
            <svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <span class="nav-lbl">Attività</span>
          </a>

          @if (auth.currentUser()?.role === 'admin') {
            <a routerLink="/users" routerLinkActive="active" class="side-nav-item">
              <svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0"/>
                <circle cx="17" cy="9" r="3"/><path d="M22 19a5 5 0 0 0-5-5"/>
              </svg>
              <span class="nav-lbl">Utenti</span>
            </a>

            <a routerLink="/config" routerLinkActive="active" class="side-nav-item">
              <svg class="nav-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <span class="nav-lbl">Configurazione</span>
            </a>
          }

          <div class="sidebar-spacer"></div>

          <div class="sidebar-info">
            <div class="sidebar-info-title">Database GitHub</div>
            <div class="sidebar-info-body">
              Dati sincronizzati con<br/>
              <b>{{ repoLabel() }}</b>
            </div>
          </div>
        </aside>

        <!-- ─── MAIN ────────────────────────────────────── -->
        <div class="main">
          <header class="topbar">
            <div class="topbar-title">
              <div class="topbar-eyebrow">Portfolio management</div>
              <div class="topbar-h1">{{ pageTitle() }}</div>
            </div>
            <div class="topbar-actions">
              <div class="user-chip">
                <div class="user-avatar">{{ initials() }}</div>
                <div>
                  <div class="user-name">{{ auth.currentUser()?.name }}</div>
                  <div class="user-role">{{ roleLabel() }}</div>
                </div>
              </div>
              <div class="topbar-divider"></div>
              <button class="logout-btn" (click)="logout()">Esci</button>
            </div>
          </header>

          <router-outlet />
        </div>
      </div>
    } @else {
      <router-outlet />
    }
  `,
})
export class AppComponent implements OnInit {
  constructor(public auth: AuthService, private router: Router) {}

  ngOnInit() {
    if (!this.auth.currentUser()) {
      this.router.navigate(['/login']);
    }
  }

  initials(): string {
    const name = this.auth.currentUser()?.name || '';
    return name.split(' ').map((p: string) => p[0]).slice(0, 2).join('').toUpperCase();
  }

  roleLabel(): string {
    const r = this.auth.currentUser()?.role;
    const m: Record<string, string> = { admin: 'Admin', editor: 'Editor', viewer: 'Viewer' };
    return r ? m[r] || r : '';
  }

  repoLabel(): string {
    try {
      const cfg = JSON.parse(localStorage.getItem('luo_github_cfg') || '{}');
      if (cfg.owner && cfg.repo) return `${cfg.owner}/${cfg.repo}`;
    } catch {}
    return 'repository';
  }

  pageTitle(): string {
    const url = this.router.url;
    if (url.startsWith('/dashboard')) return 'Dashboard';
    if (url.startsWith('/projects')) return 'Progetti';
    if (url.startsWith('/activities')) return 'Attività';
    if (url.startsWith('/richieste')) return 'Richieste';
    if (url.startsWith('/users')) return 'Utenti';
    if (url.startsWith('/config')) return 'Configurazione';
    return 'Portfolio';
  }

  logout() {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  onLogoError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
    const parent = img.parentElement;
    if (parent && !parent.querySelector('.luo-wordmark-fb')) {
      const span = document.createElement('span');
      span.className = 'luo-wordmark-fb';
      span.textContent = 'LUO';
      parent.appendChild(span);
    }
  }
}
