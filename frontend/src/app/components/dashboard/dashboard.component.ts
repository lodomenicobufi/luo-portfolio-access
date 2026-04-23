// src/app/components/dashboard/dashboard.component.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { GithubDataService } from '../../core/services/github-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, User, AppConfig } from '../../core/models';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-hdr">
        <div>
          <div class="page-title">Dashboard Portfolio</div>
          <div class="page-sub">Riepilogo in tempo reale — dati da GitHub</div>
        </div>
        <button class="btn btn-s btn-sm" (click)="load()" [disabled]="loading()">
          @if (loading()) { <span class="spinner-sm"></span> } @else { ↻ } Aggiorna
        </button>
      </div>

      @if (loading()) {
        <div class="loading-full"><span class="spinner"></span><span>Caricamento dati...</span></div>
      } @else {

        <!-- FILTRI -->
        <div class="fbar">
          <select [(ngModel)]="filterStato">
            <option value="">Tutti gli stati</option>
            @for (s of config()?.statiProgetto || []; track s) { <option>{{s}}</option> }
          </select>
          <select [(ngModel)]="filterPrio">
            <option value="">Tutte le priorità</option>
            @for (s of config()?.priorita || []; track s) { <option>{{s}}</option> }
          </select>
          <select [(ngModel)]="filterBU">
            <option value="">Tutte le BU</option>
            @for (s of config()?.businessUnits || []; track s) { <option>{{s}}</option> }
          </select>
          @if (filterStato || filterPrio || filterBU) {
            <button class="btn btn-g btn-sm" (click)="filterStato='';filterPrio='';filterBU=''">× Reset</button>
          }
        </div>

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
                  <th>Stato</th><th>Completamento</th><th>Scadenza</th>
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
                      <div class="pbar-row">
                        <div class="pbar"><div class="pfill" [class]="pctClass(p.completamento)" [style.width.%]="p.completamento"></div></div>
                        <span class="pct-lbl">{{ p.completamento }}%</span>
                      </div>
                    </td>
                    <td [class.text-danger]="isScaduto(p)">{{ fmtDate(p.dataFine) }}{{ isScaduto(p) ? ' ⚠' : '' }}</td>
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
    .pbar-row { display:flex; align-items:center; gap:8px; }
    .pbar { height:6px; background:var(--gray-100); border-radius:3px; overflow:hidden; width:80px; }
    .pfill { height:100%; border-radius:3px; }
    .pfill.hi { background:var(--green); }
    .pfill.md { background:var(--warning); }
    .pfill.lo { background:var(--danger); }
    .pct-lbl { font-size:11px; color:var(--gray-600); min-width:30px; }
    .text-danger { color:var(--danger); }
    .green { color:var(--green); }
  `]
})
export class DashboardComponent implements OnInit {
  private db = inject(GithubDataService);
  private auth = inject(AuthService);

  loading = signal(true);
  projects = signal<Project[]>([]);
  users = signal<User[]>([]);
  config = signal<AppConfig | null>(null);

  filterStato = '';
  filterPrio = '';
  filterBU = '';

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

  async load() {
    this.loading.set(true);
    const [p, u, c] = await Promise.all([this.db.getProjects(), this.db.getUsers(), this.db.getConfig()]);
    this.projects.set(p); this.users.set(u); this.config.set(c);
    this.loading.set(false);
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
