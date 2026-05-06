// src/app/components/richieste/richieste.component.ts
import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { GithubDataService } from '../../core/services/github-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Richiesta, Project, User, AppConfig } from '../../core/models';

type ModalMode = 'nuova' | 'accetta' | 'respingi' | 'post-accetta' | null;

@Component({
  selector: 'app-richieste',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
    <div class="filter-bar">
      @if (isViewer()) {
        <span class="filter-label">Le mie richieste</span>
      } @else {
        <button class="filter-pill" [class.active]="filtroStato===''" (click)="filtroStato=''">Tutte</button>
        <button class="filter-pill" [class.active]="filtroStato==='In valutazione'" (click)="filtroStato='In valutazione'">In valutazione</button>
        <button class="filter-pill" [class.active]="filtroStato==='Accettata'" (click)="filtroStato='Accettata'">Accettate</button>
        <button class="filter-pill" [class.active]="filtroStato==='Respinta'" (click)="filtroStato='Respinta'">Respinte</button>
      }
      <div class="filter-spacer"></div>
      <button class="btn btn-p btn-sm" (click)="openNuova()">+ Nuova richiesta</button>
    </div>

    @if (loading()) {
      <div class="loading-full"><span class="spinner"></span><span>Caricamento…</span></div>
    } @else {
      <div class="page-body">
        <div class="card">
          <div class="card-hdr">
            <div>
              <div class="card-eyebrow">Richieste</div>
              <div class="card-title">{{ filtered().length }} risultati</div>
            </div>
          </div>

          @if (filtered().length === 0) {
            <div class="req-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="40" height="40">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="12" y1="11" x2="12" y2="17"/>
                <line x1="9" y1="14" x2="15" y2="14"/>
              </svg>
              <p>Nessuna richiesta trovata</p>
              <button class="btn btn-p btn-sm" (click)="openNuova()">Crea la prima richiesta</button>
            </div>
          } @else {
            <div class="tbl-wrap">
              <table class="tbl">
                <thead>
                  <tr>
                    <th>Titolo</th>
                    <th>BU riferimento</th>
                    <th>Progetto rif.</th>
                    @if (!isViewer()) { <th>Richiedente</th> }
                    <th>Stato</th>
                    <th>Data</th>
                    <th>Note</th>
                    <th>Azioni</th>
                  </tr>
                </thead>
                <tbody>
                  @for (r of filtered(); track r.id) {
                    <tr>
                      <td>
                        <strong>{{ r.titolo }}</strong>
                        <div class="req-desc-preview">{{ r.descrizione | slice:0:60 }}{{ r.descrizione.length > 60 ? '…' : '' }}</div>
                      </td>
                      <td><span class="badge bgr">{{ r.buRiferimento || '—' }}</span></td>
                      <td class="req-progrif">{{ progettoNome(r.progettoRiferimento) }}</td>
                      @if (!isViewer()) { <td>{{ userName(r.richiedenteId) }}</td> }
                      <td>
                        <span class="badge" [class]="statoBadge(r.stato)">
                          <span class="badge-dot" [style.background]="statoColor(r.stato)"></span>
                          {{ r.stato }}
                        </span>
                      </td>
                      <td>{{ fmtDate(r.dataCreazione) }}</td>
                      <td class="req-note">{{ r.note || '—' }}</td>
                      <td>
                        @if (canManage() && r.stato === 'In valutazione') {
                          <div class="req-actions">
                            <button class="btn btn-p btn-xs" (click)="openAccetta(r)">✓ Accetta</button>
                            <button class="btn btn-danger btn-xs" (click)="openRespingi(r)">✕ Respingi</button>
                          </div>
                        } @else if (r.stato === 'Accettata' && r.progettoCreato) {
                          <a [routerLink]="['/projects', r.progettoCreato]" class="btn btn-g btn-xs">Vai al progetto →</a>
                        } @else {
                          <span style="color:rgba(46,46,46,0.3);font-size:13px">—</span>
                        }
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      </div>
    }

    <!-- ══════════ MODAL NUOVA RICHIESTA ══════════ -->
    @if (modal() === 'nuova') {
      <div class="mb" (click)="$event.target === $event.currentTarget && closeModal()">
        <div class="modal">
          <div class="mh">
            <span class="mt">Nuova richiesta</span>
            <button class="ico-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="mbody">
            <div class="fg">
              <label class="fl req">Titolo</label>
              <input class="fi" [(ngModel)]="form.titolo" placeholder="Titolo della richiesta" />
            </div>
            <div class="fg">
              <label class="fl req">Descrizione</label>
              <textarea class="fi" rows="3" [(ngModel)]="form.descrizione" placeholder="Descrivi la richiesta nel dettaglio…"></textarea>
            </div>
            <div class="fr2">
              <div class="fg">
                <label class="fl">BU di riferimento</label>
                <select class="fi" [(ngModel)]="form.buRiferimento">
                  <option value="">— Nessuna —</option>
                  @for (bu of config()?.businessUnits || []; track bu) {
                    <option [value]="bu">{{ bu }}</option>
                  }
                </select>
              </div>
              <div class="fg">
                <label class="fl">Progetto di riferimento</label>
                <select class="fi" [(ngModel)]="form.progettoRiferimento">
                  <option value="">— Nessuno —</option>
                  @for (p of projects(); track p.id) {
                    <option [value]="p.id">{{ p.nome }}</option>
                  }
                </select>
              </div>
            </div>
          </div>
          <div class="mfoot">
            <button class="btn btn-g" (click)="closeModal()">Annulla</button>
            <button class="btn btn-p" (click)="submitNuova()" [disabled]="saving() || !form.titolo || !form.descrizione">
              {{ saving() ? 'Invio…' : 'Invia richiesta' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══════════ MODAL ACCETTA ══════════ -->
    @if (modal() === 'accetta') {
      <div class="mb" (click)="$event.target === $event.currentTarget && closeModal()">
        <div class="modal">
          <div class="mh">
            <div>
              <div style="font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:var(--mint-dd);margin-bottom:2px">
                Passo {{ accettaStep() }} di 2
              </div>
              <span class="mt">{{ accettaStep() === 1 ? 'Accetta richiesta' : 'Durata prevista dei task' }}</span>
            </div>
            <button class="ico-btn" (click)="closeModal()">✕</button>
          </div>

          @if (accettaStep() === 1) {
          <div class="mbody">
            <div class="req-info-section">
              <div class="sec-div">Richiesta</div>
              <div class="fg">
                <label class="fl">Titolo</label>
                <input class="fi" [value]="selectedReq()?.titolo || ''" disabled />
              </div>
              <div class="fg">
                <label class="fl">Descrizione</label>
                <textarea class="fi" rows="2" [value]="selectedReq()?.descrizione || ''" disabled></textarea>
              </div>
              <div class="fr2">
                <div class="fg">
                  <label class="fl">BU</label>
                  <input class="fi" [value]="selectedReq()?.buRiferimento || '—'" disabled />
                </div>
                <div class="fg">
                  <label class="fl">Richiedente</label>
                  <input class="fi" [value]="userName(selectedReq()?.richiedenteId || '')" disabled />
                </div>
              </div>
            </div>

            <div class="req-info-section" style="margin-top:8px">
              <div class="sec-div">Progetto che verrà creato</div>
              <div class="fr2">
                <div class="fg">
                  <label class="fl">Nome progetto</label>
                  <input class="fi" [value]="selectedReq()?.titolo || ''" disabled />
                </div>
                <div class="fg">
                  <label class="fl req">Owner</label>
                  <select class="fi" [(ngModel)]="accettaForm.owner">
                    @for (u of users(); track u.id) {
                      <option [value]="u.id">{{ u.name }}</option>
                    }
                  </select>
                </div>
              </div>
              <div class="fr3">
                <div class="fg">
                  <label class="fl">Stato iniziale</label>
                  <input class="fi" value="Pianificazione" disabled />
                </div>
                <div class="fg">
                  <label class="fl">Priorità</label>
                  <input class="fi" value="Media" disabled />
                </div>
                <div class="fg">
                  <label class="fl">Data avvio</label>
                  <input class="fi" [value]="todayIso()" disabled />
                </div>
              </div>
              <div class="fr2">
                <div class="fg">
                  <label class="fl req">Documentazione</label>
                  <select class="fi" [(ngModel)]="accettaForm.documentazione">
                    <option value="parziale">Parziale</option>
                    <option value="non necessaria">Non necessaria</option>
                  </select>
                </div>
                <div class="fg"></div>
              </div>
            </div>
          </div>
          <div class="mfoot">
            <button class="btn btn-g" (click)="closeModal()">Annulla</button>
            <button class="btn btn-p" (click)="accettaStep.set(2)">
              Avanti: durata task →
            </button>
          </div>
          }

          @if (accettaStep() === 2) {
          <div class="mbody">
            <p style="font-size:13px;color:rgba(46,46,46,.6);margin:0 0 16px;line-height:1.5">
              Imposta il numero di <strong>settimane previste</strong> per ciascun task.
              Queste durate saranno visibili nel Gantt come barre previsionali.
            </p>
            <div class="settimane-grid">
              @for (nome of TASK_SEQUENCE_REQ; track nome; let i = $index) {
                <div class="settimane-row">
                  <div class="settimane-num">{{ i + 1 }}</div>
                  <div class="settimane-nome">{{ nome }}</div>
                  <div class="settimane-input-wrap">
                    <button class="settimane-btn" (click)="decSettimaneReq(nome)">−</button>
                    <span class="settimane-val">{{ settimaneMapReq[nome] || 1 }}</span>
                    <button class="settimane-btn" (click)="incSettimaneReq(nome)">+</button>
                    <span class="settimane-unit">sett.</span>
                  </div>
                </div>
              }
            </div>
            <div class="settimane-total">
              Totale stimato: <strong>{{ totalSettimaneReq() }} settimane</strong>
            </div>
          </div>
          <div class="mfoot">
            <button class="btn btn-g" (click)="accettaStep.set(1)">← Indietro</button>
            <button class="btn btn-p" (click)="submitAccetta()" [disabled]="saving()">
              {{ saving() ? 'Elaborazione…' : '✓ Conferma accettazione' }}
            </button>
          </div>
          }

        </div>
      </div>
    }

    <!-- ══════════ MODAL RESPINGI ══════════ -->
    @if (modal() === 'respingi') {
      <div class="mb" (click)="$event.target === $event.currentTarget && closeModal()">
        <div class="modal">
          <div class="mh">
            <span class="mt">Respingi richiesta</span>
            <button class="ico-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="mbody">
            <div class="req-info-section">
              <div class="sec-div">Richiesta da respingere</div>
              <div class="fg">
                <label class="fl">Titolo</label>
                <input class="fi" [value]="selectedReq()?.titolo || ''" disabled />
              </div>
              <div class="fr2">
                <div class="fg">
                  <label class="fl">BU</label>
                  <input class="fi" [value]="selectedReq()?.buRiferimento || '—'" disabled />
                </div>
                <div class="fg">
                  <label class="fl">Richiedente</label>
                  <input class="fi" [value]="userName(selectedReq()?.richiedenteId || '')" disabled />
                </div>
              </div>
            </div>
            <div style="margin-top:16px">
              <div class="fg">
                <label class="fl req">Motivazione del rifiuto</label>
                <textarea class="fi" rows="4" [(ngModel)]="noteRespinta"
                  placeholder="Spiega il motivo del rifiuto. Questo testo sarà visibile al richiedente…"></textarea>
              </div>
            </div>
          </div>
          <div class="mfoot">
            <button class="btn btn-g" (click)="closeModal()">Annulla</button>
            <button class="btn btn-danger" (click)="submitRespingi()" [disabled]="saving() || !noteRespinta.trim()">
              {{ saving() ? 'Elaborazione…' : '✕ Conferma rifiuto' }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══════════ MODAL POST-ACCETTAZIONE ══════════ -->
    @if (modal() === 'post-accetta') {
      <div class="mb">
        <div class="modal">
          <div class="mh">
            <div>
              <div style="font-size:11px;font-weight:600;letter-spacing:.5px;text-transform:uppercase;color:var(--mint-dd);margin-bottom:2px">Progetto creato con successo ✓</div>
              <span class="mt">Vuoi completare i dati mancanti?</span>
            </div>
          </div>
          <div class="mbody">
            <p style="font-size:13.5px;color:rgba(46,46,46,.7);margin:0 0 20px;line-height:1.5">
              Il progetto <strong>{{ createdProject()?.nome }}</strong> è in stato <em>Pianificazione</em> con tutti i task creati.
              Puoi aggiungere Area, Fornitore e Documentazione ora, oppure farlo dal dettaglio progetto.
            </p>
            <div class="fr3">
              <div class="fg">
                <label class="fl">Area</label>
                <select class="fi" [(ngModel)]="postForm.area">
                  <option value="">— Nessuna —</option>
                  @for (a of config()?.aree || []; track a) { <option [value]="a">{{ a }}</option> }
                </select>
              </div>
              <div class="fg">
                <label class="fl">Fornitore</label>
                <select class="fi" [(ngModel)]="postForm.fornitore">
                  <option value="">— Nessuno —</option>
                  @for (f of config()?.fornitori || []; track f) { <option [value]="f">{{ f }}</option> }
                </select>
              </div>
              <div class="fg">
                <label class="fl">Documentazione</label>
                <select class="fi" [(ngModel)]="postForm.documentazione">
                  <option value="parziale">Parziale</option>
                  <option value="non necessaria">Non necessaria</option>
                </select>
              </div>
            </div>
          </div>
          <div class="mfoot">
            <button class="btn btn-g" (click)="skipPostForm()">Salta — completa dopo</button>
            <button class="btn btn-p" (click)="submitPostForm()" [disabled]="saving()">
              {{ saving() ? 'Salvataggio…' : 'Salva e vai al progetto' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class RichiesteComponent implements OnInit {
  private db     = inject(GithubDataService);
  private auth   = inject(AuthService);
  private router = inject(Router);

  loading  = signal(true);
  saving   = signal(false);
  richieste = signal<Richiesta[]>([]);
  projects  = signal<Project[]>([]);
  users     = signal<User[]>([]);
  config    = signal<AppConfig | null>(null);

  modal          = signal<ModalMode>(null);
  selectedReq    = signal<Richiesta | null>(null);
  createdProject = signal<Project | null>(null);

  filtroStato  = '';
  noteRespinta = '';
  form = { titolo: '', descrizione: '', buRiferimento: '', progettoRiferimento: '' };
  accettaForm = { owner: '', documentazione: 'parziale' as 'parziale' | 'non necessaria' };
  postForm = { area: '', fornitore: '', documentazione: 'parziale' };
  accettaStep = signal<1 | 2>(1);

  Math = Math;
  readonly TASK_SEQUENCE_REQ = ['REQUISITI','TEMPI E STIME','SVILUPPO','COLLAUDO LDT','COLLAUDO BU','PRODUZIONE','ADOPTION'];
  settimaneMapReq: Record<string, number> = {};

  private initSettimaneMapReq(): void {
    const defaults: Record<string, number> = {
      'REQUISITI': 1, 'TEMPI E STIME': 1, 'SVILUPPO': 2,
      'COLLAUDO LDT': 1, 'COLLAUDO BU': 1, 'PRODUZIONE': 2, 'ADOPTION': 1
    };
    this.TASK_SEQUENCE_REQ.forEach(n => { this.settimaneMapReq[n] = defaults[n] ?? 1; });
  }

  decSettimaneReq(nome: string): void { this.settimaneMapReq[nome] = Math.max(1, (this.settimaneMapReq[nome] || 1) - 1); }
  incSettimaneReq(nome: string): void { this.settimaneMapReq[nome] = (this.settimaneMapReq[nome] || 1) + 1; }

  totalSettimaneReq(): number {
    return this.TASK_SEQUENCE_REQ.reduce((s, n) => s + (this.settimaneMapReq[n] || 1), 0);
  }

  readonly taskSequence = ['REQUISITI','TEMPI E STIME','SVILUPPO','COLLAUDO LDT','COLLAUDO BU','PRODUZIONE','ADOPTION'];

  isViewer  = computed(() => this.auth.currentUser()?.role === 'viewer');
  canManage = computed(() => ['admin','editor'].includes(this.auth.currentUser()?.role || ''));
  currentUserId = computed(() => this.auth.currentUser()?.id || '');

  filtered = computed(() => {
    const uid = this.currentUserId();
    let list = this.isViewer()
      ? this.richieste().filter(r => r.richiedenteId === uid)
      : this.richieste();
    if (this.filtroStato) list = list.filter(r => r.stato === this.filtroStato);
    return list.sort((a, b) => b.dataCreazione.localeCompare(a.dataCreazione));
  });

  todayIso = () => new Date().toISOString().split('T')[0];

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true);
    const [r, p, u, c] = await Promise.all([
      this.db.getRichieste(), this.db.getProjects(),
      this.db.getUsers(), this.db.getConfig()
    ]);
    this.richieste.set(r); this.projects.set(p); this.users.set(u); this.config.set(c);
    this.loading.set(false);
  }

  openNuova() {
    this.form = { titolo: '', descrizione: '', buRiferimento: '', progettoRiferimento: '' };
    this.modal.set('nuova');
  }
  openAccetta(r: Richiesta) {
    this.selectedReq.set(r);
    this.accettaForm = { owner: this.currentUserId(), documentazione: 'parziale' };
    this.initSettimaneMapReq();
    this.accettaStep.set(1);
    this.modal.set('accetta');
  }
  openRespingi(r: Richiesta) { this.selectedReq.set(r); this.noteRespinta = ''; this.modal.set('respingi'); }
  closeModal() {
    if (this.modal() === 'post-accetta') return;
    this.modal.set(null); this.selectedReq.set(null);
  }

  async submitNuova() {
    if (!this.form.titolo || !this.form.descrizione) return;
    this.saving.set(true);
    try {
      const r = await this.db.createRichiesta({
        titolo: this.form.titolo, descrizione: this.form.descrizione,
        buRiferimento: this.form.buRiferimento,
        progettoRiferimento: this.form.progettoRiferimento,
        richiedenteId: this.currentUserId(),
        stato: 'In valutazione', note: '',
        dataCreazione: this.todayIso(), dataEsito: '', gestitaId: '', progettoCreato: '',
      });
      await this.db.logAction({
        userId: this.currentUserId(), action: 'create', entityType: 'richiesta',
        entityId: r.id, entityName: r.titolo,
        note: r.descrizione.slice(0, 100),
      });
      this.richieste.update(list => [r, ...list]);
      this.modal.set(null);
    } finally { this.saving.set(false); }
  }

  async submitAccetta() {
    const r = this.selectedReq(); if (!r) return;
    this.saving.set(true);
    try {
      const newProj = await this.db.accettaRichiesta(
        r.id, this.currentUserId(), this.projects(), this.users(), this.config()!,
        this.accettaForm.owner, this.accettaForm.documentazione, this.settimaneMapReq
      );
      await this.db.logAction({
        userId: this.currentUserId(), action: 'accept', entityType: 'richiesta',
        entityId: r.id, entityName: r.titolo,
        projectId: newProj.id, projectName: newProj.nome,
        newValue: 'Accettata',
      });
      this.createdProject.set(newProj);
      this.postForm = { area: '', fornitore: '', documentazione: this.accettaForm.documentazione };
      await this.load();
      this.modal.set('post-accetta');
    } finally { this.saving.set(false); }
  }

  async submitRespingi() {
    const r = this.selectedReq(); if (!r || !this.noteRespinta.trim()) return;
    this.saving.set(true);
    try {
      await this.db.respingiRichiesta(r.id, this.currentUserId(), this.noteRespinta.trim());
      await this.db.logAction({
        userId: this.currentUserId(), action: 'reject', entityType: 'richiesta',
        entityId: r.id, entityName: r.titolo,
        newValue: 'Respinta', note: this.noteRespinta.trim(),
      });
      await this.load(); this.modal.set(null);
    } finally { this.saving.set(false); }
  }

  async submitPostForm() {
    const proj = this.createdProject(); if (!proj) return;
    this.saving.set(true);
    try {
      await this.db.updateProject(proj.id, {
        area: this.postForm.area, fornitore: this.postForm.fornitore,
        documentazione: this.postForm.documentazione as any,
      });
      this.modal.set(null);
      this.router.navigate(['/projects', proj.id]);
    } finally { this.saving.set(false); }
  }

  skipPostForm() {
    const proj = this.createdProject();
    this.modal.set(null);
    if (proj) this.router.navigate(['/projects', proj.id]);
  }

  progettoNome(id: string) { return id ? (this.projects().find(p => p.id === id)?.nome || '—') : '—'; }
  userName(id: string)     { return id ? (this.users().find(u => u.id === id)?.name || id) : '—'; }
  fmtDate(d: string)       { return d ? new Date(d).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'2-digit' }) : '—'; }
  statoBadge(s: string)    { return s === 'Accettata' ? 'status-compl' : s === 'Respinta' ? 'status-attesa' : 'status-pianif'; }
  statoColor(s: string)    { return s === 'Accettata' ? '#6EC0AA' : s === 'Respinta' ? '#E89B8A' : '#B8D8CE'; }
}
