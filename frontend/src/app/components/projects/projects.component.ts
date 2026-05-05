// src/app/components/projects/projects.component.ts
import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
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
                  <th class="tbl-num"></th>
                  <th>progetto</th>
                  <th>tipo</th>
                  <th>priorità</th>
                  <th>area</th>
                  <th>owner</th>
                  <th>stato</th>
                  <th>avanzamento</th>
                  <th>doc</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (p of filtered(); track p.id; let i = $index) {
                  <tr class="cp" [routerLink]="['/projects', p.id]">
                    <td class="tbl-num">{{ (i + 1).toString().padStart(2, '0') }}</td>
                    <td>
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
            <div>
              @if (!editingProject) {
                <div style="font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:var(--mint-dd);margin-bottom:2px">
                  Passo {{ modalStep() }} di 2
                </div>
              }
              <span class="mt">{{ editingProject ? 'Modifica progetto' : (modalStep() === 1 ? 'Nuovo progetto' : 'Durata prevista dei task') }}</span>
            </div>
            <button class="ico-btn" (click)="closeModal()">✕</button>
          </div>

          @if (modalStep() === 1) {
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
            @if (editingProject) {
              <button class="btn btn-p" (click)="save()" [disabled]="saving() || !form.nome">
                {{ saving() ? 'Salvataggio…' : 'Salva progetto' }}
              </button>
            } @else {
              <button class="btn btn-p" (click)="modalStep.set(2)" [disabled]="!form.nome">
                Avanti: durata task →
              </button>
            }
          </div>
          }

          @if (modalStep() === 2) {
          <div class="mbody">
            <p style="font-size:13px;color:rgba(46,46,46,.6);margin:0 0 16px;line-height:1.5">
              Imposta il numero di <strong>settimane previste</strong> per ciascun task.
              Queste durate saranno visibili nel Gantt come barre previsionali.
            </p>
            <div class="settimane-grid">
              @for (nome of TASK_SEQUENCE; track nome; let i = $index) {
                <div class="settimane-row">
                  <div class="settimane-num">{{ i + 1 }}</div>
                  <div class="settimane-nome">{{ nome }}</div>
                  <div class="settimane-input-wrap">
                    <button class="settimane-btn" (click)="settimaneMap[nome] = Math.max(1, (settimaneMap[nome]||1) - 1)">−</button>
                    <span class="settimane-val">{{ settimaneMap[nome] || 1 }}</span>
                    <button class="settimane-btn" (click)="settimaneMap[nome] = (settimaneMap[nome]||1) + 1">+</button>
                    <span class="settimane-unit">sett.</span>
                  </div>
                </div>
              }
            </div>
            <div class="settimane-total">
              Totale stimato: <strong>{{ totalSettimane() }} settimane</strong>
              @if (form.dataInizio) {
                &nbsp;·&nbsp; Fine prevista: <strong>{{ calcDataFineStimata() }}</strong>
              }
            </div>
          </div>
          <div class="mfoot">
            <button class="btn btn-g" (click)="modalStep.set(1)">← Indietro</button>
            <button class="btn btn-p" (click)="save()" [disabled]="saving()">
              {{ saving() ? 'Salvataggio…' : 'Crea progetto' }}
            </button>
          </div>
          }

        </div>
      </div>
    }

    <!-- TOAST -->
    @if (toast()) {
      <div class="toast ok">{{ toast() }}</div>
    }
  `,
})
export class ProjectsComponent implements OnInit, OnDestroy {
  private paramSub?: Subscription;
  db    = inject(GithubDataService);
  auth  = inject(AuthService);
  route = inject(ActivatedRoute);

  loading = signal(false);
  saving = signal(false);
  showModal = signal(false);
  modalStep = signal<1 | 2>(1); // step 1 = dati progetto, step 2 = settimane task
  projects = signal<Project[]>([]);
  users = signal<User[]>([]);
  config = signal<AppConfig | null>(null);
  toast = signal('');
  editingProject: Project | null = null;

  search = '';
  fStato = '';
  fPrio = '';

  form: Partial<Project> = {};
  readonly TASK_SEQUENCE = ['REQUISITI','TEMPI E STIME','SVILUPPO','COLLAUDO LDT','COLLAUDO BU','PRODUZIONE','ADOPTION'];
  settimaneMap: Record<string, number> = {};

  private initSettimaneMap(): void {
    const defaults: Record<string, number> = {
      'REQUISITI': 1, 'TEMPI E STIME': 1, 'SVILUPPO': 2,
      'COLLAUDO LDT': 1, 'COLLAUDO BU': 1, 'PRODUZIONE': 2, 'ADOPTION': 1
    };
    this.TASK_SEQUENCE.forEach(n => { this.settimaneMap[n] = defaults[n] ?? 1; });
  }

  Math = Math;

  totalSettimane(): number {
    return this.TASK_SEQUENCE.reduce((s, n) => s + (this.settimaneMap[n] || 1), 0);
  }

  calcDataFineStimata(): string {
    if (!this.form.dataInizio) return '';
    const d = new Date(this.form.dataInizio);
    d.setDate(d.getDate() + this.totalSettimane() * 7);
    return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

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
    this.paramSub = this.route.queryParams.subscribe(params => {
      if (params['stato']) this.fStato = params['stato'];
      if (params['prio'])  this.fPrio  = params['prio'];
    });
    this.load();
  }

  ngOnDestroy() { this.paramSub?.unsubscribe(); }

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
    this.initSettimaneMap();
    this.modalStep.set(1);
    this.showModal.set(true);
  }

  closeModal() { this.showModal.set(false); this.modalStep.set(1); }

  async save() {
    if (!this.form.nome) return;
    this.saving.set(true);
    try {
      if (this.editingProject) {
        await this.db.updateProject(this.editingProject.id, this.form as Project);
      } else {
        const created = await this.db.createProject(this.form as Omit<Project, 'id'>);
        const dataInizio = this.form.dataInizio || new Date().toISOString().split('T')[0];
        await this.db.initProjectTasks(created.id, dataInizio, this.settimaneMap);
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
