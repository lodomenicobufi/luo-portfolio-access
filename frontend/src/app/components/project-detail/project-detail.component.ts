// src/app/components/project-detail/project-detail.component.ts
import { Component, inject, OnInit, OnDestroy, AfterViewInit, signal, computed, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GithubDataService } from '../../core/services/github-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, Task, ChecklistItem, Ticket, User, AppConfig } from '../../core/models';

const ICON_CALENDAR = 'data:image/png;base64,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';
const ICON_VERIFIED = 'data:image/png;base64,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';
const ICON_FOLDER = 'data:image/png;base64,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';

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

        <!-- HEADER PROGETTO -->
        <div class="proj-hdr-card">
          <div class="proj-hdr-top">
            <a routerLink="/projects" class="btn btn-s btn-sm proj-back-btn" style="text-decoration:none">&#8592; Progetti</a>
            @if (auth.isEditor) {
              <button class="btn btn-s btn-sm" (click)="editMode.set(!editMode())">
                {{ editMode() ? 'Annulla' : 'Modifica' }}
              </button>
            }
          </div>

          <div class="proj-hdr-body">
            <div class="proj-hdr-left">
              <!-- Icona progetto -->
              <div class="proj-icon-wrap">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" width="28" height="28">
                  <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                </svg>
              </div>

              <div class="proj-hdr-info">
                <div class="proj-hdr-nome">{{ project()!.nome }}</div>
                <div class="proj-hdr-badges">
                  <span class="badge" [class]="statoBadge(project()!.stato)">
                    <span class="badge-dot" [style.background]="statoColor(project()!.stato)"></span>
                    {{ project()!.stato }}
                  </span>
                </div>
              </div>
            </div>

            <!-- KPI lato destro -->
            <div class="proj-hdr-kpis">
              <div class="proj-hdr-kpi">
                <div class="proj-hdr-kpi-val accent">{{ project()!.completamento }}%</div>
                <div class="proj-hdr-kpi-lbl">Completamento</div>
                <div class="pbar proj-hdr-pbar" style="margin-top:6px">
                  <div class="pfill" [class]="pctClass(project()!.completamento)" [style.width.%]="project()!.completamento"></div>
                </div>
              </div>
              <div class="proj-hdr-kpi-div"></div>
              <div class="proj-hdr-kpi">
                <div class="proj-hdr-kpi-val">{{ doneTaskCount() }}/{{ tasks().length }}</div>
                <div class="proj-hdr-kpi-lbl">Task completati</div>
              </div>
              <div class="proj-hdr-kpi-div"></div>
              <div class="proj-hdr-kpi">
                <div class="proj-hdr-kpi-val" [class.text-danger]="isScadutoProj()">{{ fmtDate(project()!.dataFine) }}</div>
                <div class="proj-hdr-kpi-lbl">Scadenza</div>
              </div>
              <div class="proj-hdr-kpi-div"></div>
              <div class="proj-hdr-kpi">
                <div class="proj-hdr-kpi-val">{{ ownerInitials() }}</div>
                <div class="proj-hdr-kpi-lbl">{{ ownerName(project()!.owner) }}</div>
              </div>
            </div>
          </div>
        </div>


        <!-- RIGA 1: anagrafica (metà) + pannello BU (metà) -->
        <!-- RIGA 1: Progetti stessa BU (full width) -->
        <div class="card" style="margin-bottom:16px">
          <div class="card-hdr">
            <div>
              <div class="card-eyebrow">Progetti stessa BU · {{ project()!.businessUnit }}</div>
              <div class="card-title">Progetti per priorità</div>
            </div>
          </div>
          @if (sameBuProjects().length === 0) {
            <div class="empty" style="padding:20px;font-size:13px">Nessun altro progetto nella stessa BU</div>
          } @else {
            <div class="bu-proj-grid">
              @for (p of sameBuProjects(); track p.id) {
                <a [routerLink]="['/projects', p.id]" class="bu-proj-row">
                  <div class="bu-proj-nome">{{ p.nome }}</div>
                  <div class="bu-proj-meta">
                    <span class="prio-tag" [class]="'prio-' + p.priorita.toLowerCase()" style="font-size:10px">{{ p.priorita }}</span>
                    <span class="bu-proj-pct">{{ p.completamento }}%</span>
                  </div>
                  <div class="pbar" style="margin-top:4px">
                    <div class="pfill" [class]="pctClass(p.completamento)" [style.width.%]="p.completamento"></div>
                  </div>
                </a>
              }
            </div>
          }
        </div>

        <!-- RIGA 2: Anagrafica progetto (full width) -->
        @if (editMode()) {
          <div class="card" style="margin-bottom:16px">
            <div class="sec-div">Modifica Progetto</div>

            <!-- Campi base: tutti gli editor -->
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
              <div class="fg"><label class="fl">Priorità</label>
                <select class="fi" [(ngModel)]="editForm.priorita">
                  @for (v of config()?.priorita||[]; track v){ <option>{{v}}</option> }
                </select></div>
            </div>
            <div class="fg">
              <label class="fl">Documentazione</label>
              @if (project()?.documentazione === 'completata' && !auth.isEditor) {
                <span class="badge badge-doc-completata">✓ Completata (automatica)</span>
              } @else {
                <select class="fi" [(ngModel)]="editForm.documentazione">
                  <option value="parziale">Parziale</option>
                  <option value="non necessaria">Non necessaria</option>
                </select>
                @if (project()?.documentazione === 'completata') {
                  <div style="font-size:11px;color:var(--warning);margin-top:4px">
                    ⚠ Stai modificando uno stato impostato automaticamente dalla checklist
                  </div>
                }
              }
            </div>

            <!-- Campi riservati admin -->
            @if (auth.isAdmin) {
              <div class="admin-section">
                <div class="admin-section-label">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="13" height="13"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Solo Admin
                </div>
                <div class="fr2">
                  <div class="fg"><label class="fl">Tipologia</label>
                    <select class="fi" [(ngModel)]="editForm.tipologia">
                      @for (v of config()?.tipologie||[]; track v){ <option>{{v}}</option> }
                    </select></div>
                  <div class="fg"><label class="fl">Owner</label>
                    <select class="fi" [(ngModel)]="editForm.owner">
                      @for (u of users(); track u.id){ <option [value]="u.id">{{ u.name }}</option> }
                    </select></div>
                </div>
                <div class="fr2">
                  <div class="fg"><label class="fl">Area</label>
                    <select class="fi" [(ngModel)]="editForm.area">
                      @for (v of config()?.aree||[]; track v){ <option>{{v}}</option> }
                    </select></div>
                  <div class="fg"><label class="fl">Fornitore</label>
                    <select class="fi" [(ngModel)]="editForm.fornitore">
                      @for (v of config()?.fornitori||[]; track v){ <option>{{v}}</option> }
                    </select></div>
                </div>
              </div>
            }

            <button class="btn btn-p btn-sm" style="margin-top:12px" (click)="saveProject()" [disabled]="saving()">
              {{ saving() ? 'Salvataggio...' : 'Salva modifiche' }}
            </button>
          </div>
        }
        @if (!editMode()) {
          <div class="card detail-grid" style="margin-bottom:16px">
            <div><div class="dl">Stato</div>
              <span class="badge" [class]="statoBadge(project()!.stato)">
                <span class="badge-dot" [style.background]="statoColor(project()!.stato)"></span>
                {{ project()!.stato }}
              </span>
            </div>
            <div><div class="dl">Priorità</div>
              <span class="badge" [class]="prioBadge(project()!.priorita)">{{ project()!.priorita }}</span>
            </div>
            <div><div class="dl">Tipologia</div><div class="dv">{{ project()!.tipologia }}</div></div>
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

        <!-- LAYOUT DUE COLONNE: descrizione | dettagli -->
        <div class="proj-split-row" style="margin-bottom:16px">

          <!-- Colonna sinistra: Descrizione -->
          @if (project()!.descrizione) {
            <div class="card proj-split-desc">
              <div class="card-eyebrow">Descrizione</div>
              <div class="proj-desc-text">{{ project()!.descrizione }}</div>
            </div>
          }

          <!-- Colonna destra: Dettagli (tabs, sempre aperti) -->
          <div class="card proj-split-details">
            <div class="card-hdr" style="border-bottom:var(--bd);padding-bottom:12px;margin-bottom:0">
              <div class="card-title" style="font-size:14px">Dettagli</div>
              <div style="display:flex;gap:4px">
                @for (t of getTabs(); track t.id) {
                  <button class="tab" [class.active]="activeTab()===t.id"
                    (click)="activeTab.set(t.id)">{{ t.label }}</button>
                }
              </div>
            </div>

        @if (activeTab() === 'task') {
          <div class="tab-card">
            @if (tasks().length === 0) {
              <div class="task-empty-state">
                <div class="task-empty-icon">📋</div>
                <div class="task-empty-title">Nessun task trovato</div>
                <div class="task-empty-desc">I task non sono stati generati o il progetto è stato importato senza di essi.</div>
                <button class="btn btn-p" (click)="generateTasks()" [disabled]="saving()">
                  {{ saving() ? 'Generazione in corso…' : '⚡ Genera task' }}
                </button>
              </div>
            }
            @for (t of tasks(); track t.id) {
              <div class="task-block" [class.task-locked]="isTaskLocked(t)" [class.task-done]="t.stato==='Completato'">

                <!-- RIGA COMPATTA -->
                <div class="task-block-header" (click)="toggleTaskExpand(t.id)">
                  <div class="task-num">{{ getTaskOrdine(t) }}</div>

                  <div class="task-row-nome">{{ t.nome }}</div>

                  <div class="task-row-dates" (click)="$event.stopPropagation()">
                    <input class="task-date-input" type="date" [value]="t.dataInizio" disabled title="Data inizio"/>
                    <span class="task-date-sep">→</span>
                    @if (auth.isEditor && !isTaskLocked(t)) {
                      <input class="task-date-input task-date-editable" type="date"
                        [(ngModel)]="t.dataFine"
                        (change)="t.dataFine = sanitizeDate(t.dataFine); updateTaskCascade(t)"
                        title="Data fine — modificabile"/>
                    } @else {
                      <input class="task-date-input" type="date" [value]="t.dataFine" disabled title="Data fine"/>
                    }
                  </div>

                  @if (isTaskLocked(t)) {
                    <span class="task-locked-label">⏳ In attesa</span>
                  }

                  <div class="task-row-subtask-count"
                    [class.task-row-subtask-count-has]="getSubTasksForTask(t.id).length > 0">
                    @if (getSubTasksForTask(t.id).length > 0) {
                      {{ getSubTasksForTask(t.id).length }} sotto-task
                    } @else {
                      <span style="color:rgba(46,46,46,0.3)">nessun sotto-task</span>
                    }
                  </div>

                  <div (click)="$event.stopPropagation()">
                    @if (auth.isEditor && !isTaskLocked(t)) {
                      <select class="fi task-stato-select"
                        [(ngModel)]="t.stato" (change)="updateTaskCascade(t)">
                        @for (v of config()?.statiTask||[]; track v){ <option>{{v}}</option> }
                      </select>
                    } @else {
                      <span class="badge" [class]="taskBadge(t.stato)">{{ t.stato }}</span>
                    }
                  </div>

                  <span class="task-chevron">{{ expandedTaskId()===t.id ? '▾' : '▸' }}</span>
                </div>

                <!-- CORPO ESPANSO: solo sotto-task -->
                @if (expandedTaskId() === t.id) {
                  <div class="task-block-body">
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
                            <span style="font-size:11px;color:var(--gray-400)">{{ expandedSubTaskId()===st.id ? '▾' : '▸' }}</span>
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
            <div class="chk-list">
              @for (doc of config()?.docFields||[]; track doc) {
                <div class="chk-row"
                  [class.chk-row-done]="getChecklistEntry(doc)?.completato"
                  [class.chk-row-nn]="getChecklistEntry(doc)?.nonNecessario">
                  <div class="chk-row-left">
                    <input type="checkbox"
                      [checked]="getChecklistEntry(doc)?.completato"
                      (change)="toggleChecklist(doc, getChecklistEntry(doc))"
                      [disabled]="!auth.isEditor || !!getChecklistEntry(doc)?.nonNecessario"
                      class="chk-box" />
                    <span class="chk-row-label"
                      [class.chk-label-done]="getChecklistEntry(doc)?.completato"
                      [class.chk-label-nn]="getChecklistEntry(doc)?.nonNecessario">
                      {{ doc }}
                    </span>
                    @if (getChecklistEntry(doc)?.nonNecessario) {
                      <span class="chk-badge-nn">Non necessario</span>
                    }
                  </div>

                  <div class="chk-row-right">
                    @if (!getChecklistEntry(doc)?.nonNecessario) {
                      @if (getChecklistEntry(doc)?.linkUrl) {
                        <a [href]="getChecklistEntry(doc)!.linkUrl" target="_blank" class="btn-doc-view">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          Documento
                        </a>
                        @if (auth.isEditor) {
                          <button class="btn-doc-edit" (click)="openLinkEdit(doc)" title="Modifica link">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        }
                      } @else if (auth.isEditor) {
                        <button class="btn-doc-insert" (click)="openLinkEdit(doc)">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                          Inserisci link
                        </button>
                      } @else {
                        <span class="chk-no-doc">—</span>
                      }
                    }
                    @if (auth.isEditor && !getChecklistEntry(doc)?.completato) {
                      <button class="btn-nn"
                        [class.btn-nn-active]="getChecklistEntry(doc)?.nonNecessario"
                        (click)="toggleNonNecessario(doc, getChecklistEntry(doc))"
                        [title]="getChecklistEntry(doc)?.nonNecessario ? 'Rimuovi flag non necessario' : 'Segna come non necessario'">
                        {{ getChecklistEntry(doc)?.nonNecessario ? '↩ Ripristina' : 'Non necessario' }}
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
            <div class="chk-footer">
              <span>{{ completatiCount() }} / {{ docTotale() }} documenti completati</span>
            </div>
          </div>
        }

        <!-- MODAL INSERISCI LINK DOCUMENTO -->
        @if (linkEditDoc()) {
          <div class="mb" (click)="$event.target === $event.currentTarget && closeLinkEdit()">
            <div class="modal" style="max-width:480px">
              <div class="mh">
                <span class="mt">Link documento</span>
                <button class="ico-btn" (click)="closeLinkEdit()">✕</button>
              </div>
              <div class="mbody">
                <div class="fg">
                  <label class="fl">{{ linkEditDoc() }}</label>
                  <input class="fi" type="url" [(ngModel)]="linkEditValue"
                    placeholder="https://..." (keydown.enter)="saveLinkEdit()" />
                  <div style="font-size:11px;color:rgba(46,46,46,0.45);margin-top:4px">Incolla l'URL del documento (SharePoint, Drive, ecc.)</div>
                </div>
              </div>
              <div class="mfoot">
                @if (getChecklistEntry(linkEditDoc()!)?.linkUrl) {
                  <button class="btn btn-danger" style="margin-right:auto" (click)="deleteLinkEdit()">Rimuovi link</button>
                }
                <button class="btn btn-g" (click)="closeLinkEdit()">Annulla</button>
                <button class="btn btn-p" (click)="saveLinkEdit()">Salva link</button>
              </div>
            </div>
          </div>
        }

          </div><!-- /proj-split-details -->
        </div><!-- /proj-split-row -->

        <!-- GANTT full-width -->
        <div class="card gantt-card">
          <div class="card-hdr">
            <div>
              <div class="card-eyebrow">Pianificazione</div>
              <div class="card-title">Gantt dei task</div>
            </div>
            <div class="gantt-legend">
              <span class="gantt-legend-item"><span class="gantt-legend-dot" style="background:#D8DFE6"></span>Previsionale</span>
              <span class="gantt-legend-item"><span class="gantt-legend-dot" style="background:#6EC0AA"></span>Completato in anticipo</span>
              <span class="gantt-legend-item"><span class="gantt-legend-dot" style="background:#E89B8A"></span>Completato in ritardo</span>
              <span class="gantt-legend-item"><span class="gantt-legend-dot" style="background:#7EB8DA"></span>In corso</span>
            </div>
          </div>
          <div class="gantt-wrap">
            <div class="gantt-labels">
              @for (t of tasks(); track t.id) {
                <div class="gantt-label" [class.gantt-done]="t.stato==='Completato'" [class.gantt-active]="t.stato==='In corso'">
                  <span class="gantt-task-num">{{ getTaskOrdine(t) }}</span>
                  {{ t.nome }}
                </div>
              }
            </div>
            <div class="gantt-chart" #ganttContainer>
              <div class="gantt-header">
                @for (col of ganttColumns(); track col.label; let ci = $index) {
                  <div class="gantt-col-hdr" [style.width.px]="ganttDayW"
                    [style.background]="col.isMonday ? 'rgba(110,192,170,0.08)' : ''">
                    {{ col.label }}
                  </div>
                }
              </div>
              @for (t of tasks(); track t.id) {
                <div class="gantt-row">
                  @for (col of ganttColumns(); track col.label) {
                    <div class="gantt-cell" [style.width.px]="ganttDayW"
                      [style.background]="col.isMonday ? 'rgba(110,192,170,0.04)' : ''"></div>
                  }
                  <!-- Barra PREVISIONALE (sempre grigia, fa da contenitore) -->
                  <div class="gantt-bar-forecast"
                    [style.left.px]="ganttForecastLeft(t)"
                    [style.width.px]="ganttForecastWidth(t)"
                    [title]="'Previsionale: ' + ganttForecastLabel(t)">
                  </div>
                  <!-- Barra CONSUNTIVATA (completato: verde se anticipo, rosso se ritardo) -->
                  @if (t.stato === 'Completato' && t.dataInizio && t.dataFine) {
                    <div class="gantt-bar-actual"
                      [class.gantt-bar-early]="isEarly(t)"
                      [class.gantt-bar-late]="!isEarly(t)"
                      [style.left.px]="ganttBarLeft(t)"
                      [style.width.px]="ganttBarWidth(t)"
                      [title]="'Consuntivato: ' + fmtDate(t.dataInizio) + ' → ' + fmtDate(t.dataFine)">
                      <span class="gantt-bar-label">{{ getDeltaLabel(t) }}</span>
                    </div>
                  }
                  <!-- Barra IN CORSO (azzurra, da dataInizio a oggi) -->
                  @if (t.stato === 'In corso' && t.dataInizio) {
                    <div class="gantt-bar-active"
                      [style.left.px]="ganttBarLeft(t)"
                      [style.width.px]="ganttBarWidthInProgress(t)"
                      [title]="'In corso dal: ' + fmtDate(t.dataInizio)">
                      <span class="gantt-bar-label">{{ getDeltaInCorsoLabel(t) }}</span>
                    </div>
                  }
                </div>
              }
            </div>
          </div>
        </div>
        @if (toast()) { <div class="toast ok">{{ toast() }}</div> }
      }
    </div>
  `,
  styles: []
})
export class ProjectDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('ganttContainer') ganttContainerRef!: ElementRef;
  private resizeObserver?: ResizeObserver;
  iconCalendar = ICON_CALENDAR;
  iconVerified = ICON_VERIFIED;
  iconFolder = ICON_FOLDER;
  private route = inject(ActivatedRoute);
  db = inject(GithubDataService);
  auth = inject(AuthService);

  loading = signal(true);
  saving = signal(false);
  project = signal<Project | null>(null);
  allProjects = signal<Project[]>([]);
  tasks = signal<Task[]>([]);
  subtasks = signal<any[]>([]);
  checklist = signal<ChecklistItem[]>([]);
  tickets = signal<Ticket[]>([]);
  users = signal<User[]>([]);
  config = signal<AppConfig | null>(null);
  activeTab = signal('task');
  tabsOpen  = signal(false);
  descOpen  = signal(false);
  editMode  = signal(false);
  toast = signal('');
  editForm: Partial<Project> = {};
  checklistLinks: Record<string, string> = {};
  linkEditDoc   = signal<string | null>(null);
  linkEditValue = '';

  openLinkEdit(doc: string) {
    this.linkEditValue = this.getChecklistEntry(doc)?.linkUrl || '';
    this.linkEditDoc.set(doc);
  }
  closeLinkEdit() { this.linkEditDoc.set(null); }

  async saveLinkEdit() {
    const doc = this.linkEditDoc();
    if (!doc) return;
    const entry = this.getChecklistEntry(doc);
    const projectId = this.project()!.id;
    await this.db.upsertChecklistItem({
      id: entry?.id, documento: doc,
      completato: entry?.completato || false,
      linkUrl: this.linkEditValue.trim(),
      nonNecessario: entry?.nonNecessario || false,
      projectId
    });
    await this.db.logAction({
      userId: this.auth.currentUser()?.id || '', action: 'link',
      entityType: 'checklist', entityId: entry?.id || doc, entityName: doc,
      projectId, projectName: this.project()!.nome,
      field: 'linkUrl', oldValue: entry?.linkUrl || '', newValue: this.linkEditValue.trim(),
    });
    this.checklist.set(await this.db.getChecklist(projectId));
    this.linkEditDoc.set(null);
    await this.checkAutoCompleta();
  }

  async deleteLinkEdit() {
    const doc = this.linkEditDoc();
    if (!doc) return;
    const entry = this.getChecklistEntry(doc);
    const projectId = this.project()!.id;
    await this.db.upsertChecklistItem({
      id: entry?.id, documento: doc,
      completato: entry?.completato || false,
      linkUrl: '', nonNecessario: entry?.nonNecessario || false, projectId
    });
    this.checklist.set(await this.db.getChecklist(projectId));
    this.linkEditDoc.set(null);
    await this.checkAutoCompleta();
  }
  expandedTaskId = signal<string>('');
  expandedSubTaskId = signal<string>('');
  newSubTaskMap: Record<string, Record<string, string>> = {};
  newTicket: Partial<Ticket> = { titolo:'', descrizione:'', stato:'Aperto', priorita:'Media', riferimentoSD:'', dataApertura: new Date().toISOString().split('T')[0], note:'' };

  readonly ganttLabelW = 160;
  ganttContainerW = signal(800);
  get ganttDayW(): number {
    const cols = this.ganttColumns().length || 1;
    const available = this.ganttContainerW() - this.ganttLabelW;
    return Math.max(14, Math.floor(available / cols));
  }

  // ── BU panel ─────────────────────────────────────────
  sameBuProjects = computed(() => {
    const p = this.project();
    if (!p?.businessUnit) return [];
    return this.allProjects()
      .filter(x => x.id !== p.id && x.businessUnit === p.businessUnit)
      .sort((a, b) => {
        const prioOrder: Record<string,number> = { 'Critica':0,'Alta':1,'Media':2,'Bassa':3 };
        const pd = (prioOrder[a.priorita] ?? 9) - (prioOrder[b.priorita] ?? 9);
        return pd !== 0 ? pd : b.completamento - a.completamento;
      });
  });

  pctClass(n: number) { return n >= 70 ? 'hi' : n >= 40 ? 'md' : 'lo'; }

  doneTaskCount  = computed(() => this.tasks().filter(t => t.stato === 'Completato').length);
  isScadutoProj  = computed(() => {
    const p = this.project();
    return p?.dataFine ? new Date(p.dataFine) < new Date() && p.stato !== 'Completato' : false;
  });
  ownerInitials  = computed(() => {
    const name = this.ownerName(this.project()?.owner || '');
    const parts = name.trim().split(' ');
    return parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  });

  statoColor(s: string): string {
    const m: Record<string,string> = {
      'In corso':'#6EC0AA','Completato':'#2E2E2E','Pianificazione':'#B8D8CE',
      'In attesa':'#E89B8A','On Hold':'#E89B8A','Annullato':'#8aaca4'
    };
    return m[s] || '#8aaca4';
  }

  // ── Gantt ─────────────────────────────────────────────
  ganttStart = computed(() => {
    const p = this.project();
    if (p?.dataInizio) return new Date(p.dataInizio);
    const tasks = this.tasks();
    const dates = tasks.map(t => t.dataInizio).filter(Boolean).map(d => new Date(d));
    return dates.length ? new Date(Math.min(...dates.map(d => d.getTime()))) : new Date();
  });

  ganttEnd = computed(() => {
    const start = this.ganttStart();
    const tasks = this.tasks();
    // Fine previsionale: somma settimaneStimate di tutti i task
    let totalDays = 0;
    tasks.forEach(t => totalDays += (t.settimaneStimate || 1) * 7);
    const forecastEnd = new Date(start.getTime() + totalDays * 86400000);
    // Estendi se ci sono date reali oltre la previsione
    const realEnds = tasks.map(t => t.dataFine).filter(Boolean).map(d => new Date(d));
    return realEnds.length
      ? new Date(Math.max(forecastEnd.getTime(), ...realEnds.map(d => d.getTime())))
      : forecastEnd;
  });

  ganttColumns = computed(() => {
    const start = this.ganttStart();
    const end = this.ganttEnd();
    const cols: { label: string; date: Date; isMonday: boolean }[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      const dow = cur.getDay();
      const isMonday = dow === 1;
      cols.push({
        label: isMonday ? cur.toLocaleDateString('it-IT', { day:'2-digit', month:'2-digit' }) : '',
        date: new Date(cur),
        isMonday,
      });
      cur.setDate(cur.getDate() + 1);
    }
    return cols;
  });

  // Posizione previsionale: cumulo settimaneStimate dei task precedenti
  ganttForecastLeft(t: Task): number {
    const SEQUENCE = ['REQUISITI','TEMPI E STIME','SVILUPPO','COLLAUDO LDT','COLLAUDO BU','PRODUZIONE','ADOPTION'];
    const idx = SEQUENCE.indexOf(t.nome);
    const tasks = this.tasks();
    let offset = 0;
    for (let i = 0; i < idx; i++) {
      const prev = tasks.find(x => x.nome === SEQUENCE[i] && x.projectId === t.projectId);
      offset += (prev?.settimaneStimate || 1) * 7;
    }
    return offset * this.ganttDayW;
  }

  ganttForecastWidth(t: Task): number {
    return (t.settimaneStimate || 1) * 7 * this.ganttDayW;
  }

  ganttForecastLabel(t: Task): string {
    const start = this.ganttStart();
    const leftDays = this.ganttForecastLeft(t) / (this.ganttDayW || 1);
    const widthDays = this.ganttForecastWidth(t) / (this.ganttDayW || 1);
    const s = new Date(start.getTime() + leftDays * 86400000);
    const e = new Date(start.getTime() + (leftDays + widthDays) * 86400000);
    return this.fmtDate(s.toISOString().split('T')[0]) + ' → ' + this.fmtDate(e.toISOString().split('T')[0]);
  }

  // Posizione barra consuntivata (usa dataInizio reale)
  ganttBarLeft(t: Task): number {
    const start = this.ganttStart();
    const taskStart = t.dataInizio ? new Date(t.dataInizio) : start;
    const diff = Math.floor((taskStart.getTime() - start.getTime()) / 86400000);
    return Math.max(0, diff) * this.ganttDayW;
  }

  // Larghezza barra consuntivata (dataInizio → dataFine)
  ganttBarWidth(t: Task): number {
    if (t.dataInizio && t.dataFine) {
      const s = new Date(t.dataInizio);
      const e = new Date(t.dataFine);
      const days = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1);
      return days * this.ganttDayW;
    }
    return (t.settimaneStimate || 1) * 7 * this.ganttDayW;
  }

  // Larghezza barra "in corso" (dataInizio → oggi)
  ganttBarWidthInProgress(t: Task): number {
    const s = new Date(t.dataInizio || new Date());
    const e = new Date();
    const days = Math.max(1, Math.ceil((e.getTime() - s.getTime()) / 86400000) + 1);
    return days * this.ganttDayW;
  }

  // Completato prima della fine previsionale?
  isEarly(t: Task): boolean {
    if (!t.dataFine) return false;
    const start = this.ganttStart();
    const leftDays = this.ganttForecastLeft(t) / (this.ganttDayW || 1);
    const widthDays = this.ganttForecastWidth(t) / (this.ganttDayW || 1);
    const forecastEnd = new Date(start.getTime() + (leftDays + widthDays) * 86400000);
    return new Date(t.dataFine) <= forecastEnd;
  }

  // Etichetta delta per barra consuntivata
  getDeltaLabel(t: Task): string {
    if (!t.dataFine) return '';
    const start = this.ganttStart();
    const leftDays = this.ganttForecastLeft(t) / (this.ganttDayW || 1);
    const widthDays = this.ganttForecastWidth(t) / (this.ganttDayW || 1);
    const forecastEnd = new Date(start.getTime() + (leftDays + widthDays) * 86400000);
    const actualEnd = new Date(t.dataFine);
    const deltaDays = Math.round((actualEnd.getTime() - forecastEnd.getTime()) / 86400000);
    if (deltaDays === 0) return '✓';
    return (deltaDays > 0 ? '+' : '') + deltaDays + 'gg';
  }

  // Etichetta delta per task in corso (giorni rispetto alla fine previsionale)
  getDeltaInCorsoLabel(t: Task): string {
    const start = this.ganttStart();
    const leftDays = this.ganttForecastLeft(t) / (this.ganttDayW || 1);
    const widthDays = this.ganttForecastWidth(t) / (this.ganttDayW || 1);
    const forecastEnd = new Date(start.getTime() + (leftDays + widthDays) * 86400000);
    const today = new Date();
    const deltaDays = Math.round((today.getTime() - forecastEnd.getTime()) / 86400000);
    if (deltaDays === 0) return '✓';
    return (deltaDays > 0 ? '+' : '') + deltaDays + 'gg';
  }

  calcTheoreticalStart(t: Task): Date {
    const SEQUENCE = ['REQUISITI','TEMPI E STIME','SVILUPPO','COLLAUDO LDT','COLLAUDO BU','PRODUZIONE','ADOPTION'];
    const idx = SEQUENCE.indexOf(t.nome);
    const tasks = this.tasks();
    const start = this.ganttStart();
    let offset = 0;
    for (let i = 0; i < idx; i++) {
      const prev = tasks.find(x => x.nome === SEQUENCE[i] && x.projectId === t.projectId);
      offset += (prev?.settimaneStimate || 1) * 7;
    }
    return new Date(start.getTime() + offset * 86400000);
  }

  getTabs() {
    const doneCount = this.tasks().filter(t => t.stato === 'Completato').length;
    const openTickets = this.tickets().filter(t => !['Risolto','Chiuso'].includes(t.stato)).length;
    return [
      { id:'task',      label:'Task (' + doneCount + '/' + this.tasks().length + ')' },
      { id:'ticket',    label:'Ticket SD (' + openTickets + ' aperti)' },
      { id:'checklist', label:'Checklist (' + this.completatiCount() + '/' + this.docTotale() + ')' },
    ];
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadAll(id);
  }

  ngAfterViewInit() {
    if (this.ganttContainerRef) {
      this.resizeObserver = new ResizeObserver(entries => {
        const w = entries[0]?.contentRect.width;
        if (w) this.ganttContainerW.set(w);
      });
      this.resizeObserver.observe(this.ganttContainerRef.nativeElement);
    }
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  async loadAll(id: string) {
    this.loading.set(true);
    const [projects, tasks, subtasks, checklist, tickets, users, config] = await Promise.all([
      this.db.getProjects(), this.db.getTasks(id), this.db.getSubTasks(undefined, id),
      this.db.getChecklist(id), this.db.getTickets(id), this.db.getUsers(), this.db.getConfig()
    ]);
    const proj = projects.find(p => p.id === id) || null;
    this.project.set(proj);
    this.allProjects.set(projects);
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
  fmtDate(d: string): string {
    if (!d) return '—';
    const date = new Date(d);
    if (isNaN(date.getTime()) || date.getFullYear() < 2000) return '—';
    return date.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  sanitizeDate(d: string): string {
    if (!d) return '';
    const date = new Date(d);
    return (!isNaN(date.getTime()) && date.getFullYear() >= 2000) ? d : '';
  }

  async generateTasks(): Promise<void> {
    const p = this.project();
    if (!p) return;
    this.saving.set(true);
    try {
      const dataInizio = p.dataInizio || new Date().toISOString().split('T')[0];
      await this.db.initProjectTasks(p.id, dataInizio);
      const allTasks = await this.db.getTasks();
      const projectTasks = allTasks.filter(t => t.projectId === p.id);
      this.tasks.set(projectTasks);
      projectTasks.forEach(t => this.initNewSubTask(t.id));
      this.showToast('Task generati con successo');
    } catch {
      this.showToast('Errore nella generazione dei task');
    }
    this.saving.set(false);
  }
  statoBadge(s: string): string { const m: Record<string,string>={'In corso':'bb','Completato':'bg','Pianificazione':'bgr','In attesa':'bo','Annullato':'br','On Hold':'bo'}; return 'badge '+(m[s]||'bgr'); }
  prioBadge(p: string): string { const m: Record<string,string>={'Critica':'prio-critica','Alta':'prio-alta','Media':'prio-media','Bassa':'prio-bassa'}; return 'badge '+(m[p]||'bgr'); }
  docBadge(d: string): string { const m: Record<string,string>={'totale':'bg','parziale':'bo','non necessaria':'bgr'}; return 'badge '+(m[d]||'bgr'); }
  taskBadge(s: string): string { const m: Record<string,string>={'In corso':'bb','Completato':'bg','Da fare':'bgr','Bloccato':'br'}; return 'badge '+(m[s]||'bgr'); }
  ticketBadge(s: string): string { const m: Record<string,string>={'Aperto':'bb','In lavorazione':'bo','Risolto':'bg','Chiuso':'bgr'}; return 'badge '+(m[s]||'bgr'); }
  showToast(msg: string) { this.toast.set(msg); setTimeout(() => this.toast.set(''), 3000); }

  async saveProject() {
    if (!this.project()) return;
    this.saving.set(true);
    const old = this.project()!;
    await this.db.updateProject(old.id, this.editForm as Project);
    // Log campi modificati
    const uid = this.auth.currentUser()?.id || '';
    const changedFields = Object.keys(this.editForm).filter(k =>
      (this.editForm as any)[k] !== (old as any)[k]
    );
    for (const field of changedFields) {
      await this.db.logAction({
        userId: uid, action: 'update', entityType: 'project',
        entityId: old.id, entityName: old.nome,
        projectId: old.id, projectName: old.nome,
        field, oldValue: String((old as any)[field] ?? ''),
        newValue: String((this.editForm as any)[field] ?? ''),
      });
    }
    this.project.set({ ...old, ...this.editForm } as Project);
    this.editMode.set(false);
    this.saving.set(false);
    this.showToast('Progetto aggiornato');
  }

  getChecklistEntry(doc: string): ChecklistItem | undefined { return this.checklist().find(c => c.documento === doc); }
  completatiCount(): number { return this.checklist().filter(c => c.completato && !c.nonNecessario).length; }
  nonNecessarioCount(): number { return this.checklist().filter(c => c.nonNecessario).length; }
  docTotale(): number { return (this.config()?.docFields?.length || 0) - this.nonNecessarioCount(); }

  async checkAutoCompleta(): Promise<void> {
    const docs = this.config()?.docFields || [];
    if (docs.length === 0) return;
    const p = this.project();
    if (!p) return;
    // Tutti i doc devono essere completati o non necessari
    const allDone = docs.every(doc => {
      const e = this.getChecklistEntry(doc);
      return e && (e.completato || e.nonNecessario);
    });
    if (allDone && p.documentazione !== 'completata') {
      await this.db.updateProject(p.id, { ...p, documentazione: 'completata' });
      this.project.set({ ...p, documentazione: 'completata' });
      this.showToast('Documentazione completata automaticamente ✓');
    } else if (!allDone && p.documentazione === 'completata') {
      await this.db.updateProject(p.id, { ...p, documentazione: 'parziale' });
      this.project.set({ ...p, documentazione: 'parziale' });
    }
  }

  async toggleChecklist(doc: string, entry: ChecklistItem | undefined) {
    const projectId = this.project()!.id;
    if (entry?.nonNecessario) return;
    const newVal = !entry?.completato;
    await this.db.upsertChecklistItem({
      id: entry?.id, documento: doc, completato: newVal,
      linkUrl: entry?.linkUrl || '', nonNecessario: false, projectId
    });
    await this.db.logAction({
      userId: this.auth.currentUser()?.id || '', action: 'update', entityType: 'checklist',
      entityId: entry?.id || doc, entityName: doc,
      projectId, projectName: this.project()!.nome,
      field: 'completato', oldValue: String(!newVal), newValue: String(newVal),
    });
    this.checklist.set(await this.db.getChecklist(projectId));
    await this.checkAutoCompleta();
  }

  async toggleNonNecessario(doc: string, entry: ChecklistItem | undefined) {
    const projectId = this.project()!.id;
    const newVal = !entry?.nonNecessario;
    await this.db.upsertChecklistItem({
      id: entry?.id, documento: doc,
      completato: newVal ? false : (entry?.completato || false),
      linkUrl: newVal ? '' : (entry?.linkUrl || ''),
      nonNecessario: newVal, projectId
    });
    await this.db.logAction({
      userId: this.auth.currentUser()?.id || '', action: 'update', entityType: 'checklist',
      entityId: entry?.id || doc, entityName: doc,
      projectId, projectName: this.project()!.nome,
      field: 'nonNecessario', oldValue: String(!newVal), newValue: String(newVal),
    });
    this.checklist.set(await this.db.getChecklist(projectId));
    await this.checkAutoCompleta();
  }
  async saveChecklistLink(doc: string, entry: ChecklistItem | undefined) {
    const projectId = this.project()!.id;
    await this.db.upsertChecklistItem({ id: entry?.id, documento: doc, completato: entry?.completato||false, linkUrl: this.checklistLinks[doc]||'', nonNecessario: entry?.nonNecessario||false, projectId });
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
    const old = this.tasks().find(x => x.id === t.id);
    const oldStato = old?.stato || '';

    const updated = await this.db.updateTaskWithCascade(t.id, { stato: t.stato, dataFine: t.dataFine }, this.tasks());
    await this.db.logAction({
      userId: this.auth.currentUser()?.id || '',
      action: t.stato !== oldStato ? 'status_change' : 'update',
      entityType: 'task', entityId: t.id, entityName: t.nome,
      projectId: t.projectId, projectName: this.project()!.nome,
      field: 'stato', oldValue: oldStato, newValue: t.stato,
    });
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
