// src/app/components/projects/projects.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { GithubDataService } from '../../core/services/github-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, User, AppConfig } from '../../core/models';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="page">
      <div class="page-hdr">
        <div>
          <div class="page-title">Progetti</div>
          <div class="page-sub">{{ filtered().length }} di {{ projects().length }} progetti</div>
        </div>
        @if (auth.isEditor) {
          <button class="btn btn-p" (click)="openNew()">+ Nuovo Progetto</button>
        }
      </div>

      @if (loading()) {
        <div class="loading-full"><span class="spinner"></span><span>Caricamento...</span></div>
      } @else {

        <div class="fbar">
          <input [(ngModel)]="search" placeholder="🔍 Cerca..." style="min-width:200px"/>
          <select [(ngModel)]="fStato">
            <option value="">Tutti gli stati</option>
            @for (s of config()?.statiProgetto||[]; track s) { <option>{{s}}</option> }
          </select>
          <select [(ngModel)]="fPrio">
            <option value="">Tutte le priorità</option>
            @for (s of config()?.priorita||[]; track s) { <option>{{s}}</option> }
          </select>
          @if (search||fStato||fPrio) {
            <button class="btn btn-g btn-sm" (click)="search='';fStato='';fPrio=''">× Reset</button>
          }
        </div>

        <div class="card">
          <div class="tbl-wrap">
            <table>
              <thead><tr>
                <th>Nome</th><th>Tipo</th><th>Priorità</th><th>Area</th><th>Owner</th>
                <th>Stato</th><th>Avanz.</th><th>Doc</th><th></th>
              </tr></thead>
              <tbody>
                @for (p of filtered(); track p.id) {
                  <tr class="cp" [routerLink]="['/projects', p.id]">
                    <td><strong>{{p.nome}}</strong></td>
                    <td><span class="badge bp">{{p.tipologia}}</span></td>
                    <td><span class="badge" [class]="prioBadge(p.priorita)">{{p.priorita}}</span></td>
                    <td><span class="badge bgr">{{p.area}}</span></td>
                    <td>{{ ownerName(p.owner) }}</td>
                    <td><span class="badge" [class]="statoBadge(p.stato)">{{p.stato}}</span></td>
                    <td>
                      <div style="display:flex;align-items:center;gap:6px">
                        <div class="pbar"><div class="pfill" [class]="pctClass(p.completamento)" [style.width.%]="p.completamento"></div></div>
                        <span style="font-size:11px;color:var(--gray-600)">{{p.completamento}}%</span>
                      </div>
                    </td>
                    <td><span class="badge" [class]="docBadge(p.documentazione)">{{p.documentazione}}</span></td>
                    <td (click)="$event.stopPropagation()">
                      @if (auth.isAdmin) {
                        <button class="icon-btn-sm" title="Elimina" (click)="confirmDelete(p)">🗑</button>
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
      }

      <!-- MODAL NUOVO PROGETTO -->
      @if (showModal()) {
        <div class="mb" (click)="$event.target === $event.currentTarget && closeModal()">
          <div class="modal">
            <div class="mh">
              <span class="mt">{{ editingProject ? 'Modifica Progetto' : 'Nuovo Progetto' }}</span>
              <button class="ico-btn" (click)="closeModal()">✕</button>
            </div>
            <div class="mbody">
              <div class="fg"><label class="fl req">Nome</label>
                <input class="fi" [(ngModel)]="form.nome"/></div>
              <div class="fg"><label class="fl">Descrizione</label>
                <textarea class="fi" rows="3" [(ngModel)]="form.descrizione"></textarea></div>
              <div class="fr2">
                <div class="fg"><label class="fl">Tipologia</label>
                  <select class="fi" [(ngModel)]="form.tipologia">
                    @for (v of config()?.tipologie||[]; track v) { <option>{{v}}</option> }
                  </select></div>
                <div class="fg"><label class="fl">Area</label>
                  <select class="fi" [(ngModel)]="form.area">
                    @for (v of config()?.aree||[]; track v) { <option>{{v}}</option> }
                  </select></div>
              </div>
              <div class="fr2">
                <div class="fg"><label class="fl">Business Unit</label>
                  <select class="fi" [(ngModel)]="form.businessUnit">
                    @for (v of config()?.businessUnits||[]; track v) { <option>{{v}}</option> }
                  </select></div>
                <div class="fg"><label class="fl">Fornitore</label>
                  <select class="fi" [(ngModel)]="form.fornitore">
                    @for (v of config()?.fornitori||[]; track v) { <option>{{v}}</option> }
                  </select></div>
              </div>
              <div class="fr2">
                <div class="fg"><label class="fl">Owner</label>
                  <select class="fi" [(ngModel)]="form.owner">
                    @for (u of users(); track u.id) { <option [value]="u.id">{{u.name}}</option> }
                  </select></div>
                <div class="fg"><label class="fl">Stato</label>
                  <select class="fi" [(ngModel)]="form.stato">
                    @for (v of config()?.statiProgetto||[]; track v) { <option>{{v}}</option> }
                  </select></div>
              </div>
              <div class="fr3">
                <div class="fg"><label class="fl">Data Inizio</label>
                  <input class="fi" type="date" [(ngModel)]="form.dataInizio"/></div>
                <div class="fg"><label class="fl">Data Fine</label>
                  <input class="fi" type="date" [(ngModel)]="form.dataFine"/></div>
                <div class="fg"><label class="fl">Priorità</label>
                  <select class="fi" [(ngModel)]="form.priorita">
                    @for (v of config()?.priorita||[]; track v) { <option>{{v}}</option> }
                  </select></div>
              </div>
              <div class="fr2">
                <div class="fg"><label class="fl">Completamento ({{form.completamento}}%)</label>
                  <input type="range" min="0" max="100" [(ngModel)]="form.completamento" style="width:100%;accent-color:var(--green)"/></div>
                <div class="fg"><label class="fl">Documentazione</label>
                  <select class="fi" [(ngModel)]="form.documentazione">
                    <option>parziale</option><option>totale</option><option>non necessaria</option>
                  </select></div>
              </div>
            </div>
            <div class="mfoot">
              <button class="btn btn-g" (click)="closeModal()">Annulla</button>
              <button class="btn btn-p" (click)="save()" [disabled]="saving()">
                {{ saving() ? 'Salvataggio...' : 'Salva Progetto' }}
              </button>
            </div>
          </div>
        </div>
      }

      <!-- TOAST -->
      @if (toast()) {
        <div class="toast ok">{{ toast() }}</div>
      }
    </div>
  `,
  styles: [`
    .pbar { height:6px; background:var(--gray-100); border-radius:3px; overflow:hidden; width:70px; }
    .pfill { height:100%; border-radius:3px; }
    .pfill.hi{background:var(--green);} .pfill.md{background:var(--warning);} .pfill.lo{background:var(--danger);}
    .icon-btn-sm { background:none; border:none; cursor:pointer; color:var(--danger); font-size:14px; padding:2px 4px; }
    .fr3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
  `]
})
export class ProjectsComponent implements OnInit {
  db = inject(GithubDataService);
  auth = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  showModal = signal(false);
  projects = signal<Project[]>([]);
  users = signal<User[]>([]);
  config = signal<AppConfig | null>(null);
  toast = signal('');
  editingProject: Project | null = null;

  search = ''; fStato = ''; fPrio = '';

  form: Partial<Project> = {};

  filtered() {
    return this.projects().filter(p =>
      (!this.search || p.nome.toLowerCase().includes(this.search.toLowerCase())) &&
      (!this.fStato || p.stato === this.fStato) &&
      (!this.fPrio  || p.priorita === this.fPrio)
    );
  }

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true);
    const [p, u, c] = await Promise.all([this.db.getProjects(), this.db.getUsers(), this.db.getConfig()]);
    this.projects.set(p); this.users.set(u); this.config.set(c);
    this.loading.set(false);
  }

  openNew() {
    this.editingProject = null;
    const cfg = this.config();
    this.form = { nome:'', descrizione:'', tipologia: cfg?.tipologie[0]||'', area: cfg?.aree[0]||'',
      businessUnit: cfg?.businessUnits[0]||'', fornitore: cfg?.fornitori[0]||'',
      owner: this.users()[0]?.id||'', stato: cfg?.statiProgetto[0]||'',
      dataInizio:'', dataFine:'', completamento:0, documentazione:'parziale',
      priorita: cfg?.priorita[1]||'Alta', repositoryUrl:'' };
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
        await this.db.createProject(this.form as Omit<Project,'id'>);
      }
      await this.load();
      this.closeModal();
      this.showToast('Progetto salvato');
    } catch(e) { this.showToast('Errore salvataggio'); }
    this.saving.set(false);
  }

  async confirmDelete(p: Project) {
    if (!confirm(`Eliminare "${p.nome}" e tutti i suoi dati?`)) return;
    await this.db.deleteProject(p.id);
    await this.load();
    this.showToast('Progetto eliminato');
  }

  showToast(msg: string) { this.toast.set(msg); setTimeout(() => this.toast.set(''), 3000); }
  ownerName(id: string) { return this.users().find(u => u.id === id)?.name || '—'; }
  fmtDate(d: string) { return d ? new Date(d).toLocaleDateString('it-IT') : '—'; }
  statoBadge(s: string) { const m: any = {'In corso':'bb','Completato':'bg','Pianificazione':'bgr','In attesa':'bo','Annullato':'br','On Hold':'bo'}; return 'badge '+(m[s]||'bgr'); }
  prioBadge(p: string) { const m: any = {'Critica':'prio-critica','Alta':'prio-alta','Media':'prio-media','Bassa':'prio-bassa'}; return 'badge '+(m[p]||'bgr'); }
  docBadge(d: string) { const m: any = {'totale':'bg','parziale':'bo','non necessaria':'bgr'}; return 'badge '+(m[d]||'bgr'); }
  pctClass(n: number) { return n>=70?'pfill hi':n>=40?'pfill md':'pfill lo'; }
}
