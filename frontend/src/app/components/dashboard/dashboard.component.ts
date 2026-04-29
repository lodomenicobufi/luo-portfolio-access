// src/app/components/dashboard/dashboard.component.ts
import { Component, inject, OnInit, signal, computed, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GithubDataService } from '../../core/services/github-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, User, AppConfig, Task, ChecklistItem, Ticket, Richiesta, ActivityLog } from '../../core/models';

declare var Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="filter-bar">
      <span class="filter-label">Stato:</span>
      <button class="filter-pill" [class.active]="filterStato===''" (click)="filterStato=''">Tutti</button>
      @for (s of (config()?.statiProgetto || []); track s) {
        <button class="filter-pill" [class.active]="filterStato===s" (click)="filterStato=s">{{ s }}</button>
      }
      <div class="filter-divider"></div>
      <select class="select-chip" [(ngModel)]="filterBU">
        <option value="">BU: tutte</option>
        @for (b of (config()?.businessUnits || []); track b) { <option [value]="b">{{ b }}</option> }
      </select>
      <select class="select-chip" [(ngModel)]="filterArea">
        <option value="">Area: tutte</option>
        @for (a of (config()?.aree || []); track a) { <option [value]="a">{{ a }}</option> }
      </select>
      <select class="select-chip" [(ngModel)]="filterPrio">
        <option value="">Priorità: tutte</option>
        @for (p of (config()?.priorita || []); track p) { <option [value]="p">{{ p }}</option> }
      </select>
      <div class="filter-spacer"></div>
      <span class="filter-count">{{ filtered().length }} progetti</span>
      <button class="btn btn-s btn-sm" (click)="load()" [disabled]="loading()">
        @if (loading()) { Caricamento… } @else { ↻ Aggiorna }
      </button>
    </div>

    @if (loading()) {
      <div class="loading-full"><span class="spinner"></span><span>Caricamento dati…</span></div>
    } @else {
      <div class="page-body">

        <!-- KPI ROW -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-card-top">
              <div>
                <div class="kpi-label">Totale progetti</div>
                <div class="kpi-value">{{ filtered().length }}</div>
                <div class="kpi-sub">attivi in portfolio</div>
              </div>
              <svg class="kpi-spark" viewBox="0 0 80 32" preserveAspectRatio="none">
                <polygon [attr.points]="sparklineFill(sparkProjects())" class="spark-fill spark-fill-neutral"/>
                <polyline [attr.points]="sparkline(sparkProjects())" class="spark-line spark-neutral"/>
              </svg>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-top">
              <div>
                <div class="kpi-label">Avanzamento medio</div>
                <div class="kpi-value accent">{{ avgCompl() }}%</div>
                <div class="kpi-sub kpi-trend positive">+{{ avgComplTrend() }} pt vs mese scorso</div>
              </div>
              <svg class="kpi-spark" viewBox="0 0 80 32" preserveAspectRatio="none">
                <polygon [attr.points]="sparklineFill(sparkAvgCompl())" class="spark-fill spark-fill-green"/>
                <polyline [attr.points]="sparkline(sparkAvgCompl())" class="spark-line spark-green"/>
              </svg>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-top">
              <div>
                <div class="kpi-label">In corso</div>
                <div class="kpi-value">{{ inCorso() }}</div>
                <div class="kpi-sub">{{ bloccati() }} bloccato · {{ pianificazione() }} pianificato</div>
              </div>
              <svg class="kpi-spark" viewBox="0 0 80 32" preserveAspectRatio="none">
                <polygon [attr.points]="sparklineFill(sparkInCorso())" class="spark-fill spark-fill-neutral"/>
                <polyline [attr.points]="sparkline(sparkInCorso())" class="spark-line spark-neutral"/>
              </svg>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-top">
              <div>
                <div class="kpi-label">Task aperti</div>
                <div class="kpi-value">{{ taskAperti() }}</div>
                <div class="kpi-sub kpi-trend" [class.negative]="sparkTaskDelta() > 0" [class.positive]="sparkTaskDelta() < 0">
                  {{ sparkTaskDelta() > 0 ? '+' : '' }}{{ sparkTaskDelta() }} vs mese scorso
                </div>
              </div>
              <svg class="kpi-spark" viewBox="0 0 80 32" preserveAspectRatio="none">
                <polygon [attr.points]="sparklineFill(sparkTasks())" class="spark-fill spark-fill-neutral"/>
                <polyline [attr.points]="sparkline(sparkTasks())" class="spark-line spark-neutral"/>
              </svg>
            </div>
          </div>
          <div class="kpi-card">
            <div class="kpi-card-top">
              <div>
                <div class="kpi-label">Ticket Service Desk</div>
                <div class="kpi-value">{{ ticketAperti() }}</div>
                <div class="kpi-sub">{{ ticketCritici() }} critici</div>
              </div>
              <svg class="kpi-spark" viewBox="0 0 80 32" preserveAspectRatio="none">
                <polygon [attr.points]="sparklineFill(sparkTickets())" class="spark-fill spark-fill-red"/>
                <polyline [attr.points]="sparkline(sparkTickets())" class="spark-line spark-red"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- CHARTS ROW -->
        <div class="charts-grid">
          <div class="card">
            <div class="card-hdr">
              <div>
                <div class="card-eyebrow">Trend</div>
                <div class="card-title">Pianificati vs Completati · 12 mesi</div>
              </div>
              <div class="legend-pills">
                <span class="legend-pill"><span class="legend-dot" style="background:#2E2E2E"></span> Completati</span>
                <span class="legend-pill"><span class="legend-dot legend-dot-dash" style="background:#B8D8CE"></span> Pianificati</span>
              </div>
            </div>
            <div class="chart-canvas-wrap">
              <canvas #lineChart></canvas>
            </div>
          </div>

          <div class="card donut-card">
            <div class="card-hdr">
              <div>
                <div class="card-eyebrow">Distribuzione</div>
                <div class="card-title">Per stato</div>
              </div>
            </div>
            <div class="donut-wrap">
              <div class="chart-canvas-wrap donut">
                <canvas #donutChart></canvas>
              </div>
              <div class="donut-center">
                <span class="donut-center-num">{{ filtered().length }}</span>
                <span class="donut-center-lbl">TOTALE</span>
              </div>
            </div>
            <div class="donut-legend">
              @for (s of statoLegend(); track s.label) {
                <div class="donut-legend-item donut-legend-item--click"
                  (click)="goTo('/projects?stato=' + s.label)" title="Filtra per {{ s.label }}">
                  <span class="donut-legend-dot" [style.background]="s.color"></span>
                  <span class="donut-legend-lbl">{{ s.label }}</span>
                  <span class="donut-legend-val">{{ s.value }}</span>
                </div>
              }
            </div>
          </div>

          <div class="card">
            <div class="card-hdr">
              <div>
                <div class="card-eyebrow">Per Business Unit</div>
                <div class="card-title">Distribuzione</div>
              </div>
            </div>
            <div class="bu-list">
              @for (b of buList(); track b.label) {
                <div class="bu-row">
                  <div class="bu-row-hdr">
                    <span>{{ b.label }}</span>
                    <span class="bu-row-val">{{ b.value }}</span>
                  </div>
                  <div class="pbar"><div class="pfill hi" [style.width.%]="b.pct"></div></div>
                </div>
              }
              @if (buList().length === 0) {
                <div class="empty" style="padding:20px">Nessun dato</div>
              }
            </div>
          </div>
        </div>

        <!-- TABLE PROGETTI (collassabile) -->
        <div class="card collapsible-card">
          <div class="card-hdr collapsible-hdr" (click)="toggleProjects()">
            <div class="collapsible-hdr-left">
              <svg class="collapse-chevron" [class.open]="projectsOpen()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              <div>
                <div class="card-eyebrow">Elenco progetti</div>
                <div class="card-title">{{ filtered().length }} risultati</div>
              </div>
            </div>
            <button class="btn btn-s btn-sm" (click)="$event.stopPropagation(); goTo('/projects')">Vedi tutti →</button>
          </div>
          @if (projectsOpen()) {
            <div class="tbl-wrap">
              <table class="tbl">
                <thead>
                  <tr>
                    <th>Nome</th><th>Priorità</th><th>Area</th><th>Owner</th>
                    <th>Stato</th><th>Task in corso</th><th>Completamento</th><th>Scadenza</th>
                  </tr>
                </thead>
                <tbody>
                  @for (p of filtered(); track p.id) {
                    <tr class="cp" [routerLink]="['/projects', p.id]">
                      <td><strong>{{ p.nome }}</strong></td>
                      <td><span class="prio-tag" [class]="'prio-' + p.priorita.toLowerCase()">{{ p.priorita }}</span></td>
                      <td><span class="badge bgr">{{ p.area }}</span></td>
                      <td>{{ ownerName(p.owner) }}</td>
                      <td><span class="badge" [class]="statoBadge(p.stato)">
                        <span class="badge-dot" [style.background]="statoColor(p.stato)"></span>
                        {{ p.stato }}
                      </span></td>
                      <td>
                        <div class="task-chip">
                          <div class="task-dot" [style.background]="getActiveTaskColor(p.id)"></div>
                          <span class="task-chip-text">{{ getActiveTask(p.id) }}</span>
                        </div>
                      </td>
                      <td>
                        <div class="pbar-row">
                          <div class="pbar"><div class="pfill" [class]="pctClass(p.completamento)" [style.width.%]="p.completamento"></div></div>
                          <span class="pct-lbl">{{ p.completamento }}%</span>
                        </div>
                      </td>
                      <td [class.text-danger]="isScaduto(p)">{{ fmtDate(p.dataFine) }}{{ isScaduto(p) ? ' !' : '' }}</td>
                    </tr>
                  }
                  @if (filtered().length === 0) {
                    <tr><td colspan="8" class="empty">Nessun progetto trovato</td></tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>

        <!-- TABLE RICHIESTE (collassabile) -->
        <div class="card collapsible-card">
          <div class="card-hdr collapsible-hdr" (click)="toggleRichieste()">
            <div class="collapsible-hdr-left">
              <svg class="collapse-chevron" [class.open]="richiesteOpen()" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
              <div>
                <div class="card-eyebrow">Richieste recenti</div>
                <div class="card-title">{{ richiesteFiltered().length }} risultati
                  @if (richiesteInValutazione() > 0) {
                    <span class="req-badge-pill">{{ richiesteInValutazione() }} in valutazione</span>
                  }
                </div>
              </div>
            </div>
            <button class="btn btn-s btn-sm" (click)="$event.stopPropagation(); goTo('/richieste')">Vedi tutte →</button>
          </div>
          @if (richiesteOpen()) {
            @if (richiesteFiltered().length === 0) {
              <div class="empty" style="padding:20px 24px">Nessuna richiesta</div>
            } @else {
              <div class="tbl-wrap">
                <table class="tbl">
                  <thead>
                    <tr>
                      <th>Titolo</th>
                      <th>BU</th>
                      @if (!isCurrentViewer()) { <th>Richiedente</th> }
                      <th>Stato</th>
                      <th>Data</th>
                      <th>Azioni</th>
                    </tr>
                  </thead>
                  <tbody>
                    @for (r of richiesteFiltered(); track r.id) {
                      <tr>
                        <td>
                          <strong>{{ r.titolo }}</strong>
                          <div class="req-desc-preview">{{ r.descrizione | slice:0:50 }}{{ r.descrizione.length > 50 ? '…' : '' }}</div>
                        </td>
                        <td><span class="badge bgr">{{ r.buRiferimento || '—' }}</span></td>
                        @if (!isCurrentViewer()) { <td>{{ richiestaUser(r.richiedenteId) }}</td> }
                        <td>
                          <span class="badge" [class]="richiestaStatoBadge(r.stato)">
                            <span class="badge-dot" [style.background]="richiestaStatoColor(r.stato)"></span>
                            {{ r.stato }}
                          </span>
                        </td>
                        <td>{{ fmtDate(r.dataCreazione) }}</td>
                        <td>
                          @if (canManageReq() && r.stato === 'In valutazione') {
                            <a routerLink="/richieste" class="btn btn-p btn-xs">Gestisci →</a>
                          } @else if (r.stato === 'Accettata' && r.progettoCreato) {
                            <a [routerLink]="['/projects', r.progettoCreato]" class="btn btn-s btn-xs">Progetto →</a>
                          } @else { <span style="color:rgba(46,46,46,.3)">—</span> }
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            }
          }
        </div>

        <!-- BOTTOM REPORTS -->
        <div class="reports-grid">
          <div class="card">
            <div class="card-hdr">
              <div>
                <div class="card-eyebrow">Attività recenti</div>
                <div class="card-title">Ultimi eventi</div>
              </div>
              <button class="btn btn-s btn-sm" (click)="goTo('/activities')">Vedi tutte →</button>
            </div>
            <div class="activity-list">
              @for (ev of recentEvents(); track ev.id) {
                <div class="activity-row">
                  <div class="av-bubble" [style.background]="ev.color">{{ ev.initials }}</div>
                  <div class="activity-body">
                    <div class="activity-line"><strong>{{ ev.userName }}</strong> {{ ev.action }}</div>
                    <div class="activity-sub">
                      @if (ev.projectName) {
                        <a [routerLink]="['/projects', ev.projectId]" style="color:var(--mint-dd);text-decoration:none;font-weight:500">{{ ev.projectName }}</a>
                        <span> · </span>
                      }
                      {{ ev.timeAgo }}
                    </div>
                  </div>
                </div>
              }
              @if (recentEvents().length === 0) {
                <div class="empty" style="padding:20px;font-size:13px;color:rgba(46,46,46,0.4)">Nessuna attività registrata</div>
              }
            </div>
          </div>

          <div class="card">
            <div class="card-hdr">
              <div>
                <div class="card-eyebrow">Documentazione</div>
                <div class="card-title">Copertura deliverables</div>
              </div>
              <span class="kpi-badge">{{ coverageCompletati() }} / {{ coverageTotal() }} completa</span>
            </div>
            <div class="coverage-list">
              @for (item of coverageList(); track item.doc) {
                <div class="coverage-row">
                  <span class="coverage-label">{{ item.doc }}</span>
                  <span class="coverage-pct">{{ item.pct }}%</span>
                  <div class="pbar coverage-bar">
                    <div class="pfill" [class]="pctClass(item.pct)" [style.width.%]="item.pct"></div>
                  </div>
                </div>
              }
              @if (coverageList().length === 0) {
                <div class="empty" style="padding:20px">Nessun documento configurato</div>
              }
            </div>
          </div>
        </div>

      </div>
    }
  `,
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('donutChart') donutRef!: ElementRef;
  @ViewChild('lineChart')  lineRef!: ElementRef;

  private db     = inject(GithubDataService);
  private auth   = inject(AuthService);
  private router = inject(Router);

  goTo(path: string) {
    const [url, qs] = path.split('?');
    if (qs) {
      const params: Record<string,string> = {};
      qs.split('&').forEach(p => { const [k,v] = p.split('='); params[k] = decodeURIComponent(v); });
      this.router.navigate([url], { queryParams: params });
    } else {
      this.router.navigate([url]);
    }
  }

  loading   = signal(true);
  projects  = signal<Project[]>([]);
  tasks     = signal<Task[]>([]);
  users     = signal<User[]>([]);
  config    = signal<AppConfig | null>(null);
  checklist = signal<ChecklistItem[]>([]);
  tickets   = signal<Ticket[]>([]);
  richieste = signal<Richiesta[]>([]);
  logs      = signal<ActivityLog[]>([]);

  // collapsible state
  projectsOpen  = signal(false);
  richiesteOpen = signal(false);

  toggleProjects()  { this.projectsOpen.update(v => !v); }
  toggleRichieste() { this.richiesteOpen.update(v => !v); }

  filterStato = ''; filterPrio = ''; filterBU = ''; filterArea = '';

  private donutInstance: any = null;
  private lineInstance:  any = null;

  filtered = computed(() => this.projects().filter(p =>
    (!this.filterStato || p.stato === this.filterStato) &&
    (!this.filterPrio  || p.priorita === this.filterPrio) &&
    (!this.filterBU    || p.businessUnit === this.filterBU) &&
    (!this.filterArea  || p.area === this.filterArea)
  ));

  inCorso   = computed(() => this.filtered().filter(p => p.stato === 'In corso').length);
  bloccati  = computed(() => this.filtered().filter(p => ['On Hold','In attesa','Annullato'].includes(p.stato)).length);
  avgCompl  = computed(() => {
    const f = this.filtered();
    return f.length ? Math.round(f.reduce((a, p) => a + p.completamento, 0) / f.length) : 0;
  });
  avgComplTrend = computed(() => {
    const now = Date.now(); const month = 30 * 24 * 3600 * 1000;
    const recent = this.filtered().filter(p => p.dataInizio && (now - new Date(p.dataInizio).getTime()) < month);
    const older  = this.filtered().filter(p => !p.dataInizio || (now - new Date(p.dataInizio).getTime()) >= month);
    const avgR = recent.length ? Math.round(recent.reduce((a, p) => a + p.completamento, 0) / recent.length) : this.avgCompl();
    const avgO = older.length  ? Math.round(older.reduce((a, p)  => a + p.completamento, 0) / older.length)  : this.avgCompl();
    return Math.abs(avgR - avgO);
  });
  taskAperti   = computed(() => this.tasks().filter(t => t.stato !== 'Completato').length);
  taskInCorso  = computed(() => this.tasks().filter(t => t.stato === 'In corso').length);
  pianificazione = computed(() => this.filtered().filter(p => p.stato === 'Pianificazione').length);
  ticketAperti  = computed(() => this.tickets().filter(t => t.stato !== 'Chiuso' && t.stato !== 'Risolto').length);
  ticketCritici = computed(() => this.tickets().filter(t => t.priorita === 'Critica' && t.stato !== 'Chiuso').length);

  // ── Sparkline data (ultimi 7 mesi) ────────────────────
  private sparkMonths = computed(() => {
    const now = new Date();
    return Array.from({length: 7}, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (6 - i), 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  });

  sparkProjects = computed(() => this.sparkMonths().map(({year, month}) => {
    const end = new Date(year, month + 1, 0);
    return this.projects().filter(p => {
      if (!p.dataInizio) return false;
      const start = new Date(p.dataInizio);
      return start <= end && (!p.dataFine || new Date(p.dataFine) >= new Date(year, month, 1));
    }).length;
  }));

  sparkAvgCompl = computed(() => this.sparkMonths().map(({year, month}) => {
    const end = new Date(year, month + 1, 0);
    const active = this.projects().filter(p => {
      if (!p.dataInizio) return false;
      return new Date(p.dataInizio) <= end;
    });
    return active.length ? Math.round(active.reduce((s, p) => s + p.completamento, 0) / active.length) : 0;
  }));

  sparkInCorso = computed(() => this.sparkMonths().map(({year, month}) => {
    const d = new Date(year, month, 15);
    return this.projects().filter(p => {
      if (!p.dataInizio) return false;
      const start = new Date(p.dataInizio);
      const end = p.dataFine ? new Date(p.dataFine) : new Date(9999,0,1);
      return start <= d && end >= d && p.stato === 'In corso';
    }).length;
  }));

  sparkTasks = computed(() => this.sparkMonths().map(({year, month}) => {
    const d = new Date(year, month + 1, 0);
    return this.tasks().filter(t => {
      if (!t.dataInizio) return false;
      return new Date(t.dataInizio) <= d && t.stato !== 'Completato';
    }).length;
  }));

  sparkTickets = computed(() => this.sparkMonths().map(({year, month}) => {
    const d = new Date(year, month + 1, 0);
    return this.tickets().filter(t => {
      if (!t.dataApertura) return false;
      const open = new Date(t.dataApertura) <= d;
      const closed = t.dataChiusura ? new Date(t.dataChiusura) <= d : false;
      return open && !closed;
    }).length;
  }));

  sparkTaskDelta = computed(() => {
    const d = this.sparkTasks();
    return d.length >= 2 ? d[d.length-1] - d[d.length-2] : 0;
  });

  // Converte array di numeri in punti SVG per polyline (80x32 viewBox)
  sparkline(data: number[]): string {
    if (!data.length) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 80; const h = 28; const pad = 2;
    return data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h + pad;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    }).join(' ');
  }

  // Percorso chiuso per il fill area della sparkline
  sparklineFill(data: number[]): string {
    if (!data.length) return '';
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const w = 80; const h = 28; const pad = 2;
    const pts = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h + pad;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    });
    return `${pts.join(' ')} ${w},${h+pad} 0,${h+pad}`;
  }

  monthlyTrend = computed(() => {
    const now = new Date();
    const months: string[] = []; const pianificati: number[] = []; const completatiArr: number[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      months.push(d.toLocaleDateString('it-IT', { month: 'short' }));
      pianificati.push(this.projects().filter(p => {
        if (!p.dataInizio) return false;
        return new Date(p.dataInizio) <= monthEnd && (!p.dataFine || new Date(p.dataFine) >= d);
      }).length);
      completatiArr.push(this.projects().filter(p =>
        p.dataFine && p.stato === 'Completato' &&
        new Date(p.dataFine).getFullYear() === d.getFullYear() &&
        new Date(p.dataFine).getMonth() === d.getMonth()
      ).length);
    }
    return { months, pianificati, completati: completatiArr };
  });

  recentEvents = computed(() => {
    const colors = ['#6EC0AA','#4a9e8a','#2E2E2E','#8aaca4','#B8D8CE'];
    const actionVerb: Record<string,string> = {
      create:'ha creato', update:'ha modificato', delete:'ha eliminato',
      status_change:'ha aggiornato lo stato di', link:'ha collegato un documento a',
      accept:'ha accettato', reject:'ha respinto',
    };
    const entityLabel: Record<string,string> = {
      project:'il progetto', task:'il task', ticket:'il ticket',
      checklist:'la checklist', richiesta:'la richiesta', subtask:'il subtask',
    };
    return this.logs().slice(0, 8).map(log => {
      const user = this.users().find(u => u.id === log.userId);
      const name = user?.name || 'Utente';
      const parts = name.trim().split(' ');
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length-1][0]).toUpperCase()
        : name.slice(0,2).toUpperCase();
      let h = 0;
      for (let i = 0; i < (log.userId||'').length; i++) h = (h*31 + log.userId.charCodeAt(i)) & 0xffff;
      const action = `${actionVerb[log.action] || log.action} ${entityLabel[log.entityType] || log.entityType} "${log.entityName}"`;
      const extra = (log.field && log.newValue) ? ` → ${log.field}: ${log.newValue}` : '';
      return {
        id: log.id,
        userName: name,
        initials,
        color: colors[h % colors.length],
        action: action + extra,
        projectName: log.projectName || '',
        projectId: log.projectId || '',
        timeAgo: this.timeAgo(log.timestamp),
      };
    });
  });

  coverageList = computed(() => {
    const docFields = this.config()?.docFields || [];
    const checklist = this.checklist(); const projects = this.filtered(); const total = projects.length;
    if (!total || !docFields.length) return [];
    return docFields.map(doc => {
      const done = checklist.filter(c => c.documento === doc && c.completato && projects.some(p => p.id === c.projectId)).length;
      return { doc, pct: Math.round((done / total) * 100) };
    }).sort((a,b) => b.pct - a.pct);
  });
  coverageTotal      = computed(() => this.config()?.docFields?.length || 0);
  coverageCompletati = computed(() => this.coverageList().filter(i => i.pct === 100).length);

  // ── Richieste dashboard ──────────────────────────────
  isCurrentViewer = computed(() => this.auth.currentUser()?.role === 'viewer');
  canManageReq    = computed(() => ['admin','editor'].includes(this.auth.currentUser()?.role || ''));

  richiesteFiltered = computed(() => {
    const uid = this.auth.currentUser()?.id || '';
    const list = this.isCurrentViewer()
      ? this.richieste().filter(r => r.richiedenteId === uid)
      : this.richieste();
    return list.sort((a, b) => b.dataCreazione.localeCompare(a.dataCreazione)).slice(0, 10);
  });

  richiesteInValutazione = computed(() =>
    this.richieste().filter(r => r.stato === 'In valutazione').length
  );

  statoColors: Record<string,string> = {
    'In corso':'#6EC0AA','Completato':'#2E2E2E','Pianificazione':'#B8D8CE',
    'In attesa':'#E89B8A','On Hold':'#E89B8A','Annullato':'#8aaca4',
  };
  statoLegend = computed(() => {
    const counts: Record<string,number> = {};
    this.filtered().forEach(p => { counts[p.stato] = (counts[p.stato]||0) + 1; });
    return Object.entries(counts).map(([label,value]) => ({ label, value, color: this.statoColors[label]||'#8aaca4' }));
  });
  buList = computed(() => {
    const counts: Record<string,number> = {};
    this.filtered().forEach(p => { if (p.businessUnit) counts[p.businessUnit] = (counts[p.businessUnit]||0)+1; });
    const max = Math.max(1, ...Object.values(counts));
    return Object.entries(counts).sort((a,b)=>b[1]-a[1]).map(([label,value]) => ({ label, value, pct: (value/max)*100 }));
  });

  ngOnInit() { this.load(); }
  ngAfterViewInit() { this.loadChartScript(); }

  loadChartScript() {
    if ((window as any).Chart) return;
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    document.head.appendChild(s);
  }

  async load() {
    this.loading.set(true);
    const [p, u, c, t, cl, tk, rq, lg] = await Promise.all([
      this.db.getProjects(), this.db.getUsers(), this.db.getConfig(),
      this.db.getTasks(), this.db.getChecklist(), this.db.getTickets(),
      this.db.getRichieste(), this.db.getLogs(50)
    ]);
    this.projects.set(p); this.users.set(u); this.config.set(c);
    this.tasks.set(t); this.checklist.set(cl); this.tickets.set(tk);
    this.richieste.set(rq); this.logs.set(lg);
    this.loading.set(false);
    setTimeout(() => this.renderCharts(), 100);
  }

  renderCharts() {
    const C = (window as any).Chart;
    if (!C) { setTimeout(() => this.renderCharts(), 300); return; }
    const ink = '#2E2E2E'; const mintL = '#B8D8CE';
    const legend = this.statoLegend(); const trend = this.monthlyTrend();

    if (this.donutInstance) this.donutInstance.destroy();
    if (this.donutRef?.nativeElement && legend.length) {
      this.donutInstance = new C(this.donutRef.nativeElement, {
        type: 'doughnut',
        data: { labels: legend.map(l=>l.label), datasets: [{ data: legend.map(l=>l.value), backgroundColor: legend.map(l=>l.color), borderWidth:0, hoverOffset:6 }] },
        options: {
          responsive:true, maintainAspectRatio:false, cutout:'72%',
          cursor: 'pointer',
          plugins:{ legend:{display:false}, tooltip:{backgroundColor:ink,padding:10} },
          onClick: (_: any, elements: any[]) => {
            if (!elements.length) return;
            const idx = elements[0].index;
            const stato = legend[idx]?.label;
            if (stato) this.router.navigate(['/projects'], { queryParams: { stato } });
          }
        }
      });
      this.donutRef.nativeElement.style.cursor = 'pointer';
    }

    if (this.lineInstance) this.lineInstance.destroy();
    if (this.lineRef?.nativeElement) {
      const monthlyData = trend;
      this.lineInstance = new C(this.lineRef.nativeElement, {
        type: 'line',
        data: {
          labels: trend.months,
          datasets: [
            {
              label: 'Completati', data: trend.completati,
              borderColor: ink, backgroundColor: 'rgba(46,46,46,0.07)',
              borderWidth: 2, pointRadius: 4, pointBackgroundColor: ink,
              pointBorderColor: '#fff', pointBorderWidth: 2, tension: 0.35, fill: true,
            },
            {
              label: 'Pianificati', data: trend.pianificati,
              borderColor: '#8aaca4', backgroundColor: 'rgba(184,216,206,0.15)',
              borderWidth: 2, borderDash: [6, 4], pointRadius: 3,
              pointBackgroundColor: mintL, pointBorderColor: '#fff',
              pointBorderWidth: 2, tension: 0.35, fill: true,
            }
          ]
        },
        options: {
          responsive:true, maintainAspectRatio:false,
          plugins: {
            legend:{display:false},
            tooltip:{ backgroundColor:ink, padding:10, callbacks:{ label:(ctx:any)=>` ${ctx.dataset.label}: ${ctx.parsed.y}` } }
          },
          scales: {
            x: { grid:{color:'rgba(46,46,46,0.05)'}, ticks:{font:{size:10,family:'Geist'},color:'rgba(46,46,46,0.45)'} },
            y: { beginAtZero:true, grid:{color:'rgba(46,46,46,0.05)'}, ticks:{font:{size:10,family:'Geist'},color:'rgba(46,46,46,0.45)',stepSize:1} }
          },
          onClick: (_: any, elements: any[]) => {
            if (!elements.length) return;
            const pointIdx = elements[0].index;
            const datasetIdx = elements[0].datasetIndex;
            const mese = monthlyData.months[pointIdx];
            const tipo = datasetIdx === 0 ? 'Completato' : 'Pianificazione';
            if (mese) this.router.navigate(['/projects'], { queryParams: { stato: tipo } });
          },
          onHover: (_: any, elements: any[]) => {
            if (this.lineRef?.nativeElement)
              this.lineRef.nativeElement.style.cursor = elements.length ? 'pointer' : 'default';
          }
        }
      });
    }
  }

  getActiveTask(projectId: string): string {
    const SEQUENCE = ['REQUISITI','TEMPI E STIME','SVILUPPO','COLLAUDO LDT','COLLAUDO BU','PRODUZIONE','ADOPTION'];
    const pt = this.tasks().filter(t => t.projectId === projectId);
    if (!pt.length) return '—';
    const inProg = pt.find(t => t.stato === 'In corso'); if (inProg) return inProg.nome;
    const daFare = pt.find(t => t.stato === 'Da fare' && SEQUENCE.indexOf(t.nome) >= 0); if (daFare) return daFare.nome;
    const last = pt.filter(t => t.stato === 'Completato').pop(); return last ? last.nome : '—';
  }
  getActiveTaskColor(projectId: string): string {
    const pt = this.tasks().filter(t => t.projectId === projectId);
    if (pt.find(t => t.stato === 'In corso')) return '#6EC0AA';
    if (pt.length && pt.every(t => t.stato === 'Completato')) return '#2E2E2E';
    return '#B8D8CE';
  }
  ownerName(ownerId: string): string { return this.users().find(u => u.id === ownerId)?.name || '—'; }
  fmtDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'2-digit' });
  }
  isScaduto(p: Project): boolean { return !!p.dataFine && new Date(p.dataFine) < new Date() && p.stato !== 'Completato'; }
  statoBadge(s: string): string {
    const m: Record<string,string> = { 'In corso':'status-corso','Completato':'status-compl','Pianificazione':'status-pianif','In attesa':'status-attesa','On Hold':'status-attesa','Annullato':'bgr' };
    return m[s] || 'bgr';
  }
  statoColor(s: string): string { return this.statoColors[s] || '#8aaca4'; }
  richiestaUser(id: string)      { return this.users().find(u => u.id === id)?.name || '—'; }
  richiestaStatoBadge(s: string) { return s === 'Accettata' ? 'status-compl' : s === 'Respinta' ? 'status-attesa' : 'status-pianif'; }
  richiestaStatoColor(s: string) { return s === 'Accettata' ? '#6EC0AA' : s === 'Respinta' ? '#E89B8A' : '#B8D8CE'; }

  pctClass(n: number): string { return n >= 70 ? 'hi' : n >= 40 ? 'md' : 'lo'; }
  timeAgo(dateStr: string): string {
    if (!dateStr) return '—';
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return mins <= 1 ? 'Poco fa' : `${mins} min fa`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours === 1 ? '1 ora fa' : `${hours} ore fa`;
    const days = Math.floor(hours / 24);
    if (days === 1) return 'Ieri';
    if (days < 7) return `${days} giorni fa`;
    return new Date(dateStr).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit' });
  }
}
