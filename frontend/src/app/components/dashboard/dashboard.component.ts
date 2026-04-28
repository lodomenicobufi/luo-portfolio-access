// src/app/components/dashboard/dashboard.component.ts
import { Component, inject, OnInit, signal, computed, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GithubDataService } from '../../core/services/github-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, User, AppConfig, Task, ChecklistItem } from '../../core/models';

declare var Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <!-- ─── FILTER BAR ─────────────────────────────── -->
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

    <!-- ─── PAGE BODY ──────────────────────────────── -->
    @if (loading()) {
      <div class="loading-full"><span class="spinner"></span><span>Caricamento dati…</span></div>
    } @else {
      <div class="page-body">

        <!-- KPI ROW -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Totale progetti</div>
            <div class="kpi-value">{{ filtered().length }}</div>
            <div class="kpi-sub">attivi in portfolio</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Avanzamento medio</div>
            <div class="kpi-value accent">{{ avgCompl() }}%</div>
            <div class="kpi-sub">completamento ponderato</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">In corso</div>
            <div class="kpi-value">{{ inCorso() }}</div>
            <div class="kpi-sub">{{ aRischio() }} a rischio</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Task aperti</div>
            <div class="kpi-value">{{ taskAperti() }}</div>
            <div class="kpi-sub">{{ taskInCorso() }} in corso</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Priorità critica</div>
            <div class="kpi-value">{{ critici() }}</div>
            <div class="kpi-sub">richiedono attenzione</div>
          </div>
        </div>

        <!-- CHARTS ROW -->
        <div class="charts-grid">
          <!-- Trend chart (placeholder - barre avanzamento) -->
          <div class="card">
            <div class="card-hdr">
              <div>
                <div class="card-eyebrow">Avanzamento</div>
                <div class="card-title">Top progetti per completamento</div>
              </div>
            </div>
            <div class="chart-canvas-wrap">
              <canvas #barChart></canvas>
            </div>
          </div>

          <!-- Donut: Distribuzione per stato -->
          <div class="card">
            <div class="card-hdr">
              <div>
                <div class="card-eyebrow">Distribuzione</div>
                <div class="card-title">Per stato</div>
              </div>
            </div>
            <div class="chart-canvas-wrap donut">
              <canvas #donutChart></canvas>
            </div>
            <div class="donut-legend">
              @for (s of statoLegend(); track s.label) {
                <div class="donut-legend-item">
                  <span class="donut-legend-dot" [style.background]="s.color"></span>
                  <span class="donut-legend-lbl">{{ s.label }}</span>
                  <span class="donut-legend-val">{{ s.value }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Per Business Unit -->
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

        <!-- BOTTOM REPORTS ROW -->
        <div class=\"reports-grid\">

          <!-- Attività recenti -->
          <div class=\"card\">
            <div class=\"card-hdr\">
              <div>
                <div class=\"card-eyebrow\">Attività recenti</div>
                <div class=\"card-title\">Ultimi eventi</div>
              </div>
              <a routerLink=\"/projects\" class=\"btn btn-s btn-sm\">Tutto →</a>
            </div>
            <div class=\"activity-list\">
              @for (ev of recentEvents(); track ev.id) {
                <div class=\"activity-row\">
                  <div class=\"av-bubble\" [style.background]=\"ev.color\">{{ ev.initials }}</div>
                  <div class=\"activity-body\">
                    <div class=\"activity-line\">
                      <strong>{{ ev.userName }}</strong> {{ ev.action }}
                    </div>
                    <div class=\"activity-sub\">{{ ev.projectName }} · {{ ev.timeAgo }}</div>
                  </div>
                </div>
              }
              @if (recentEvents().length === 0) {
                <div class=\"empty\" style=\"padding:20px\">Nessuna attività recente</div>
              }
            </div>
          </div>

          <!-- Copertura deliverables -->
          <div class=\"card\">
            <div class=\"card-hdr\">
              <div>
                <div class=\"card-eyebrow\">Documentazione</div>
                <div class=\"card-title\">Copertura deliverables</div>
              </div>
              <span class=\"kpi-badge\">{{ coverageCompletati() }} / {{ coverageTotal() }} completa</span>
            </div>
            <div class=\"coverage-list\">
              @for (item of coverageList(); track item.doc) {
                <div class=\"coverage-row\">
                  <span class=\"coverage-label\">{{ item.doc }}</span>
                  <span class=\"coverage-pct\">{{ item.pct }}%</span>
                  <div class=\"pbar coverage-bar\">
                    <div class=\"pfill\" [class]=\"pctClass(item.pct)\" [style.width.%]=\"item.pct\"></div>
                  </div>
                </div>
              }
              @if (coverageList().length === 0) {
                <div class=\"empty\" style=\"padding:20px\">Nessun documento configurato</div>
              }
            </div>
          </div>

        </div>

        <!-- TABLE -->
        <div class="card">
          <div class="card-hdr">
            <div>
              <div class="card-eyebrow">Elenco progetti</div>
              <div class="card-title">{{ filtered().length }} risultati</div>
            </div>
            <a routerLink="/projects" class="btn btn-mint btn-sm">+ Nuovo progetto</a>
          </div>
          <div class="tbl-wrap">
            <table class="tbl">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Priorità</th>
                  <th>Area</th>
                  <th>Owner</th>
                  <th>Stato</th>
                  <th>Task in corso</th>
                  <th>Completamento</th>
                  <th>Scadenza</th>
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
                  <tr><td colspan="8" class="empty">Nessun progetto trovato con i filtri selezionati</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>

      </div>
    }
  `,
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('donutChart') donutRef!: ElementRef;
  @ViewChild('barChart') barRef!: ElementRef;

  private db = inject(GithubDataService);
  private auth = inject(AuthService);

  loading = signal(true);
  projects = signal<Project[]>([]);
  tasks = signal<Task[]>([]);
  users = signal<User[]>([]);
  config = signal<AppConfig | null>(null);
  checklist = signal<ChecklistItem[]>([]);

  filterStato = '';
  filterPrio = '';
  filterBU = '';
  filterArea = '';

  private donutInstance: any = null;
  private barInstance: any = null;

  // ── Computed ────────────────────────────────────────
  filtered = computed(() => this.projects().filter(p =>
    (!this.filterStato || p.stato === this.filterStato) &&
    (!this.filterPrio  || p.priorita === this.filterPrio) &&
    (!this.filterBU    || p.businessUnit === this.filterBU) &&
    (!this.filterArea  || p.area === this.filterArea)
  ));

  inCorso     = computed(() => this.filtered().filter(p => p.stato === 'In corso').length);
  completati  = computed(() => this.filtered().filter(p => p.stato === 'Completato').length);
  aRischio    = computed(() => this.filtered().filter(p => ['On Hold','In attesa','Annullato'].includes(p.stato)).length);
  critici     = computed(() => this.filtered().filter(p => p.priorita === 'Critica').length);
  avgCompl    = computed(() => {
    const f = this.filtered();
    return f.length ? Math.round(f.reduce((a, p) => a + p.completamento, 0) / f.length) : 0;
  });
  taskAperti   = computed(() => this.tasks().filter(t => t.stato !== 'Completato').length);
  taskInCorso  = computed(() => this.tasks().filter(t => t.stato === 'In corso').length);

  // ── Recent events (dai task completati recentemente) ──────────
  recentEvents = computed(() => {
    const SEQUENCE = ['REQUISITI','TEMPI E STIME','SVILUPPO','COLLAUDO LDT','COLLAUDO BU','PRODUZIONE','ADOPTION'];
    const projects = this.projects();
    const users = this.users();
    const events: any[] = [];

    // Task completati come eventi
    const completedTasks = this.tasks()
      .filter(t => t.stato === 'Completato' && t.dataFine)
      .sort((a, b) => new Date(b.dataFine).getTime() - new Date(a.dataFine).getTime())
      .slice(0, 8);

    completedTasks.forEach(t => {
      const project = projects.find(p => p.id === t.projectId);
      if (!project) return;
      const owner = users.find(u => u.id === project.owner);
      const name = owner?.name || 'Utente';
      const parts = name.trim().split(' ');
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
      const colors = ['#6EC0AA','#4a9e8a','#B8D8CE','#2E2E2E','#8aaca4'];
      const colorIdx = name.charCodeAt(0) % colors.length;
      events.push({
        id: t.id,
        userName: name,
        initials,
        color: colors[colorIdx],
        action: `ha completato il task '${t.nome}'`,
        projectName: project.nome,
        timeAgo: this.timeAgo(t.dataFine),
      });
    });

    // Checklist completate come eventi
    const completedDocs = this.checklist()
      .filter(c => c.completato)
      .slice(0, 4);

    completedDocs.forEach(c => {
      const project = projects.find(p => p.id === c.projectId);
      if (!project) return;
      const owner = users.find(u => u.id === project.owner);
      const name = owner?.name || 'Utente';
      const parts = name.trim().split(' ');
      const initials = parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();
      events.push({
        id: 'cl-' + c.id,
        userName: name,
        initials,
        color: '#6EC0AA',
        action: `ha caricato ${c.documento}`,
        projectName: project.nome,
        timeAgo: '—',
      });
    });

    return events.slice(0, 6);
  });

  // ── Coverage deliverables (checklist per docField) ────────────
  coverageList = computed(() => {
    const docFields = this.config()?.docFields || [];
    const checklist = this.checklist();
    const projects = this.filtered();
    const total = projects.length;
    if (total === 0 || docFields.length === 0) return [];
    return docFields.map(doc => {
      const completati = checklist.filter(c =>
        c.documento === doc && c.completato && projects.some(p => p.id === c.projectId)
      ).length;
      return { doc, pct: Math.round((completati / total) * 100) };
    }).sort((a, b) => b.pct - a.pct);
  });

  coverageTotal     = computed(() => this.config()?.docFields?.length || 0);
  coverageCompletati = computed(() => this.coverageList().filter(i => i.pct === 100).length);

  statoColors: Record<string, string> = {
    'In corso':       '#6EC0AA',
    'Completato':     '#2E2E2E',
    'Pianificazione': '#B8D8CE',
    'In attesa':      '#E89B8A',
    'On Hold':        '#E89B8A',
    'Annullato':      '#8aaca4',
  };

  statoLegend = computed(() => {
    const counts: Record<string, number> = {};
    this.filtered().forEach(p => { counts[p.stato] = (counts[p.stato] || 0) + 1; });
    return Object.entries(counts).map(([label, value]) => ({
      label, value, color: this.statoColors[label] || '#8aaca4'
    }));
  });

  buList = computed(() => {
    const counts: Record<string, number> = {};
    this.filtered().forEach(p => {
      if (p.businessUnit) counts[p.businessUnit] = (counts[p.businessUnit] || 0) + 1;
    });
    const max = Math.max(1, ...Object.values(counts));
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value, pct: (value / max) * 100 }));
  });

  // ── Lifecycle ───────────────────────────────────────
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
    const [p, u, c, t, cl] = await Promise.all([
      this.db.getProjects(), this.db.getUsers(),
      this.db.getConfig(), this.db.getTasks(),
      this.db.getChecklist()
    ]);
    this.projects.set(p);
    this.users.set(u);
    this.config.set(c);
    this.tasks.set(t);
    this.checklist.set(cl);
    this.loading.set(false);
    setTimeout(() => this.renderCharts(), 100);
  }

  // ── Charts ──────────────────────────────────────────
  renderCharts() {
    const C = (window as any).Chart;
    if (!C) { setTimeout(() => this.renderCharts(), 300); return; }

    const mint   = '#6EC0AA';
    const mintD  = '#4a9e8a';
    const mintL  = '#B8D8CE';
    const ink    = '#2E2E2E';
    const blocco = '#E89B8A';

    const projects = this.filtered();
    const legend = this.statoLegend();

    // Donut
    if (this.donutInstance) this.donutInstance.destroy();
    if (this.donutRef?.nativeElement && legend.length) {
      this.donutInstance = new C(this.donutRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: legend.map(l => l.label),
          datasets: [{
            data: legend.map(l => l.value),
            backgroundColor: legend.map(l => l.color),
            borderWidth: 0,
            hoverOffset: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '70%',
          plugins: { legend: { display: false }, tooltip: { backgroundColor: ink, padding: 10 } }
        }
      });
    }

    // Bar avanzamento
    const top = [...projects].sort((a, b) => b.completamento - a.completamento).slice(0, 6);
    if (this.barInstance) this.barInstance.destroy();
    if (this.barRef?.nativeElement) {
      this.barInstance = new C(this.barRef.nativeElement, {
        type: 'bar',
        data: {
          labels: top.map(p => p.nome.length > 18 ? p.nome.slice(0, 17) + '…' : p.nome),
          datasets: [{
            data: top.map(p => p.completamento),
            backgroundColor: top.map(p => p.completamento >= 70 ? mint : p.completamento >= 40 ? mintL : blocco),
            borderRadius: 4,
            borderWidth: 0,
            barThickness: 16,
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, indexAxis: 'y',
          plugins: { legend: { display: false }, tooltip: { backgroundColor: ink, padding: 10 } },
          scales: {
            x: {
              max: 100,
              grid: { color: 'rgba(46,46,46,0.05)' },
              ticks: { font: { size: 10, family: 'Geist' }, color: 'rgba(46,46,46,0.5)', callback: (v: any) => v + '%' }
            },
            y: {
              grid: { display: false },
              ticks: { font: { size: 11, family: 'Geist' }, color: ink }
            }
          }
        }
      });
    }
  }

  // ── Helpers ─────────────────────────────────────────
  getActiveTask(projectId: string): string {
    const SEQUENCE = ['REQUISITI','TEMPI E STIME','SVILUPPO','COLLAUDO LDT','COLLAUDO BU','PRODUZIONE','ADOPTION'];
    const pt = this.tasks().filter(t => t.projectId === projectId);
    if (!pt.length) return '—';
    const inProg = pt.find(t => t.stato === 'In corso');
    if (inProg) return inProg.nome;
    const daFare = pt.find(t => t.stato === 'Da fare' && SEQUENCE.indexOf(t.nome) >= 0);
    if (daFare) return daFare.nome;
    const last = pt.filter(t => t.stato === 'Completato').pop();
    return last ? last.nome : '—';
  }

  getActiveTaskColor(projectId: string): string {
    const pt = this.tasks().filter(t => t.projectId === projectId);
    if (pt.find(t => t.stato === 'In corso')) return '#6EC0AA';
    if (pt.length && pt.every(t => t.stato === 'Completato')) return '#2E2E2E';
    return '#B8D8CE';
  }

  ownerName(ownerId: string): string {
    return this.users().find(u => u.id === ownerId)?.name || '—';
  }

  fmtDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'2-digit' });
  }

  isScaduto(p: Project): boolean {
    return !!p.dataFine && new Date(p.dataFine) < new Date() && p.stato !== 'Completato';
  }

  statoBadge(s: string): string {
    const m: Record<string,string> = {
      'In corso':       'status-corso',
      'Completato':     'status-compl',
      'Pianificazione': 'status-pianif',
      'In attesa':      'status-attesa',
      'On Hold':        'status-attesa',
      'Annullato':      'bgr',
    };
    return m[s] || 'bgr';
  }

  statoColor(s: string): string { return this.statoColors[s] || '#8aaca4'; }

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
    return new Date(dateStr).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
  }
}
