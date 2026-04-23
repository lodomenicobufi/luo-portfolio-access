// src/app/components/users/users.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GithubDataService } from '../../core/services/github-data.service';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-hdr" style="display:flex;align-items:flex-start;justify-content:space-between">
        <div>
          <div class="page-title">Gestione Utenti</div>
          <div class="page-sub">Assegna ruoli — dati salvati in data/users.csv nel repository</div>
        </div>
        <button class="btn btn-p" (click)="showNew.set(true)">+ Aggiungi Utente</button>
      </div>

      <div class="info-banner">
        <strong>Nuovo modello di accesso:</strong> chiunque conosca le credenziali del repository può fare login. Il ruolo viene letto da <strong>data/users.csv</strong>. Chi non è nel file non può accedere.
      </div>

      @if (loading()) {
        <div class="loading-full"><span class="spinner"></span></div>
      } @else {
        <div class="card">
          <div class="tbl-wrap">
            <table>
              <thead><tr><th>Utente</th><th>Email</th><th>Ruolo</th><th>Stato</th><th>Azioni</th></tr></thead>
              <tbody>
                @for (u of users(); track u.id) {
                  <tr [style.background]="isMe(u) ? 'var(--green-light)' : ''">
                    <td>
                      <div style="display:flex;align-items:center;gap:9px">
                        <div class="av">{{ ini(u.name) }}</div>
                        <div>
                          <span style="font-weight:600">{{ u.name }}</span>
                          @if (isMe(u)) { <span style="font-size:10px;margin-left:6px;color:var(--teal);font-weight:700">(tu)</span> }
                        </div>
                      </div>
                    </td>
                    <td style="color:var(--gray-600);font-size:12px">{{ u.email }}</td>
                    <td><span class="role-badge role-{{u.role}}">{{ u.role }}</span></td>
                    <td>
                      <div style="display:flex;align-items:center;gap:8px">
                        <label class="tgl">
                          <input type="checkbox" [checked]="u.active" (change)="toggleActive(u)" [disabled]="isMe(u)"/>
                          <span class="tgl-s"></span>
                        </label>
                        <span style="font-size:12px" [style.color]="u.active ? 'var(--teal)' : 'var(--gray-400)'">
                          {{ u.active ? 'Attivo' : 'Disabilitato' }}
                        </span>
                      </div>
                    </td>
                    <td>
                      <button class="ico-btn" (click)="startEdit(u)" [disabled]="isMe(u)">✏</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- MODAL NUOVO -->
      @if (showNew()) {
        <div class="mb" (click)="$event.target===$event.currentTarget && showNew.set(false)">
          <div class="modal" style="max-width:420px">
            <div class="mh"><span class="mt">Aggiungi Utente</span><button class="ico-btn" (click)="showNew.set(false)">✕</button></div>
            <div class="mbody">
              <div class="fg"><label class="fl req">Nome Cognome</label><input class="fi" [(ngModel)]="newForm.name" placeholder="Mario Rossi"/></div>
              <div class="fg"><label class="fl req">Email</label><input class="fi" type="email" [(ngModel)]="newForm.email" placeholder="mario@azienda.com"/></div>
              <div class="fg"><label class="fl req">Ruolo</label>
                <select class="fi" [(ngModel)]="newForm.role">
                  <option value="viewer">Viewer — solo visualizzazione</option>
                  <option value="editor">Editor — crea e modifica</option>
                  <option value="admin">Admin — accesso completo</option>
                </select>
              </div>
            </div>
            <div class="mfoot">
              <button class="btn btn-g" (click)="showNew.set(false)">Annulla</button>
              <button class="btn btn-p" (click)="createUser()" [disabled]="saving()">{{ saving() ? 'Salvataggio...' : 'Aggiungi' }}</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL MODIFICA -->
      @if (editingUser()) {
        <div class="mb" (click)="$event.target===$event.currentTarget && editingUser.set(null)">
          <div class="modal" style="max-width:380px">
            <div class="mh"><span class="mt">Modifica Ruolo</span><button class="ico-btn" (click)="editingUser.set(null)">✕</button></div>
            <div class="mbody">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px">
                <div class="av" style="width:40px;height:40px;font-size:14px">{{ ini(editingUser()!.name) }}</div>
                <div><div style="font-weight:700">{{ editingUser()!.name }}</div><div style="font-size:12px;color:var(--gray-400)">{{ editingUser()!.email }}</div></div>
              </div>
              <div class="fg"><label class="fl req">Ruolo</label>
                <select class="fi" [ngModel]="editingUser()!.role" (ngModelChange)="setEditRole($event)">
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div class="mfoot">
              <button class="btn btn-g" (click)="editingUser.set(null)">Annulla</button>
              <button class="btn btn-p" (click)="saveEdit()" [disabled]="saving()">Salva</button>
            </div>
          </div>
        </div>
      }

      @if (toast()) { <div class="toast ok">{{ toast() }}</div> }
    </div>
  `,
  styles: [`
    .av { width:28px; height:28px; border-radius:50%; background:var(--green-light); display:inline-flex; align-items:center; justify-content:center; font-size:10px; font-weight:700; color:var(--teal); flex-shrink:0; }
    .role-badge { font-size:10px; font-weight:700; padding:2px 6px; border-radius:4px; }
    .role-admin { background:var(--green); color:var(--black); }
    .role-editor { background:#378add; color:white; }
    .role-viewer { background:#5e5e5a; color:white; }
    .tgl { position:relative; width:36px; height:20px; display:inline-block; }
    .tgl input { opacity:0; width:0; height:0; }
    .tgl-s { position:absolute; inset:0; background:var(--gray-200); border-radius:10px; cursor:pointer; transition:.2s; }
    .tgl-s::before { content:''; position:absolute; width:14px; height:14px; left:3px; bottom:3px; background:white; border-radius:50%; transition:.2s; }
    .tgl input:checked+.tgl-s { background:var(--green); }
    .tgl input:checked+.tgl-s::before { transform:translateX(16px); }
  `]
})
export class UsersComponent implements OnInit {
  db = inject(GithubDataService);
  auth = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  users = signal<User[]>([]);
  showNew = signal(false);
  editingUser = signal<User | null>(null);
  toast = signal('');
  newForm: Partial<User> = { name:'', email:'', role:'viewer' };

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true);
    this.users.set(await this.db.getUsers());
    this.loading.set(false);
  }

  isMe(u: User) { return u.email === this.auth.currentUser()?.email; }
  ini(n: string) { return n.split(' ').map(w=>w[0]).slice(0,2).join('').toUpperCase(); }

  async createUser() {
    if (!this.newForm.name || !this.newForm.email) return;
    this.saving.set(true);
    await this.db.createUser(this.newForm as Omit<User,'id'>);
    await this.load();
    this.showNew.set(false);
    this.newForm = { name:'', email:'', role:'viewer' };
    this.saving.set(false);
    this.showToast('Utente aggiunto');
  }

  startEdit(u: User) { this.editingUser.set({ ...u }); }
  setEditRole(role: string) { this.editingUser.update(u => u ? { ...u, role: role as any } : null); }

  async saveEdit() {
    const u = this.editingUser();
    if (!u) return;
    this.saving.set(true);
    await this.db.updateUser(u.id, { role: u.role });
    await this.load();
    this.editingUser.set(null);
    this.saving.set(false);
    this.showToast('Ruolo aggiornato');
  }

  async toggleActive(u: User) {
    await this.db.updateUser(u.id, { active: !u.active });
    await this.load();
  }

  showToast(msg: string) { this.toast.set(msg); setTimeout(() => this.toast.set(''), 3000); }
}
