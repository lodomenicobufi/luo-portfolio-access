// src/app/components/activities/activities.component.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { GithubDataService } from '../../core/services/github-data.service';
import { AuthService } from '../../core/services/auth.service';
import { ActivityLog, User, Project } from '../../core/models';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
    <div class="filter-bar">
      <button class="filter-pill" [class.active]="fType===''" (click)="fType=''">Tutte</button>
      <button class="filter-pill" [class.active]="fType==='project'" (click)="fType='project'">Progetti</button>
      <button class="filter-pill" [class.active]="fType==='task'" (click)="fType='task'">Task</button>
      <button class="filter-pill" [class.active]="fType==='ticket'" (click)="fType='ticket'">Ticket</button>
      <button class="filter-pill" [class.active]="fType==='checklist'" (click)="fType='checklist'">Checklist</button>
      <button class="filter-pill" [class.active]="fType==='richiesta'" (click)="fType='richiesta'">Richieste</button>
      <div class="filter-divider"></div>
      <select class="select-chip" [(ngModel)]="fUser">
        <option value="">Tutti gli utenti</option>
        @for (u of users(); track u.id) {
          <option [value]="u.id">{{ u.name }}</option>
        }
      </select>
      <select class="select-chip" [(ngModel)]="fProject">
        <option value="">Tutti i progetti</option>
        @for (p of projects(); track p.id) {
          <option [value]="p.id">{{ p.nome }}</option>
        }
      </select>
      <input class="select-chip" type="date" [(ngModel)]="fDateFrom" title="Da" style="width:130px" />
      <input class="select-chip" type="date" [(ngModel)]="fDateTo"   title="A"  style="width:130px" />
      <div class="filter-spacer"></div>
      <span class="filter-count">{{ filtered().length }} attività</span>
      <button class="btn btn-s btn-sm" (click)="load()" [disabled]="loading()">↻ Aggiorna</button>
    </div>

    @if (loading()) {
      <div class="loading-full"><span class="spinner"></span><span>Caricamento…</span></div>
    } @else {
      <div class="page-body">
        <div class="card">
          <div class="card-hdr">
            <div>
              <div class="card-eyebrow">Registro attività</div>
              <div class="card-title">Storico modifiche</div>
            </div>
          </div>

          @if (filtered().length === 0) {
            <div class="act-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="40" height="40" style="opacity:.3">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
              <p>Nessuna attività registrata</p>
              <p style="font-size:12px;color:rgba(46,46,46,0.4)">Le attività vengono tracciate automaticamente ad ogni modifica</p>
            </div>
          } @else {
            <!-- Timeline raggruppata per giorno -->
            @for (group of groupedLogs(); track group.date) {
              <div class="act-day-group">
                <div class="act-day-label">{{ group.dateLabel }}</div>
                @for (log of group.logs; track log.id) {
                  <div class="act-row">
                    <!-- Avatar -->
                    <div class="act-avatar" [style.background]="userColor(log.userId)">
                      {{ userInitials(log.userId) }}
                    </div>

                    <!-- Contenuto -->
                    <div class="act-content">
                      <div class="act-main">
                        <span class="act-username">{{ userName(log.userId) }}</span>
                        <span class="act-verb">{{ actionVerb(log.action) }}</span>
                        <span class="act-entity-type">{{ entityLabel(log.entityType) }}</span>
                        <strong class="act-entity-name">{{ log.entityName }}</strong>
                        @if (log.field) {
                          <span class="act-field">— {{ log.field }}</span>
                        }
                      </div>

                      <!-- Dettaglio modifica -->
                      @if (log.oldValue || log.newValue) {
                        <div class="act-change">
                          @if (log.oldValue) {
                            <span class="act-old">{{ log.oldValue }}</span>
                            <span class="act-arrow">→</span>
                          }
                          <span class="act-new">{{ log.newValue }}</span>
                        </div>
                      }

                      <!-- Progetto e nota -->
                      <div class="act-meta">
                        @if (log.projectName) {
                          <a [routerLink]="['/projects', log.projectId]" class="act-project-link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="11" height="11"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                            {{ log.projectName }}
                          </a>
                        }
                        @if (log.note) {
                          <span class="act-note">"{{ log.note }}"</span>
                        }
                        <span class="act-time">{{ fmtTime(log.timestamp) }}</span>
                      </div>
                    </div>

                    <!-- Badge azione -->
                    <div class="act-badge" [class]="actionBadgeClass(log.action)">
                      {{ actionBadgeLabel(log.action) }}
                    </div>
                  </div>
                }
              </div>
            }

            @if (filtered().length >= 200) {
              <div class="act-more">Mostrando le ultime 200 attività</div>
            }
          }
        </div>
      </div>
    }
  `,
})
export class ActivitiesComponent implements OnInit {
  private db   = inject(GithubDataService);
  private auth = inject(AuthService);

  loading  = signal(false);
  logs     = signal<ActivityLog[]>([]);
  users    = signal<User[]>([]);
  projects = signal<Project[]>([]);

  fType    = '';
  fUser    = '';
  fProject = '';
  fDateFrom = '';
  fDateTo   = '';

  filtered = computed(() => {
    let list = this.logs();
    if (this.fType)    list = list.filter(l => l.entityType === this.fType);
    if (this.fUser)    list = list.filter(l => l.userId === this.fUser);
    if (this.fProject) list = list.filter(l => l.projectId === this.fProject);
    if (this.fDateFrom) list = list.filter(l => l.timestamp >= this.fDateFrom);
    if (this.fDateTo)   list = list.filter(l => l.timestamp.slice(0,10) <= this.fDateTo);
    return list;
  });

  groupedLogs = computed(() => {
    const groups: { date: string; dateLabel: string; logs: ActivityLog[] }[] = [];
    this.filtered().forEach(log => {
      const date = log.timestamp.slice(0, 10);
      let g = groups.find(g => g.date === date);
      if (!g) {
        g = { date, dateLabel: this.fmtDayLabel(date), logs: [] };
        groups.push(g);
      }
      g.logs.push(log);
    });
    return groups;
  });

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true);
    const [logs, users, projects] = await Promise.all([
      this.db.getLogs(200),
      this.db.getUsers(),
      this.db.getProjects(),
    ]);
    this.logs.set(logs);
    this.users.set(users);
    this.projects.set(projects);
    this.loading.set(false);
  }

  userName(id: string): string {
    return this.users().find(u => u.id === id)?.name || 'Utente';
  }
  userInitials(id: string): string {
    const name = this.userName(id);
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
      : name.slice(0,2).toUpperCase();
  }
  userColor(id: string): string {
    const colors = ['#6EC0AA','#4a9e8a','#2E2E2E','#8aaca4','#B8D8CE','#5a8a7a'];
    let h = 0; for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) & 0xffff;
    return colors[h % colors.length];
  }

  actionVerb(action: string): string {
    const map: Record<string,string> = {
      create: 'ha creato',  update: 'ha modificato',
      delete: 'ha eliminato', status_change: 'ha aggiornato lo stato di',
      link: 'ha collegato un documento a', accept: 'ha accettato',
      reject: 'ha respinto',
    };
    return map[action] || action;
  }
  entityLabel(type: string): string {
    const map: Record<string,string> = {
      project:'il progetto', task:'il task', ticket:'il ticket',
      checklist:'la checklist di', richiesta:'la richiesta', subtask:'il subtask',
    };
    return map[type] || type;
  }
  actionBadgeLabel(action: string): string {
    const map: Record<string,string> = {
      create:'Creato', update:'Modifica', delete:'Eliminato',
      status_change:'Stato', link:'Link', accept:'Accettato', reject:'Respinto',
    };
    return map[action] || action;
  }
  actionBadgeClass(action: string): string {
    if (['create','accept'].includes(action)) return 'act-badge-green';
    if (['delete','reject'].includes(action)) return 'act-badge-red';
    if (action === 'status_change') return 'act-badge-blue';
    return 'act-badge-gray';
  }

  fmtTime(ts: string): string {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('it-IT', { hour:'2-digit', minute:'2-digit' });
  }
  fmtDayLabel(date: string): string {
    const d = new Date(date + 'T00:00:00');
    const today = new Date(); today.setHours(0,0,0,0);
    const yesterday = new Date(today); yesterday.setDate(today.getDate()-1);
    if (d.getTime() === today.getTime()) return 'Oggi';
    if (d.getTime() === yesterday.getTime()) return 'Ieri';
    return d.toLocaleDateString('it-IT', { weekday:'long', day:'2-digit', month:'long', year:'numeric' });
  }
}
