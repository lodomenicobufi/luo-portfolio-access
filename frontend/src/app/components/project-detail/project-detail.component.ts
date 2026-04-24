// src/app/components/project-detail/project-detail.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { GithubDataService } from '../../core/services/github-data.service';
import { AuthService } from '../../core/services/auth.service';
import { Project, Task, ChecklistItem, Ticket, User, AppConfig } from '../../core/models';

const ICON_CALENDAR = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAfQAAAH0CAYAAADL1t+KAAAACXBIWXMAAAsSAAALEgHS3X78AAARuklEQVR4nO3d7ZHUSLYG4MMNDOBasDUGKLaxYKoNUAw4IBoLBiwALAAsoJEDsCEDKCygJ2TA1nrQHuz9Ueq5zSzN8tGplE49T8TEzBD0UVaC8i2lpMwIAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAEjrTu0GQDcO9yLi5C+/fNE37WWN9mShX8vQryyVQKeKaVA8i4hH8Z+D45WLiHgbEecGy2+jX8vQr6yBQGd23Tg8iIiXEbH5xh/ZR8TTvmnfl2pTBvq1DP3KWvxP7QZwXLpxeB4R7+LbB8eYfu+76Wf5Av1ahn5lTVyhM5tuHJ7E4UrnZzztm/bVbbQnC/1ahn5lbQQ6s+jGYRsRH26p3GnftLtbqrVq+rUM/coamXJnLj97pVOq1trp1zL0K6sj0ClueqjopieDf8TJVPOo6dcy9CtrJdCZw28rqbk2+rUM/coqCXTmsF1JzbXZrqTm2mxXUhM+I9CZw2YlNddms5Kaa7NZSU34jEAHgAQEOgAkINABIAGBDgAJCHQASECgA0ACAh0AEhDoAJCAQAeABAQ6ACQg0AEgAYEOAAkIdABIQKADQAICHQASuFO7ASxTNw7bOOzhvImIv8Xn+zlvwv7OUNJ++uf6///r6tf7pt3N3SCWT6AT3ThsImIbEb9O/97Uaw3wjfYRsYuIjxGx65t2X7Mx1CfQj1Q3DicR8SgiHoQAhwz2EfE+It72TXtRuS1UINCPSDcO9yLiLCJ+DyEOme0j4nVEnPdNe1m5LcxEoB+BaUr9WRzCHDgu5xHxwpR8fgI9MUEOXHMegj01gZ6QIAe+4jwEe0oCPZluHJ7H4R75vcpNAZbrMiJe9037vHZDuD0CPYnpqfU3EXFSuy3AalxExGNPxedgpbgEunF4EhGfQpgD3+ckIj5NYwgr5wp9xabX0N7E4V1ygJ/xPg5X615zWymBvlKm2IECTMGvmEBfoSnMP4QH34DbdxkRp0J9fdxDX5luHM7icL9cmAMl3IvDffWz2g3h+7hCX5HpBHtTux3A0XjcN+157UbwbQT6SghzoBKhvhICfQWmvck/1G4HcLRO7cG+fAJ94TwAByyAB+VWQKAv2PSe+aew1SlQ3z4i7ntPfbk85b5s70KYA8uwicOYxEIJ9IWaNlnZVm4GwHXbaWxigUy5L5CH4ICF85DcAgn0hVnoffOLONw/+2P6/913/nypLyenhequhX4tYyn9up3+/fc4jAdLWuZ5H+6nL87d2g3gPzyL+mF+GYeNGv4REbufPWm7cbiVRv3VsV8h6NcyFtSvn/3+6cv+NiJ+i8OGTDXffNnEYax6WrEN/IVAX5DpFbWa2xjuIuKtRSRgeaYv1u+nfx5Pi009inrP2jzpxuGtV9mWQ6Avy8tKx91FxItjvzKDNZm+eJ9Pz9w8izrB/jLcolkMT7kvxHRSbmc+7GVEPOyb1gMusFJ90+76pj2NiIdxOKfntJ3GLhZAoC/H3Ou0v4+IX/qmfT/zcYECpnP5lzic23Oyx8RCCPQF6MbhQcz7INzTvmkfekIVcumb9rJv2ocx78Nqm2kMozKBvgy/z3Scqyn2VzMdD6hgOsfnnIKfawzjKwR6ZdOT7dsZDnW1uYIpdjgC07l+GvOE+nYay6hIoNc31zfbh14vgeMynfMPZzqcq/TKBHpF00IRc9x7euwpdjhO07n/eIZDPZjGNCoR6HXNsdrTuYVi4LhdvbNe+DBzXaBwA4Fe12+F6+/D0ozAwdM4jAkllR7T+AqBXslM0+2PvZoGRPy5dGzpqXfT7hUJ9Hq2heufu28OXDeNCeeFD7MtXJ8bCPR6fi1c/0Xh+sA6lR4bSo9t3ECg17MtWPu8b9p9wfrASk1jw3nBQ2wL1uYrBHoF0z2mkoswuDoHvqbkGHHiPnodAr2OkmF+scCr8xIL2lgkR7+Wkr5fpzGiZJusGleBQK+j5F/2twVr/6jdSmquzW4lNddmt5KaP6vkWCHQKxDodfytYO0lrtX+eiU110a/lnEs/VpyrCg5xnEDgV5HqW+v+wVOt5d4CMdDf6FfSzmWfp3atC9U3hV6BQK9jlIPjOwK1b0NT+N2dn26DKvfXadfyziWft0VquuhuAoEeh2lvr3+q1DdnzatUvWzWzlebQFr9buJfi3jiPq11JjhCr0CgZ7LrnYDvmbayvE0fmyabx+HwXFRTwsvgX4t40j6dVe7Adwegc6spgHufkS8+o4fexUR91cwOFajX8vQr6zJndoNODbdOJxExKdC5f934dN7n+nGYROHDWp+i8MU3dV9t8s4vCP7j4h4v8QHipZMv5aRtV+7cfh3odK+1MxMoM+sG4dtRHwoUbtvWn+ewHcpGOinNoialyl3AEhAoANAAgIdABIQ6ACQgEAHgAQEOgAkINABIAGBDgAJCHQASECgA0ACAh0AEhDoAJDA3doN4PYU3GQBgIVzhQ4ACQh0AEhAoANAAgIdABIQ6ACQgEAHgAQEOgAkINABIAGBDgAJCHQASECgA0ACAh0AEhDoAJCAQAeABAQ6ACQg0AEgAYEOAAkIdABIQKADQAICHQASEOgAkMDd2g3gVp3WbgCwOh9qN4DbIdAT6Zt2V7sNwLp041C7CdwSU+4AkIBAB4AEBDoAJCDQASABgQ4ACQh0AEhAoANAAgIdABIQ6ACQgEAHgAQEOgAkINABIAGBDgAJ2G2NdLpxKLodZN+0s2xT243Dy4g4KXiIp33TXhSsHxER3TicRcSjgofI8jne9k17XrA+yQl0MtrWbsAtOYmyn+VewdrXbcLn+BYfC9bmCJhyB4AEBDoAJCDQASABgQ4ACQh0AEhAoANAAgIdABIQ6ACQgEAHgAQEOgAkINABIAGBDgAJCHQASECgA0ACAh0AEhDoAJCAQAeABAQ6ACQg0AEgAYEOAAkIdABIQKADQAJ3azcACjit3YBb8jQi7hWsf1Gw9nXnEbErWD/L59gXrM0REOik0zftrnYbbkPftHMFVVF90+4jQVhl+RzkZcodABIQ6ACQgEAHgAQEOgAkINABIAGBDgAJCHQASECgA0ACAh0AEhDoAJCAQAeABAQ6ACQg0AEgAYEOAAkIdABIQKADQAICHQASEOgAkIBAB4AEBDoAJCDQASABgQ4ACQh0AEhAoANAAgIdABK4W7sBLEM3DpuIOCt4iH3ftOcF6/+pG4fnJev3TVu0/pVuHM4iYlPwEOd90+4L1o+IiG4cthGxLXiILJ9j1zftrmB9khPoXNlExLOC9XcRcV6w/nUlP0dExPPC9a88isIBEhH7gvWvbKP83619wfpXtlH+79aucH0SM+UOAAkIdABIQKADQAICHQASEOgAkIBAB4AEBDoAJCDQASABgQ4ACQh0AEhAoANAAgIdABIQ6ACQgEAHgAQEOgAkINABIAGBDgAJCHQASECgA0ACAh0AEhDoAJCAQAeABO7WbgCLsY+IF4Xrz6Xk55jT24j4WLD+vmDt63aF6+8L17+yW3l9krtTuwHHphuHbUR8KFG7b1p/nsB36cbh34VKn/ZNuytUmy8w5Q4ACQh0AEhAoANAAgIdABIQ6ACQgEAHgAQEOgAkINABIAGBDgAJCHQASECgA0ACAh0AEhDoAJCAQAeABAQ6ACQg0AEgAYEOAAkIdABIQKADQAICHQASEOgAkIBAB4AEBDoAJCDQASABgQ4ACdyt3QCWoRuHexFxUvAQl33TXhSs/6duHLYl6/dNuytZ/0o3DicRca/gIS76pr0sWD8iIrpx2ETEpuAhZvkcsHQCnSsnEfGhYP1dRJwWrH9dyc8REXGncP0rLyNiW7D+aRz+XEo7i4hnBevP9Tlg0Uy5A0ACAh0AEhDoAJCAQAeABAQ6ACQg0AEgAYEOAAkIdABIQKADQAICHQASEOgAkIBAB4AEBDoAJCDQASABgQ4ACQh0AEhAoM/volThbhxOStUG8ik5ZvRNuytVmy8T6DPrm/ayYPl7BWsD+RgzEhHouWxqNwBYlU3tBnB7BHodpa7SN4XqAjltCtUtORPJDQR6HaXuo/9aqC6QU6kxo9izQtxMoNdR6tvrtlBdIKdtobqu0Cu4W7sBR+qPiHhQonA3Dg/6pn3/Az96GRG7W27OdXN+Y9/NeKySSvfZXIPuPsr+mQiPH9CNQ5ExaPJHwdrc4E7tBhyj6UR6V6j8ed+0jwvVBpLoxuFNRJwVKv/wBy8s+Amm3OvYF6z9oBsHr6IAN5rGiJJX6PuCtbmBQK+gb9qLKDdNWPpEBdbvQZR7B/1yGuOYmUCvZ1ew9rOCtYH1KzlG7ArW5isEej0fC9bedONwVrA+sFLT2LApeIiSYxtfIdDr2RWu/9K9dOC6aUx4WfgwHoarRKBXMt1j2hc8xL0w9Q587lmUXb993zftvmB9vkKg11X6m+yTbhy2hY8BrMA0FjwpfBhX5xUJ9LreznCMd6be4bhNY0CptS+um2NM4wYCvaJp2r306x33IuKDUIfjNJ37H6L8VqkXXlerS6DX93qGY5zEPN/OgeV5F4cxoLQ5xjK+QqDX9z7mWYt6242D6Xc4Et043OvG4V3Ms2nTZbh/Xp1Ar6xv2suY75vtgzD9Duldm2afa9XI19NYRkUCfRlexXw7Rp1ExKduHOaYggNmNp3bn2KeafaIw9j1aqZj8RUCfQFmvkqPOKwS9akbh+czHhMobDqnP0XZleD+ytX5Qtg+dSGmKbJ/RvknUf9qHxGP+6bdzXxc4JZM75i/iXmDPOJwdf6LQF8Ggb4g3Tg8ifLLMt5kF4dv2h5sgZXoxuFBRPwe8zz49iVP+6Y13b4QAn1hunGY897Xl+zjMP3/3hKOsDzdOGwi4iwiHsX8V+TXXfRNe7/i8fkLgb4w09TZh9rtmOzjcOX+MQ5rNO9qNgaO0TQmbCLi1zhciW/qteYzp8aEZRHoC9SNw8sov+byz7iM8ivcwTE7ifmfp/ker/qmfVq7EXxOoC/UAqbeAb7EVPtCeW1tuR7HfO+mA3yLyziMTSyQQF+oaZMDU1rAkjy1ActyCfQF65v2PKzABCzDq2lMYqHcQ1+BbhzexOE1FYAazvumNdW+cAJ9Jbpx+BD1Fo8Ajteub9rT2o3gvzPlvh4Pw6tiwLwu4jD2sAKu0Ffk2paIXmcDSruIw+Ix3rZZCYG+Qu6pA4W5Z75CptxXaDrRPP0OlPBKmK+TK/QV68bhLA67sy15iUhgHS7j8J75ee2G8GME+sp143ASEe9iORs2AOuzj4iHFo1ZN1PuKzedgPfDFDzwY15FxH1hvn6u0BOZtll8E67Wgf9uHxGPbYGahyv0RKYT835EvKjcFGDZXsThqnxXuyHcHlfoSXXjsImIZ+H1NuD/nUfEi75p95XbQQECPTnBDoQgPwoC/UhMwX4WEb+H19zgGFxGxOs4LBKzr9wWZiDQj1A3Dg8i4reIeBDCHTK5jIj3EfGPvmnf124M8xLoR24K91/jEO6buq0BfsA+DiH+UYgfN4HOn6bNX7Zx2Pzl73EIeBvBwHJcxCHA/5j+e2fzFK4IdL7J9I47UIHXywAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAI/d/Ifv5k2us6tAAAAAASUVORK5CYII=';
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
  iconCalendar = ICON_CALENDAR;
  iconVerified = ICON_VERIFIED;
  iconFolder = ICON_FOLDER;
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
