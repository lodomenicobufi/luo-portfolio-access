// src/app/components/project-detail/project-detail.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GithubDataService } from '../../core/services/github-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, Task, ChecklistItem, Ticket, User, AppConfig } from '../../core/models';

const TASK_SEQUENCE = ['REQUISITI','TEMPI E STIME','SVILUPPO','COLLAUDO LDT','COLLAUDO BU','PRODUZIONE','ADOPTION'];

@Component({
  selector: 'app-project-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page">
      @if (loading()) {
        <div class="loading-full"><span class="spinner"></span><span>Caricamento...</span></div>
      } @else if (project()) {

        <div class="page-hdr" style="display:flex;align-items:flex-start;justify-content:space-between">
          <div>
            <a routerLink="/projects" style="color:var(--gray-400);text-decoration:none;font-size:13px">&#8592; Progetti</a>
            <div class="page-title" style="margin-top:4px">{{ project()!.nome }}</div>
            <div style="display:flex;gap:8px;margin-top:6px">
              <span class="badge" [class]="statoBadge(project()!.stato)">{{ project()!.stato }}</span>
              <span class="badge" [class]="prioBadge(project()!.priorita)">{{ project()!.priorita }}</span>
              <span class="badge bp">{{ project()!.tipologia }}</span>
            </div>
          </div>
          @if (auth.isEditor) {
            <button class="btn btn-p" (click)="editMode.set(!editMode())">
              {{ editMode() ? 'Annulla' : 'Modifica' }}
            </button>
          }
        </div>

        @if (editMode()) {
          <div class="card" style="margin-bottom:16px">
            <div class="sec-div">Modifica Progetto</div>
            <div class="fr2">
              <div class="fg"><label class="fl req">Nome</label><input class="fi" [(ngModel)]="editForm.nome"/></div>
              <div class="fg"><label class="fl">Stato</label>
                <select class="fi" [(ngModel)]="editForm.stato">
                  @for (v of config()?.statiProgetto||[]; track v){ <option>{{v}}</option> }
                </select></div>
            </div>
            <div class="fg"><label class="fl">Descrizione</label>
              <textarea class="fi" rows="2" [(ngModel)]="editForm.descrizione"></textarea></div>
            <div class="fr3">
              <div class="fg"><label class="fl">Data Inizio</label><input class="fi" type="date" [(ngModel)]="editForm.dataInizio"/></div>
              <div class="fg"><label class="fl">Data Fine</label><input class="fi" type="date" [(ngModel)]="editForm.dataFine"/></div>
              <div class="fg"><label class="fl">Priorita</label>
                <select class="fi" [(ngModel)]="editForm.priorita">
                  @for (v of config()?.priorita||[]; track v){ <option>{{v}}</option> }
                </select></div>
            </div>
            <div class="fr2">
              <div class="fg"><label class="fl">Completamento ({{ editForm.completamento }}%)</label>
                <input type="range" min="0" max="100" [(ngModel)]="editForm.completamento" style="width:100%;accent-color:var(--green)"/></div>
              <div class="fg"><label class="fl">Documentazione</label>
                <select class="fi" [(ngModel)]="editForm.documentazione">
                  <option>parziale</option><option>totale</option><option>non necessaria</option>
                </select></div>
            </div>
            <button class="btn btn-p btn-sm" style="margin-top:8px" (click)="saveProject()" [disabled]="saving()">
              {{ saving() ? 'Salvataggio...' : 'Salva' }}
            </button>
          </div>
        }

        @if (!editMode()) {
          <div class="card detail-grid" style="margin-bottom:16px">
            <div><div class="dl">Area</div><div class="dv">{{ project()!.area }}</div></div>
            <div><div class="dl">Business Unit</div><div class="dv">{{ project()!.businessUnit }}</div></div>
            <div><div class="dl">Fornitore</div><div class="dv">{{ project()!.fornitore }}</div></div>
            <div><div class="dl">Owner</div><div class="dv">{{ ownerName(project()!.owner) }}</div></div>
            <div><div class="dl">Data Inizio</div><div class="dv">{{ fmtDate(project()!.dataInizio) }}</div></div>
            <div><div class="dl">Data Fine</div><div class="dv">{{ fmtDate(project()!.dataFine) }}</div></div>
            <div>
              <div class="dl">Completamento</div>
              <div style="display:flex;align-items:center;gap:8px">
                <div class="pbar"><div class="pfill hi" [style.width.%]="project()!.completamento"></div></div>
                <span class="dv">{{ project()!.completamento }}%</span>
              </div>
            </div>
            <div><div class="dl">Documentazione</div>
              <span class="badge" [class]="docBadge(project()!.documentazione)">{{ project()!.documentazione }}</span>
            </div>
          </div>
        }

        <div class="tabs">
          @for (t of getTabs(); track t.id) {
            <button class="tab" [class.active]="activeTab()===t.id" (click)="activeTab.set(t.id)">{{ t.label }}</button>
          }
        </div>

        @if (activeTab() === 'task') {
          <div class="tab-card">
            @for (t of tasks(); track t.id) {
              <div class="task-block" [class.task-locked]="isTaskLocked(t)" [class.task-done]="t.stato==='Completato'">
                <div class="task-block-header" (click)="toggleTaskExpand(t.id)">
                  <div style="display:flex;align-items:center;gap:10px;flex:1">
                    <div class="task-num">{{ getTaskOrdine(t) }}</div>
                    <div>
                      <div style="font-weight:700;font-size:14px">{{ t.nome }}</div>
                      <div style="font-size:11px;color:var(--gray-400);margin-top:2px">
                        {{ fmtDate(t.dataInizio) }}
                        @if (t.dataFine) { - {{ fmtDate(t.dataFine) }} }
                        @if (isTaskLocked(t)) { <span style="color:var(--warning)"> In attesa del task precedente</span> }
                      </div>
                    </div>
                  </div>
                  <div style="display:flex;align-items:center;gap:8px">
                    @if (auth.isEditor && !isTaskLocked(t)) {
                      <select class="fi" style="width:auto;font-size:12px"
                        [(ngModel)]="t.stato" (change)="updateTaskCascade(t)" (click)="$event.stopPropagation()">
                        @for (v of config()?.statiTask||[]; track v){ <option>{{v}}</option> }
                      </select>
                    } @else {
                      <span class="badge" [class]="taskBadge(t.stato)">{{ t.stato }}</span>
                    }
                    <span style="color:var(--gray-400);font-size:12px">{{ expandedTaskId()===t.id ? 'v' : '>' }}</span>
                  </div>
                </div>

                @if (expandedTaskId() === t.id) {
                  <div class="task-block-body">
                    <div class="fr2" style="margin-bottom:16px">
                      <div class="fg"><label class="fl">Data Inizio</label>
                        <input class="fi" type="date" [value]="t.dataInizio" disabled/></div>
                      <div class="fg"><label class="fl">Data Fine</label>
                        @if (auth.isEditor && !isTaskLocked(t)) {
                          <input class="fi" type="date" [(ngModel)]="t.dataFine" (change)="updateTaskCascade(t)"/>
                        } @else {
                          <input class="fi" type="date" [value]="t.dataFine" disabled/>
                        }
                      </div>
                    </div>

                    <div class="sec-div">Sotto-task</div>

                    @if (auth.isEditor && !isTaskLocked(t)) {
                      <div style="background:var(--gray-50);border-radius:8px;padding:12px;margin-bottom:12px">
                        <div style="font-size:11px;font-weight:700;color:var(--gray-400);margin-bottom:8px;text-transform:uppercase;letter-spacing:.5px">Nuovo sotto-task</div>
                        <div class="fr2" style="margin-bottom:8px">
                          <input class="fi" placeholder="Nome *" [(ngModel)]="getNewSubTask(t.id)['nome']"/>
                          <select class="fi" [(ngModel)]="getNewSubTask(t.id)['owner']">
                            <option value="">Owner</option>
                            @for (o of getOwnerOptions(); track o){ <option>{{o}}</option> }
                          </select>
                        </div>
                        <div class="fr3" style="margin-bottom:8px">
                          <input class="fi" type="date" [(ngModel)]="getNewSubTask(t.id)['dataInizio']" title="Data inizio"/>
                          <input class="fi" type="date" [(ngModel)]="getNewSubTask(t.id)['dataFine']" title="Data fine"/>
                          <select class="fi" [(ngModel)]="getNewSubTask(t.id)['stato']">
                            @for (v of config()?.statiTask||[]; track v){ <option>{{v}}</option> }
                          </select>
                        </div>
                        <button class="btn btn-p btn-sm" (click)="addSubTask(t)">+ Aggiungi</button>
                      </div>
                    }

                    @if (getSubTasksForTask(t.id).length === 0) {
                      <div style="font-size:12px;color:var(--gray-400);padding:8px 0">Nessun sotto-task</div>
                    }
                    @for (st of getSubTasksForTask(t.id); track st.id) {
                      <div class="subtask-block" [class.subtask-done]="st.stato==='Completato'">
                        <div class="subtask-header" (click)="toggleSubTaskExpand(st.id)">
                          <div style="flex:1">
                            <div style="font-weight:600;font-size:13px">{{ st.nome }}</div>
                            <div style="font-size:11px;color:var(--gray-400)">
                              {{ fmtDate(st.dataInizio) }} - {{ fmtDate(st.dataFine) }}
                              @if (st.owner) { · <span style="color:var(--teal)">{{ st.owner }}</span> }
                            </div>
                          </div>
                          <div style="display:flex;align-items:center;gap:8px">
                            <span class="badge" [class]="taskBadge(st.stato)">{{ st.stato }}</span>
                            <span style="font-size:11px;color:var(--gray-400)">{{ expandedSubTaskId()===st.id ? 'v' : '>' }}</span>
                          </div>
                        </div>
                        @if (expandedSubTaskId() === st.id) {
                          <div class="subtask-body">
                            <div class="fr3" style="margin-bottom:10px">
                              <div class="fg"><label class="fl">Data Inizio</label>
                                <input class="fi" type="date" [value]="st.dataInizio" disabled/></div>
                              <div class="fg"><label class="fl">Data Fine</label>
                                <input class="fi" type="date" [value]="st.dataFine" disabled/></div>
                              <div class="fg"><label class="fl">Owner</label>
                                <input class="fi" [value]="st.owner||'—'" disabled/></div>
                            </div>
                            @if (auth.isEditor) {
                              <div style="display:flex;gap:8px;align-items:center">
                                <select class="fi" style="flex:1;font-size:12px" [(ngModel)]="st.stato" (change)="updateSubTaskStatus(st)">
                                  @for (v of config()?.statiTask||[]; track v){ <option>{{v}}</option> }
                                </select>
                                <button class="btn btn-g btn-sm" style="color:var(--danger)" (click)="removeSubTask(st)">Elimina</button>
                              </div>
                            }
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              </div>
            }
          </div>
        }


        @if (activeTab() === 'ticket') {
          <div class="card tab-card">
            @if (auth.isEditor) {
              <div style="background:#eef4fd;border:1px solid #c5daf8;border-radius:8px;padding:14px;margin-bottom:16px">
                <div style="font-size:12px;font-weight:700;margin-bottom:10px;color:#185fa5">Apri Ticket</div>
                <div class="fr2">
                  <input class="fi" placeholder="Titolo *" [(ngModel)]="newTicket.titolo"/>
                  <input class="fi" placeholder="Rif. SD" [(ngModel)]="newTicket.riferimentoSD"/>
                </div>
                <textarea class="fi" rows="2" placeholder="Descrizione..." [(ngModel)]="newTicket.descrizione" style="margin-top:8px"></textarea>
                <div class="fr3" style="margin-top:8px">
                  <select class="fi" [(ngModel)]="newTicket.stato">
                    @for (v of config()?.statiTicket||[]; track v){ <option>{{v}}</option> }
                  </select>
                  <select class="fi" [(ngModel)]="newTicket.priorita">
                    @for (v of config()?.priorita||[]; track v){ <option>{{v}}</option> }
                  </select>
                  <input class="fi" type="date" [(ngModel)]="newTicket.dataApertura"/>
                </div>
                <button class="btn btn-p btn-sm" style="margin-top:8px" (click)="addTicket()">+ Apri</button>
              </div>
            }
            @for (tk of tickets(); track tk.id) {
              <div class="ticket-row" [class.chiuso]="['Risolto','Chiuso'].includes(tk.stato)">
                <div style="flex:1">
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
                    <strong>{{ tk.titolo }}</strong>
                    <span class="badge" [class]="ticketBadge(tk.stato)">{{ tk.stato }}</span>
                    <span class="badge" [class]="prioBadge(tk.priorita)" style="font-size:10px">{{ tk.priorita }}</span>
                    @if (tk.riferimentoSD) { <span style="font-size:11px;color:var(--gray-400);font-family:monospace">#{{ tk.riferimentoSD }}</span> }
                  </div>
                  @if (tk.descrizione) { <p style="font-size:12px;color:var(--gray-600);margin-bottom:4px">{{ tk.descrizione }}</p> }
                  @if (tk.note) {
                    <p style="font-size:11px;color:var(--teal);background:var(--green-light);padding:3px 8px;border-radius:4px">
                      <strong>Note:</strong> {{ tk.note }}
                    </p>
                  }
                  @if (auth.isEditor) {
                    <div style="display:flex;gap:6px;margin-top:6px">
                      <select class="fi" style="width:auto;font-size:12px" [(ngModel)]="tk.stato" (change)="updateTicketStatus(tk)">
                        @for (v of config()?.statiTicket||[]; track v){ <option>{{v}}</option> }
                      </select>
                      <button class="icon-btn-sm" style="color:var(--danger)" (click)="deleteTicket(tk)">X</button>
                    </div>
                  }
                </div>
              </div>
            }
            @if (tickets().length === 0) { <div class="empty">Nessun ticket</div> }
          </div>
        }


        @if (activeTab() === 'checklist') {
          <div class="card tab-card" style="padding:0;overflow:hidden">
            <table class="chk-table">
              <thead>
                <tr>
                  <th style="width:46%">Documento</th>
                  <th>Link documento</th>
                </tr>
              </thead>
              <tbody>
                @for (doc of config()?.docFields||[]; track doc) {
                  <tr [class.chk-done]="getChecklistEntry(doc)?.completato">
                    <td>
                      <div style="display:flex;align-items:center;gap:10px">
                        <input type="checkbox"
                          [checked]="getChecklistEntry(doc)?.completato"
                          (change)="toggleChecklist(doc, getChecklistEntry(doc))"
                          [disabled]="!auth.isEditor"
                          style="width:15px;height:15px;accent-color:var(--teal);flex-shrink:0;cursor:pointer"/>
                        <span [class.chk-label-done]="getChecklistEntry(doc)?.completato"
                          style="font-size:13px">{{ doc }}</span>
                      </div>
                    </td>
                    <td>
                      @if (auth.isEditor) {
                        <div style="display:flex;gap:6px;align-items:center">
                          <input class="fi" style="font-size:12px;padding:5px 8px"
                            placeholder="Incolla link..."
                            [(ngModel)]="checklistLinks[doc]"
                            (blur)="saveChecklistLink(doc, getChecklistEntry(doc))"/>
                          @if (getChecklistEntry(doc)?.linkUrl) {
                            <a [href]="getChecklistEntry(doc)!.linkUrl" target="_blank"
                              class="btn btn-g btn-sm">Apri</a>
                          }
                        </div>
                      } @else {
                        @if (getChecklistEntry(doc)?.linkUrl) {
                          <a [href]="getChecklistEntry(doc)!.linkUrl" target="_blank"
                            class="btn btn-g btn-sm">Apri documento</a>
                        } @else {
                          <span style="font-size:12px;color:var(--gray-400)">—</span>
                        }
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
            <div style="padding:12px 16px;font-size:12px;color:var(--gray-400);border-top:1px solid var(--gray-100)">
              {{ completatiCount() }} / {{ config()?.docFields?.length || 0 }} documenti completati
            </div>
          </div>
        }
        @if (toast()) { <div class="toast ok">{{ toast() }}</div> }
      }
    </div>
  `,
  styles: [`
    .detail-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; padding:16px; }
    .dl { font-size:11px; font-weight:700; color:var(--gray-400); text-transform:uppercase; letter-spacing:.4px; margin-bottom:2px; }
    .dv { font-size:13px; font-weight:500; }
    .tabs { display:flex; gap:2px; border-bottom:1px solid var(--gray-100); }
    .tab { font-size:13px; font-weight:500; padding:8px 16px; border:none; background:none; cursor:pointer; color:var(--gray-400); border-bottom:2px solid transparent; margin-bottom:-1px; transition:all .15s; }
    .tab.active { color:var(--teal); border-bottom-color:var(--green); }
    .tab-card { background:white; border:1px solid var(--gray-100); border-top:none; border-radius:0 0 var(--r-lg) var(--r-lg); padding:20px; margin-bottom:16px; }
    .chk-item { display:flex; flex-direction:column; gap:4px; padding:9px 12px; border-radius:6px; background:var(--gray-50); margin-bottom:6px; }
    label.done { text-decoration:line-through; color:var(--gray-400); }
    .ticket-row { display:flex; gap:10px; padding:12px; border-radius:6px; background:var(--gray-50); margin-bottom:8px; border-left:3px solid var(--info); }
    .ticket-row.chiuso { border-left-color:var(--green); opacity:.75; }
    .icon-btn-sm { background:none; border:none; cursor:pointer; font-size:14px; padding:2px 6px; }
    .fr2 { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
    .fr3 { display:grid; grid-template-columns:1fr 1fr 1fr; gap:12px; }
    .pbar { height:6px; background:var(--gray-100); border-radius:3px; overflow:hidden; width:80px; display:inline-block; }
    .pfill.hi { height:100%; border-radius:3px; background:var(--green); }
    .sec-div { font-size:11px; font-weight:700; letter-spacing:1px; text-transform:uppercase; color:var(--gray-400); margin-bottom:14px; padding-bottom:6px; border-bottom:1px solid var(--gray-100); }
    .task-block { background:white; border:1px solid var(--gray-100); border-radius:10px; margin-bottom:10px; overflow:hidden; }
    .task-block.task-locked { opacity:.6; }
    .task-block.task-done { border-left:4px solid var(--green); }
    .task-block-header { display:flex; align-items:center; justify-content:space-between; padding:14px 16px; cursor:pointer; gap:12px; }
    .task-block-header:hover { background:var(--gray-50); }
    .task-block-body { padding:16px; border-top:1px solid var(--gray-100); background:var(--gray-50); }
    .task-num { width:28px; height:28px; border-radius:50%; background:var(--black); color:white; display:flex; align-items:center; justify-content:center; font-size:12px; font-weight:700; flex-shrink:0; }
    .task-done .task-num { background:var(--green); color:var(--black); }
    .task-locked .task-num { background:var(--gray-200); color:var(--gray-400); }
    .chk-table { width:100%; border-collapse:collapse; }
    .chk-table th { font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:.4px; color:var(--gray-400); padding:10px 16px; border-bottom:1px solid var(--gray-100); text-align:left; background:var(--gray-50); }
    .chk-table td { padding:9px 16px; border-bottom:1px solid var(--gray-100); vertical-align:middle; }
    .chk-table tr:last-child td { border-bottom:none; }
    .chk-done td { background:var(--green-light); }
    .chk-label-done { text-decoration:line-through; color:var(--gray-400); }
    .subtask-block { border:0.5px solid var(--gray-100); border-radius:8px; margin-bottom:6px; overflow:hidden; }
    .subtask-block.subtask-done { border-left:3px solid var(--green); }
    .subtask-header { display:flex; align-items:center; justify-content:space-between; padding:9px 12px; cursor:pointer; background:white; gap:10px; }
    .subtask-header:hover { background:var(--gray-50); }
    .subtask-body { padding:12px; border-top:0.5px solid var(--gray-100); background:var(--gray-50); }
  `]
})
export class ProjectDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  db = inject(GithubDataService);
  auth = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  project = signal<Project | null>(null);
  tasks = signal<Task[]>([]);
  subtasks = signal<any[]>([]);
  checklist = signal<ChecklistItem[]>([]);
  tickets = signal<Ticket[]>([]);
  users = signal<User[]>([]);
  config = signal<AppConfig | null>(null);
  activeTab = signal('task');
  editMode = signal(false);
  toast = signal('');
  editForm: Partial<Project> = {};
  checklistLinks: Record<string, string> = {};
  expandedTaskId = signal<string>('');
  expandedSubTaskId = signal<string>('');
  newSubTaskMap: Record<string, Record<string, string>> = {};
  newTicket: Partial<Ticket> = { titolo:'', descrizione:'', stato:'Aperto', priorita:'Media', riferimentoSD:'', dataApertura: new Date().toISOString().split('T')[0], note:'' };

  getTabs() {
    const doneCount = this.tasks().filter(t => t.stato === 'Completato').length;
    const openTickets = this.tickets().filter(t => !['Risolto','Chiuso'].includes(t.stato)).length;
    return [
      { id:'task',      label:'Task (' + doneCount + '/' + this.tasks().length + ')' },
      { id:'ticket',    label:'Ticket SD (' + openTickets + ' aperti)' },
      { id:'checklist', label:'Checklist (' + this.completatiCount() + '/' + (this.config()?.docFields?.length||0) + ')' },
    ];
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(id);
  }

  async loadAll(id: string) {
    this.loading.set(true);
    const [projects, tasks, subtasks, checklist, tickets, users, config] = await Promise.all([
      this.db.getProjects(), this.db.getTasks(id), this.db.getSubTasks(undefined, id),
      this.db.getChecklist(id), this.db.getTickets(id), this.db.getUsers(), this.db.getConfig()
    ]);
    const proj = projects.find(p => p.id === id) || null;
    this.project.set(proj);
    this.tasks.set(tasks);
    this.subtasks.set(subtasks);
    this.checklist.set(checklist);
    this.tickets.set(tickets);
    this.users.set(users);
    this.config.set(config);
    tasks.forEach(t => { this.initNewSubTask(t.id); });
    if (proj) {
      this.editForm = { ...proj };
      checklist.forEach(c => { this.checklistLinks[c.documento] = c.linkUrl || ''; });
    }
    this.loading.set(false);
  }

  ownerName(id: string): string { return this.users().find(u => u.id === id)?.name || '—'; }
  fmtDate(d: string): string { if (!d) return '—'; return new Date(d).toLocaleDateString('it-IT',{day:'2-digit',month:'2-digit',year:'2-digit'}); }
  statoBadge(s: string): string { const m: Record<string,string>={'In corso':'bb','Completato':'bg','Pianificazione':'bgr','In attesa':'bo','Annullato':'br','On Hold':'bo'}; return 'badge '+(m[s]||'bgr'); }
  prioBadge(p: string): string { const m: Record<string,string>={'Critica':'prio-critica','Alta':'prio-alta','Media':'prio-media','Bassa':'prio-bassa'}; return 'badge '+(m[p]||'bgr'); }
  docBadge(d: string): string { const m: Record<string,string>={'totale':'bg','parziale':'bo','non necessaria':'bgr'}; return 'badge '+(m[d]||'bgr'); }
  taskBadge(s: string): string { const m: Record<string,string>={'In corso':'bb','Completato':'bg','Da fare':'bgr','Bloccato':'br'}; return 'badge '+(m[s]||'bgr'); }
  ticketBadge(s: string): string { const m: Record<string,string>={'Aperto':'bb','In lavorazione':'bo','Risolto':'bg','Chiuso':'bgr'}; return 'badge '+(m[s]||'bgr'); }
  showToast(msg: string) { this.toast.set(msg); setTimeout(() => this.toast.set(''), 3000); }

  async saveProject() {
    if (!this.project()) return;
    this.saving.set(true);
    await this.db.updateProject(this.project()!.id, this.editForm as Project);
    this.project.set({ ...this.project()!, ...this.editForm } as Project);
    this.editMode.set(false);
    this.saving.set(false);
    this.showToast('Progetto aggiornato');
  }

  getChecklistEntry(doc: string): ChecklistItem | undefined { return this.checklist().find(c => c.documento === doc); }
  completatiCount(): number { return this.checklist().filter(c => c.completato).length; }
  async toggleChecklist(doc: string, entry: ChecklistItem | undefined) {
    const projectId = this.project()!.id;
    await this.db.upsertChecklistItem({ id: entry?.id, documento: doc, completato: !entry?.completato, linkUrl: this.checklistLinks[doc]||'', projectId });
    this.checklist.set(await this.db.getChecklist(projectId));
  }
  async saveChecklistLink(doc: string, entry: ChecklistItem | undefined) {
    const projectId = this.project()!.id;
    await this.db.upsertChecklistItem({ id: entry?.id, documento: doc, completato: entry?.completato||false, linkUrl: this.checklistLinks[doc]||'', projectId });
    this.showToast('Link salvato');
  }

  getTaskOrdine(t: Task): number { return TASK_SEQUENCE.indexOf(t.nome) + 1; }
  isTaskLocked(t: Task): boolean {
    const idx = TASK_SEQUENCE.indexOf(t.nome);
    if (idx === 0) return false;
    const prev = this.tasks().find(x => x.projectId === t.projectId && x.nome === TASK_SEQUENCE[idx-1]);
    return !prev || prev.stato !== 'Completato' || !prev.dataFine;
  }
  toggleTaskExpand(id: string): void { this.expandedTaskId.set(this.expandedTaskId()===id?'':id); }
  toggleSubTaskExpand(id: string): void { this.expandedSubTaskId.set(this.expandedSubTaskId()===id?'':id); }
  async updateTaskCascade(t: Task): Promise<void> {
    const updated = await this.db.updateTaskWithCascade(t.id, { stato: t.stato, dataFine: t.dataFine }, this.tasks());
    this.tasks.set(updated);
    updated.forEach(task => { this.initNewSubTask(task.id); });
    this.showToast('Task aggiornato');
  }

  initNewSubTask(taskId: string): void {
    if (!this.newSubTaskMap[taskId]) this.newSubTaskMap[taskId] = { nome:'', dataInizio:'', dataFine:'', owner:'', stato:'Da fare' };
  }
  getNewSubTask(taskId: string): Record<string, string> { this.initNewSubTask(taskId); return this.newSubTaskMap[taskId]; }
  getOwnerOptions(): string[] { return (this.config() as any)?.ownerSubtask || []; }
  getSubTasksForTask(taskId: string): any[] { return this.subtasks().filter((s: any) => s.taskId === taskId); }

  async addSubTask(t: Task): Promise<void> {
    const ns = this.newSubTaskMap[t.id];
    if (!ns || !ns['nome']) { this.showToast('Nome obbligatorio'); return; }
    const projectId = this.project()!.id;
    const created = await this.db.createSubTask({ ...ns, taskId: t.id, projectId });
    this.subtasks.update(s => [...s, created]);
    this.newSubTaskMap[t.id] = { nome:'', dataInizio:'', dataFine:'', owner:'', stato: this.config()?.statiTask?.[0]||'Da fare' };
    this.showToast('Sotto-task aggiunto');
  }
  async updateSubTaskStatus(st: any): Promise<void> { await this.db.updateSubTask(st.id, { stato: st.stato }); }
  async removeSubTask(st: any): Promise<void> {
    if (!confirm('Eliminare il sotto-task?')) return;
    await this.db.deleteSubTask(st.id);
    this.subtasks.update(s => s.filter((x: any) => x.id !== st.id));
  }

  async addTicket(): Promise<void> {
    if (!this.newTicket.titolo) return;
    const projectId = this.project()!.id;
    const created = await this.db.createTicket({ ...this.newTicket, projectId } as Omit<Ticket,'id'>);
    this.tickets.update(t => [...t, created as any]);
    this.newTicket = { titolo:'', descrizione:'', stato:'Aperto', priorita:'Media', riferimentoSD:'', dataApertura: new Date().toISOString().split('T')[0], note:'' };
    this.showToast('Ticket aperto');
  }
  async updateTicketStatus(tk: Ticket): Promise<void> { await this.db.updateTicket(tk.id, { stato: tk.stato }); }
  async deleteTicket(tk: Ticket): Promise<void> {
    if (!confirm('Eliminare il ticket?')) return;
    await this.db.deleteTicket(tk.id);
    this.tickets.update(t => t.filter(x => x.id !== tk.id));
  }
}
