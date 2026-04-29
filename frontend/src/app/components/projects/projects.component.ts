// src/app/components/projects/projects.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GithubDataService } from '../../core/services/github-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, User, AppConfig } from '../../core/models';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <!-- ─── FILTER BAR ─────────────────────────────── -->
    <div class="filter-bar">
      <input class="select-chip" style="width:240px;background-image:none;padding-right:12px"
        [(ngModel)]="search" placeholder="🔍 Cerca progetto…"/>

      <div class="filter-divider"></div>

      <span class="filter-label">Stato:</span>
      <button class="filter-pill" [class.active]="fStato===''" (click)="fStato=''">Tutti</button>
      @for (s of (config()?.statiProgetto || []); track s) {
        <button class="filter-pill" [class.active]="fStato===s" (click)="fStato=s">{{ s }}</button>
      }

      <div class="filter-divider"></div>

      <select class="select-chip" [(ngModel)]="fPrio">
        <option value="">Priorità: tutte</option>
        @for (p of (config()?.priorita || []); track p) { <option [value]="p">{{ p }}</option> }
      </select>

      <div class="filter-spacer"></div>

      <span class="filter-count">{{ filtered().length }} di {{ projects().length }}</span>

      @if (auth.isEditor) {
        <button class="btn btn-mint btn-sm" (click)="openNew()">+ Nuovo progetto</button>
      }
    </div>

    <!-- ─── PAGE BODY ──────────────────────────────── -->
    @if (loading()) {
      <div class="loading-full"><span class="spinner"></span><span>Caricamento…</span></div>
    } @else {
      <div class="page-body">
        <div class="card" style="padding:0">
          <div class="tbl-wrap">
            <table class="tbl">
              <thead>
                <tr>
                  <th style="padding-left:18px">Nome</th>
                  <th>Tipo</th>
                  <th>Priorità</th>
                  <th>Area</th>
                  <th>Owner</th>
                  <th>Stato</th>
                  <th>Avanzamento</th>
                  <th>Doc</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (p of filtered(); track p.id) {
                  <tr class="cp" [routerLink]="['/projects', p.id]">
                    <td style="padding-left:18px">
                      <strong>{{ p.nome }}</strong>
                      @if (p.descrizione) {
                        <div class="req-desc-preview">{{ p.descrizione | slice:0:70 }}{{ p.descrizione.length > 70 ? '…' : '' }}</div>
                      }
                    </td>
                    <td><span class="badge bp">{{ p.tipologia }}</span></td>
                    <td><span class="prio-tag" [class]="'prio-' + p.priorita.toLowerCase()">{{ p.priorita }}</span></td>
                    <td><span class="badge bgr">{{ p.area }}</span></td>
                    <td>{{ ownerName(p.owner) }}</td>
                    <td>
                      <span class="badge" [class]="statoBadge(p.stato)">
                        <span class="badge-dot" [style.background]="statoColor(p.stato)"></span>
                        {{ p.stato }}
                      </span>
                    </td>
                    <td>
                      <div class="pbar-row">
                        <div class="pbar"><div class="pfill" [class]="pctClass(p.completamento)" [style.width.%]="p.completamento"></div></div>
                        <span class="pct-lbl">{{ p.completamento }}%</span>
                      </div>
                    </td>
                    <td><span class="badge" [class]="docBadge(p.documentazione)">{{ p.documentazione }}</span></td>
                    <td (click)="$event.stopPropagation()">
                      @if (auth.isAdmin) {
                        <button class="ico-btn" title="Elimina" (click)="confirmDelete(p)">🗑</button>
                      }
                    </td>
                  </tr>
                }
                @if (filtered().length === 0) {
                  <tr><td colspan="9" class="empty">Nessun progetto trovato</td></tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    }

    <!-- ─── MODAL NUOVO PROGETTO ───────────────────── -->
    @if (showModal()) {
      <div class="mb" (click)="$event.target === $event.currentTarget && closeModal()">
        <div class="modal">
          <div class="mh">
            <span class="mt">{{ editingProject ? 'Modifica progetto' : 'Nuovo progetto' }}</span>
            <button class="ico-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="mbody">
            <div class="fg">
              <label class="fl req">Nome</label>
              <input class="fi" [(ngModel)]="form.nome"/>
            </div>
            <div class="fg">
              <label class="fl">Descrizione</label>
              <textarea class="fi" rows="3" [(ngModel)]="form.descrizione"></textarea>
            </div>
            <div class="fr2">
              <div class="fg">
                <label class="fl">Tipologia</label>
                <select class="fi" [(ngModel)]="form.tipologia">
                  @for (v of (config()?.tipologie || []); track v) { <option>{{v}}</option> }
                </select>
              </div>
              <div class="fg">
                <label class="fl">Area</label>
                <select class="fi" [(ngModel)]="form.area">
                  @for (v of (config()?.aree || []); track v) { <option>{{v}}</option> }
                </select>
              </div>
            </div>
            <div class="fr2">
              <div class="fg">
                <label class="fl">Business Unit</label>
                <select class="fi" [(ngModel)]="form.businessUnit">
                  @for (v of (config()?.businessUnits || []); track v) { <option>{{v}}</option> }
                </select>
              </div>
              <div class="fg">
                <label class="fl">Fornitore</label>
                <select class="fi" [(ngModel)]="form.fornitore">
                  @for (v of (config()?.fornitori || []); track v) { <option>{{v}}</option> }
                </select>
              </div>
            </div>
            <div class="fr2">
              <div class="fg">
                <label class="fl">Owner</label>
                <select class="fi" [(ngModel)]="form.owner">
                  @for (u of users(); track u.id) { <option [value]="u.id">{{u.name}}</option> }
                </select>
              </div>
              <div class="fg">
                <label class="fl">Stato</label>
                <select class="fi" [(ngModel)]="form.stato">
                  @for (v of (config()?.statiProgetto || []); track v) { <option>{{v}}</option> }
                </select>
              </div>
            </div>
            <div class="fr3">
              <div class="fg">
                <label class="fl">Data Inizio</label>
                <input class="fi" type="date" [(ngModel)]="form.dataInizio"/>
              </div>
              <div class="fg">
                <label class="fl">Data Fine</label>
                <input class="fi" type="date" [(ngModel)]="form.dataFine"/>
              </div>
              <div class="fg">
                <label class="fl">Priorità</label>
                <select class="fi" [(ngModel)]="form.priorita">
                  @for (v of (config()?.priorita || []); track v) { <option>{{v}}</option> }
                </select>
              </div>
            </div>
            <div class="fg">
              <label class="fl">Documentazione</label>
              <select class="fi" [(ngModel)]="form.documentazione">
                <option>parziale</option>
                <option>totale</option>
                <option>non necessaria</option>
              </select>
            </div>
          </div>
          <div class="mfoot">
            <button class="btn btn-g" (click)="closeModal()">Annulla</button>
            <button class="btn btn-p" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Salvataggio…' : 'Salva progetto' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- TOAST -->
    @if (toast()) {
      <div class="toast ok">{{ toast() }}</div>
    }
  `,
})
export class ProjectsComponent implements OnInit {
  db    = inject(GithubDataService);
  auth  = inject(AuthService);
  route = inject(ActivatedRoute);

  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  projects = signal<Project[]>([]);
  users = signal<User[]>([]);
  config = signal<AppConfig | null>(null);
  toast = signal('');
  editingProject: Project | null = null;

  search = '';
  fStato = '';
  fPrio = '';

  form: Partial<Project> = {};

  statoColors: Record<string, string> = {
    'In corso':       '#6EC0AA',
    'Completato':     '#2E2E2E',
    'Pianificazione': '#B8D8CE',
    'In attesa':      '#E89B8A',
    'On Hold':        '#E89B8A',
    'Annullato':      '#8aaca4',
  };

  filtered() {
    return this.projects().filter(p =>
      (!this.search || p.nome.toLowerCase().includes(this.search.toLowerCase())) &&
      (!this.fStato || p.stato === this.fStato) &&
      (!this.fPrio  || p.priorita === this.fPrio)
    );
  }

  ngOnInit() {
    const params = this.route.snapshot.queryParams;
    if (params['stato']) this.fStato = params['stato'];
    if (params['prio'])  this.fPrio  = params['prio'];
    this.load();
  }

  async load() {
    this.loading.set(true);
    const [p, u, c] = await Promise.all([
      this.db.getProjects(), this.db.getUsers(), this.db.getConfig()
    ]);
    this.projects.set(p);
    this.users.set(u);
    this.config.set(c);
    this.loading.set(false);
  }

  openNew() {
    this.editingProject = null;
    const cfg = this.config();
    this.form = {
      nome: '', descrizione: '',
      tipologia: cfg?.tipologie[0] || '',
      area: cfg?.aree[0] || '',
      businessUnit: cfg?.businessUnits[0] || '',
      fornitore: cfg?.fornitori[0] || '',
      owner: this.users()[0]?.id || '',
      stato: cfg?.statiProgetto[0] || '',
      dataInizio: '', dataFine: '',
      documentazione: 'parziale',
      priorita: cfg?.priorita[1] || 'Alta',
      repositoryUrl: ''
    };
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); }

  async save() {
    if (!this.form.nome) return;
    this.saving.set(true);
    try {
      if (this.editingProject) {
        await this.db.updateProject(this.editingProject.id, this.form as Project);
      } else {
        const created = await this.db.createProject(this.form as Omit<Project, 'id'>);
        const dataInizio = this.form.dataInizio || new Date().toISOString().split('T')[0];
        await this.db.initProjectTasks(created.id, dataInizio);
      }
      await this.load();
      this.closeModal();
      this.showToast('Progetto salvato');
    } catch (e) {
      this.showToast('Errore salvataggio');
    }
    this.saving.set(false);
  }

  async confirmDelete(p: Project) {
    if (!confirm(`Eliminare "${p.nome}" e tutti i suoi dati?`)) return;
    await this.db.deleteProject(p.id);
    await this.load();
    this.showToast('Progetto eliminato');
  }

  showToast(msg: string) {
    this.toast.set(msg);
    setTimeout(() => this.toast.set(''), 3000);
  }

  ownerName(id: string) { return this.users().find(u => u.id === id)?.name || '—'; }

  statoBadge(s: string): string {
    const m: Record<string, string> = {
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

  docBadge(d: string): string {
    const m: Record<string, string> = {
      'totale':        'status-corso',
      'parziale':      'status-attesa',
      'non necessaria': 'bgr',
    };
    return m[d] || 'bgr';
  }

  pctClass(n: number) { return n >= 70 ? 'hi' : n >= 40 ? 'md' : 'lo'; }
}
