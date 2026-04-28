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
    <!-- ── TOPBAR ACTIONS ── -->
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
      <button class="btn btn-mint btn-sm" (click)="openNuova()">+ Nuova richiesta</button>
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
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" width="40" height="40"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
              <p>Nessuna richiesta trovata</p>
              <button class="btn btn-mint btn-sm" (click)="openNuova()">Crea la prima richiesta</button>
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
                    @if (!isViewer()) { <th>Azioni</th> }
                    @if (isViewer()) { <th>Progetto creato</th> }
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
                      @if (!isViewer()) {
                        <td>{{ userName(r.richiedenteId) }}</td>
                      }
                      <td>
                        <span class="badge" [class]="statoBadge(r.stato)">
                          <span class="badge-dot" [style.background]="statoColor(r.stato)"></span>
                          {{ r.stato }}
                        </span>
                      </td>
                      <td>{{ fmtDate(r.dataCreazione) }}</td>
                      <td class="req-note">{{ r.note || '—' }}</td>
                      @if (!isViewer()) {
                        <td>
                          @if (r.stato === 'In valutazione') {
                            <div class="req-actions">
                              <button class="btn btn-mint btn-xs" (click)="openAccetta(r)">Accetta</button>
                              <button class="btn btn-danger btn-xs" (click)="openRespingi(r)">Respingi</button>
                            </div>
                          } @else if (r.stato === 'Accettata' && r.progettoCreato) {
                            <a [routerLink]="['/projects', r.progettoCreato]" class="btn btn-s btn-xs">Vai al progetto →</a>
                          } @else {
                            <span class="req-chiusa">—</span>
                          }
                        </td>
                      }
                      @if (isViewer()) {
                        <td>
                          @if (r.stato === 'Accettata' && r.progettoCreato) {
                            <a [routerLink]="['/projects', r.progettoCreato]" class="btn btn-s btn-xs">Vai →</a>
                          } @else { <span>—</span> }
                        </td>
                      }
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
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-hdr">
            <div class="modal-title">Nuova richiesta</div>
            <button class="modal-close" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="fg">
              <label class="fl req">Titolo</label>
              <input class="fi" [(ngModel)]="form.titolo" placeholder="Titolo della richiesta" />
            </div>
            <div class="fg">
              <label class="fl req">Descrizione</label>
              <textarea class="fi" rows="3" [(ngModel)]="form.descrizione" placeholder="Descrivi la richiesta…"></textarea>
            </div>
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
          <div class="modal-footer">
            <button class="btn btn-s" (click)="closeModal()">Annulla</button>
            <button class="btn btn-mint" (click)="submitNuova()" [disabled]="saving() || !form.titolo || !form.descrizione">
              @if (saving()) { Invio… } @else { Invia richiesta }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══════════ MODAL ACCETTA ══════════ -->
    @if (modal() === 'accetta') {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-hdr">
            <div class="modal-title">Accetta richiesta</div>
            <button class="modal-close" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="req-confirm-box">
              <div class="req-confirm-label">Stai per accettare:</div>
              <div class="req-confirm-title">{{ selectedReq()?.titolo }}</div>
              <div class="req-confirm-desc">{{ selectedReq()?.descrizione }}</div>
            </div>
            <div class="req-info-box">
              <div class="req-info-row"><span>Progetto creato con nome:</span><strong>{{ selectedReq()?.titolo }}</strong></div>
              <div class="req-info-row"><span>BU:</span><strong>{{ selectedReq()?.buRiferimento || '—' }}</strong></div>
              <div class="req-info-row"><span>Owner:</span><strong>{{ userName(currentUserId()) }}</strong></div>
              <div class="req-info-row"><span>Stato iniziale:</span><strong>Pianificazione</strong></div>
              <div class="req-info-row"><span>Priorità:</span><strong>Media</strong></div>
              <div class="req-info-row"><span>Data avvio:</span><strong>{{ today() }}</strong></div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-s" (click)="closeModal()">Annulla</button>
            <button class="btn btn-mint" (click)="submitAccetta()" [disabled]="saving()">
              @if (saving()) { Elaborazione… } @else { ✓ Conferma accettazione }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══════════ MODAL RESPINGI ══════════ -->
    @if (modal() === 'respingi') {
      <div class="modal-backdrop" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-hdr">
            <div class="modal-title">Respingi richiesta</div>
            <button class="modal-close" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="req-confirm-box req-confirm-box--danger">
              <div class="req-confirm-label">Stai per respingere:</div>
              <div class="req-confirm-title">{{ selectedReq()?.titolo }}</div>
            </div>
            <div class="fg" style="margin-top:16px">
              <label class="fl req">Motivazione (obbligatoria)</label>
              <textarea class="fi" rows="3" [(ngModel)]="noteRespinta" placeholder="Spiega il motivo del rifiuto…"></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-s" (click)="closeModal()">Annulla</button>
            <button class="btn btn-danger" (click)="submitRespingi()" [disabled]="saving() || !noteRespinta.trim()">
              @if (saving()) { Elaborazione… } @else { ✕ Conferma rifiuto }
            </button>
          </div>
        </div>
      </div>
    }

    <!-- ══════════ MODAL POST-ACCETTAZIONE ══════════ -->
    @if (modal() === 'post-accetta') {
      <div class="modal-backdrop">
        <div class="modal modal--wide" (click)="$event.stopPropagation()">
          <div class="modal-hdr">
            <div>
              <div class="modal-eyebrow">Progetto creato con successo ✓</div>
              <div class="modal-title">Vuoi completare il progetto con i dati mancanti?</div>
            </div>
          </div>
          <div class="modal-body">
            <p class="req-post-desc">
              Il progetto <strong>{{ createdProject()?.nome }}</strong> è stato creato in stato <em>Pianificazione</em>.
              Puoi completarlo ora aggiungendo Area, Fornitore e Documentazione — oppure farlo in seguito dal dettaglio progetto.
            </p>
            <div class="fg-grid">
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
                  <option value="totale">Totale</option>
                  <option value="non necessaria">Non necessaria</option>
                </select>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-s" (click)="skipPostForm()">Salta — completa dopo</button>
            <button class="btn btn-mint" (click)="submitPostForm()" [disabled]="saving()">
              @if (saving()) { Salvataggio… } @else { Salva e vai al progetto }
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class RichiesteComponent implements OnInit {
  private db   = inject(GithubDataService);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading  = signal(true);
  saving   = signal(false);
  richieste = signal<Richiesta[]>([]);
  projects  = signal<Project[]>([]);
  users     = signal<User[]>([]);
  config    = signal<AppConfig | null>(null);

  modal        = signal<ModalMode>(null);
  selectedReq  = signal<Richiesta | null>(null);
  createdProject = signal<Project | null>(null);

  filtroStato = '';
  noteRespinta = '';

  form = { titolo: '', descrizione: '', buRiferimento: '', progettoRiferimento: '' };
  postForm = { area: '', fornitore: '', documentazione: 'parziale' };

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

  today = computed(() => new Date().toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'numeric' }));

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
    this.modal.set('accetta');
  }

  openRespingi(r: Richiesta) {
    this.selectedReq.set(r);
    this.noteRespinta = '';
    this.modal.set('respingi');
  }

  closeModal() {
    if (this.modal() === 'post-accetta') return; // non chiudere col backdrop
    this.modal.set(null);
    this.selectedReq.set(null);
  }

  async submitNuova() {
    if (!this.form.titolo || !this.form.descrizione) return;
    this.saving.set(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      const r = await this.db.createRichiesta({
        titolo: this.form.titolo,
        descrizione: this.form.descrizione,
        buRiferimento: this.form.buRiferimento,
        progettoRiferimento: this.form.progettoRiferimento,
        richiedenteId: this.currentUserId(),
        stato: 'In valutazione',
        note: '',
        dataCreazione: today,
        dataEsito: '',
        gestitaId: '',
        progettoCreato: '',
      });
      this.richieste.update(list => [r, ...list]);
      this.modal.set(null);
    } finally { this.saving.set(false); }
  }

  async submitAccetta() {
    const r = this.selectedReq();
    if (!r) return;
    this.saving.set(true);
    try {
      const newProj = await this.db.accettaRichiesta(
        r.id, this.currentUserId(),
        this.projects(), this.users(), this.config()!
      );
      this.createdProject.set(newProj);
      this.postForm = { area: '', fornitore: '', documentazione: 'parziale' };
      await this.load();
      this.modal.set('post-accetta');
    } finally { this.saving.set(false); }
  }

  async submitRespingi() {
    const r = this.selectedReq();
    if (!r || !this.noteRespinta.trim()) return;
    this.saving.set(true);
    try {
      await this.db.respingiRichiesta(r.id, this.currentUserId(), this.noteRespinta.trim());
      await this.load();
      this.modal.set(null);
    } finally { this.saving.set(false); }
  }

  async submitPostForm() {
    const proj = this.createdProject();
    if (!proj) return;
    this.saving.set(true);
    try {
      await this.db.updateProject(proj.id, {
        area: this.postForm.area,
        fornitore: this.postForm.fornitore,
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

  progettoNome(id: string): string {
    if (!id) return '—';
    return this.projects().find(p => p.id === id)?.nome || '—';
  }

  userName(id: string): string {
    if (!id) return '—';
    return this.users().find(u => u.id === id)?.name || id;
  }

  fmtDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit', year:'2-digit' });
  }

  statoBadge(s: string): string {
    if (s === 'Accettata') return 'status-compl';
    if (s === 'Respinta')  return 'status-attesa';
    return 'status-pianif';
  }

  statoColor(s: string): string {
    if (s === 'Accettata') return '#6EC0AA';
    if (s === 'Respinta')  return '#E89B8A';
    return '#B8D8CE';
  }
}
