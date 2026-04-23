// src/app/core/services/auth.service.ts
import { Injectable, signal } from '@angular/core';
import { CurrentUser } from '../models';
import { GithubDataService } from './github-data.service';

const STORAGE_KEY = 'luo_current_user';
const GITHUB_CFG_KEY = 'luo_github_cfg';

@Injectable({ providedIn: 'root' })
export class AuthService {
  currentUser = signal<CurrentUser | null>(null);
  isLoading = signal(false);
  error = signal('');

  constructor(private db: GithubDataService) {
    this.restoreSession();
  }

  private restoreSession(): void {
    const saved = localStorage.getItem(STORAGE_KEY);
    const cfg = localStorage.getItem(GITHUB_CFG_KEY);
    if (saved && cfg) {
      const user = JSON.parse(saved);
      const githubCfg = JSON.parse(cfg);
      this.db.configure(githubCfg);
      this.currentUser.set(user);
    }
  }

  async login(email: string, token: string, owner: string, repo: string): Promise<boolean> {
    this.isLoading.set(true);
    this.error.set('');
    try {
      const cfg = { owner, repo, token, branch: 'main' };
      this.db.configure(cfg);
      const users = await this.db.getUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.active);
      if (!user) {
        this.error.set('Email non trovata o utente disabilitato. Verifica di essere nel file data/users.csv.');
        this.isLoading.set(false);
        return false;
      }
      const currentUser: CurrentUser = { ...user, token };
      this.currentUser.set(currentUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentUser));
      localStorage.setItem(GITHUB_CFG_KEY, JSON.stringify(cfg));
      this.isLoading.set(false);
      return true;
    } catch (e: any) {
      this.error.set('Impossibile connettersi al repository. Verifica owner, repo e token GitHub.');
      this.isLoading.set(false);
      return false;
    }
  }

  logout(): void {
    this.currentUser.set(null);
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(GITHUB_CFG_KEY);
  }

  get isAdmin(): boolean { return this.currentUser()?.role === 'admin'; }
  get isEditor(): boolean { return ['admin','editor'].includes(this.currentUser()?.role ?? ''); }
  get isViewer(): boolean { return this.currentUser()?.role === 'viewer'; }
}
