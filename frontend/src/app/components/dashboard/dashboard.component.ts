// src/app/components/dashboard/dashboard.component.ts
import { Component, inject, OnInit, signal, computed, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GithubDataService } from '../../core/services/github-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, User, AppConfig, Task } from '../../core/models';
import { FormsModule } from '@angular/forms';

declare var Chart: any;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-hdr" style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div class="page-title">Dashboard Portfolio</div>
          <div class="page-sub">Riepilogo in tempo reale</div>
        </div>
        <div style="display:flex;gap:8px;align-items:center">
          <select class="fbar-sel" [(ngModel)]="filterStato">
            <option value="">Tutti gli stati</option>
            @for (s of config()?.statiProgetto||[]; track s) { <option>{{s}}</option> }
          </select>
          <select class="fbar-sel" [(ngModel)]="filterPrio">
            <option value="">Tutte le priorità</option>
            @for (s of config()?.priorita||[]; track s) { <option>{{s}}</option> }
          </select>
          <select class="fbar-sel" [(ngModel)]="filterBU">
            <option value="">Tutte le BU</option>
            @for (s of config()?.businessUnits||[]; track s) { <option>{{s}}</option> }
          </select>
          @if (filterStato || filterPrio || filterBU) {
            <button class="btn btn-g btn-sm" (click)="filterStato='';filterPrio='';filterBU=''">Reset</button>
          }
          <button class="btn btn-s btn-sm" (click)="load()" [disabled]="loading()">
            @if (loading()) { ... } @else { Aggiorna }
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-full"><span class="spinner"></span><span>Caricamento dati...</span></div>
      } @else {

        <!-- STAT CARDS -->
        <div class="stat-grid">
          <div class="stat-card al">
            <div class="stat-lbl">Totale Progetti</div>
            <div class="stat-val">{{ filtered().length }}</div>
          </div>
          <div class="stat-card ag">
            <div class="stat-lbl">In Corso</div>
            <div class="stat-val green">{{ inCorso() }}</div>
          </div>
          <div class="stat-card ao">
            <div class="stat-lbl">Completati</div>
            <div class="stat-val">{{ completati() }}</div>
          </div>
          <div class="stat-card ar">
            <div class="stat-lbl">A Rischio</div>
            <div class="stat-val">{{ aRischio() }}</div>
          </div>
          <div class="stat-card al">
            <div class="stat-lbl">Completamento Medio</div>
            <div class="stat-val">{{ avgCompl() }}<span style="font-size:14px">%</span></div>
          </div>
          <div class="stat-card ap">
            <div class="stat-lbl">Priorità Critica</div>
            <div class="stat-val" style="color:var(--danger)">{{ critici() }}</div>
          </div>
        </div>

        <!-- GRAFICI -->
        <div class="charts-grid">
          <div class="card">
            <div class="card-title" style="margin-bottom:14px">Per stato</div>
            <div style="position:relative;height:180px;display:flex;align-items:center;justify-content:center">
              <canvas #donutChart></canvas>
            </div>
          </div>
          <div class="card">
            <div class="card-title" style="margin-bottom:14px">Avanzamento per progetto</div>
            <div style="position:relative;height:180px">
              <canvas #barChart></canvas>
            </div>
          </div>
          <div class="card">
            <div class="card-title" style="margin-bottom:14px">Per business unit</div>
            <div style="position:relative;height:180px">
              <canvas #buChart></canvas>
            </div>
          </div>
        </div>

        <!-- TABELLA -->
        <div class="card">
          <div style="margin-bottom:14px;display:flex;align-items:center;justify-content:space-between">
            <span class="card-title">Avanzamento Progetti</span>
            <a routerLink="/projects" class="btn btn-p btn-sm">+ Nuovo Progetto</a>
          </div>
          <div class="tbl-wrap">
            <table>
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
                    <td><span class="badge" [class]="prioBadge(p.priorita)">{{ p.priorita }}</span></td>
                    <td><span class="badge bgr">{{ p.area }}</span></td>
                    <td>{{ ownerName(p.owner) }}</td>
                    <td><span class="badge" [class]="statoBadge(p.stato)">{{ p.stato }}</span></td>
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
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .charts-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:14px; margin-bottom:20px; }
    .fbar-sel { font-family:inherit; font-size:13px; border:1px solid var(--gray-200); border-radius:6px; padding:5px 10px; background:white; color:var(--black); outline:none; }
    .pbar-row { display:flex; align-items:center; gap:8px; }
    .pbar { height:6px; background:var(--gray-100); border-radius:3px; overflow:hidden; width:80px; }
    .pfill { height:100%; border-radius:3px; }
    .pfill.hi { background:var(--green); }
    .pfill.md { background:var(--warning); }
    .pfill.lo { background:var(--danger); }
    .pct-lbl { font-size:11px; color:var(--gray-600); min-width:30px; }
    .text-danger { color:var(--danger); }
    .green { color:var(--green); }
    .task-chip { display:inline-flex; align-items:center; gap:5px; background:var(--gray-100); border-radius:4px; padding:3px 8px; font-size:10px; font-weight:600; color:var(--gray-600); max-width:130px; }
    .task-dot { width:7px; height:7px; border-radius:50%; flex-shrink:0; }
    .task-chip-text { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; letter-spacing:.3px; }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  @ViewChild('donutChart') donutRef!: ElementRef;
  @ViewChild('barChart') barRef!: ElementRef;
  @ViewChild('buChart') buRef!: ElementRef;

  private db = inject(GithubDataService);
  private auth = inject(AuthService);

  loading = signal(true);
  projects = signal<Project[]>([]);
  tasks = signal<Task[]>([]);
  users = signal<User[]>([]);
  config = signal<AppConfig | null>(null);

  filterStato = '';
  filterPrio = '';
  filterBU = '';

  private donutInstance: any = null;
  private barInstance: any = null;
  private buInstance: any = null;

  filtered = computed(() => this.projects().filter(p =>
    (!this.filterStato || p.stato === this.filterStato) &&
    (!this.filterPrio  || p.priorita === this.filterPrio) &&
    (!this.filterBU    || p.businessUnit === this.filterBU)
  ));

  inCorso    = computed(() => this.filtered().filter(p => p.stato === 'In corso').length);
  completati = computed(() => this.filtered().filter(p => p.stato === 'Completato').length);
  aRischio   = computed(() => this.filtered().filter(p => ['On Hold','In attesa','Annullato'].includes(p.stato)).length);
  critici    = computed(() => this.filtered().filter(p => p.priorita === 'Critica').length);
  avgCompl   = computed(() => {
    const f = this.filtered();
    return f.length ? Math.round(f.reduce((a, p) => a + p.completamento, 0) / f.length) : 0;
  });

  ngOnInit() { this.load(); }

  ngAfterViewInit() {
    this.loadChartScript();
  }

  loadChartScript() {
    if ((window as any).Chart) { return; }
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js';
    s.onload = () => { /* charts will render when data loads */ };
    document.head.appendChild(s);
  }

  async load() {
    this.loading.set(true);
    const [p, u, c, t] = await Promise.all([
      this.db.getProjects(), this.db.getUsers(),
      this.db.getConfig(), this.db.getTasks()
    ]);
    this.projects.set(p);
    this.users.set(u);
    this.config.set(c);
    this.tasks.set(t);
    this.loading.set(false);
    setTimeout(() => this.renderCharts(), 100);
  }

  renderCharts() {
    const C = (window as any).Chart;
    if (!C) { setTimeout(() => this.renderCharts(), 300); return; }

    const green = '#3ECFB2';
    const blue = '#378ADD';
    const amber = '#EF9F27';
    const red = '#E24B4A';
    const gray = '#9b9b96';
    const purple = '#7C5CBF';

    const projects = this.filtered();

    // ── Donut per stato ──────────────────────────────────────
    const statoCounts: Record<string, number> = {};
    projects.forEach(p => { statoCounts[p.stato] = (statoCounts[p.stato] || 0) + 1; });
    const statoLabels = Object.keys(statoCounts);
    const statoColors: Record<string, string> = {
      'In corso': blue, 'Completato': green, 'Pianificazione': purple,
      'In attesa': amber, 'On Hold': amber, 'Annullato': red
    };

    if (this.donutInstance) this.donutInstance.destroy();
    if (this.donutRef?.nativeElement) {
      this.donutInstance = new C(this.donutRef.nativeElement, {
        type: 'doughnut',
        data: {
          labels: statoLabels,
          datasets: [{ data: statoLabels.map(l => statoCounts[l]),
            backgroundColor: statoLabels.map(l => statoColors[l] || gray),
            borderWidth: 0, hoverOffset: 4 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, cutout: '65%',
          plugins: { legend: { position: 'right', labels: { font: { size: 11 }, padding: 10, boxWidth: 12 } } }
        }
      });
    }

    // ── Bar avanzamento per progetto ──────────────────────────
    const top = projects.slice(0, 6);
    if (this.barInstance) this.barInstance.destroy();
    if (this.barRef?.nativeElement) {
      this.barInstance = new C(this.barRef.nativeElement, {
        type: 'bar',
        data: {
          labels: top.map(p => p.nome.length > 15 ? p.nome.slice(0, 14) + '…' : p.nome),
          datasets: [{
            data: top.map(p => p.completamento),
            backgroundColor: top.map(p => p.completamento >= 70 ? green : p.completamento >= 40 ? amber : red),
            borderRadius: 4, borderWidth: 0
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false, indexAxis: 'y',
          plugins: { legend: { display: false } },
          scales: {
            x: { max: 100, grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 10 }, callback: (v: any) => v + '%' } },
            y: { grid: { display: false }, ticks: { font: { size: 10 } } }
          }
        }
      });
    }

    // ── Bar per BU ────────────────────────────────────────────
    const buCounts: Record<string, number> = {};
    projects.forEach(p => { if (p.businessUnit) buCounts[p.businessUnit] = (buCounts[p.businessUnit] || 0) + 1; });
    const buLabels = Object.keys(buCounts);
    const buColors = [green, blue, amber, purple, red, gray];

    if (this.buInstance) this.buInstance.destroy();
    if (this.buRef?.nativeElement) {
      this.buInstance = new C(this.buRef.nativeElement, {
        type: 'bar',
        data: {
          labels: buLabels,
          datasets: [{ data: buLabels.map(l => buCounts[l]),
            backgroundColor: buLabels.map((_, i) => buColors[i % buColors.length]),
            borderRadius: 4, borderWidth: 0 }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { grid: { color: 'rgba(0,0,0,.05)' }, ticks: { font: { size: 10 }, stepSize: 1 } },
            x: { grid: { display: false }, ticks: { font: { size: 10 } } }
          }
        }
      });
    }
  }

  // ── Task in corso ────────────────────────────────────────────
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
    if (pt.find(t => t.stato === 'In corso')) return '#378ADD';
    if (pt.length && pt.every(t => t.stato === 'Completato')) return '#3ECFB2';
    return '#9b9b96';
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
    const m: Record<string,string> = { 'In corso':'bb', 'Completato':'bg', 'Pianificazione':'bgr', 'In attesa':'bo', 'Annullato':'br', 'On Hold':'bo' };
    return 'badge ' + (m[s] || 'bgr');
  }

  prioBadge(p: string): string {
    const m: Record<string,string> = { 'Critica':'prio-critica', 'Alta':'prio-alta', 'Media':'prio-media', 'Bassa':'prio-bassa' };
    return 'badge ' + (m[p] || 'bgr');
  }

  pctClass(n: number): string { return n >= 70 ? 'pfill hi' : n >= 40 ? 'pfill md' : 'pfill lo'; }
}
