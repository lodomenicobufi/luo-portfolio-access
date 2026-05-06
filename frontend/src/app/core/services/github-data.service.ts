// src/app/core/services/github-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User, Project, Task, ChecklistItem, Ticket, AppConfig, Richiesta, ActivityLog } from '../models';

export interface GithubConfig {
  owner: string;
  repo: string;
  token: string;
  branch: string;
}

@Injectable({ providedIn: 'root' })
export class GithubDataService {
  private config!: GithubConfig;
  private baseUrl = 'https://api.github.com';

  // In-memory cache degli SHA dei file (necessario per aggiornamenti)
  private shaCache: Record<string, string> = {};

  constructor(private http: HttpClient) {}

  configure(cfg: GithubConfig) {
    this.config = cfg;
  }

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `token ${this.config.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    });
  }

  private fileUrl(path: string): string {
    return `${this.baseUrl}/repos/${this.config.owner}/${this.config.repo}/contents/${path}`;
  }

  // ── Legge un file dal repo ──────────────────────────────────
  async readFile(path: string): Promise<string> {
    const url = `${this.fileUrl(path)}?ref=${this.config.branch}&t=${Date.now()}`;
    const res: any = await firstValueFrom(this.http.get(url, { headers: this.headers }));
    this.shaCache[path] = res.sha;
    return atob(res.content.replace(/\n/g, ''));
  }

  // ── Scrive un file nel repo ─────────────────────────────────
  async writeFile(path: string, content: string, message: string): Promise<void> {
    const sha = this.shaCache[path];
    const body: any = {
      message,
      content: btoa(unescape(encodeURIComponent(content))),
      branch: this.config.branch
    };
    if (sha) body.sha = sha;
    const res: any = await firstValueFrom(
      this.http.put(this.fileUrl(path), body, { headers: this.headers })
    );
    this.shaCache[path] = res.content.sha;
  }

  // ── CSV Helpers ─────────────────────────────────────────────
  private parseCsv<T>(csv: string): T[] {
    const lines = csv.trim().split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = this.parseCsvLine(line);
      const obj: any = {};
      headers.forEach((h, i) => {
        const val = values[i] ?? '';
        // Conversione tipi automatica
        if (val === 'true') obj[h.trim()] = true;
        else if (val === 'false') obj[h.trim()] = false;
        else if (val !== '' && !isNaN(Number(val)) && !val.includes('-')) obj[h.trim()] = Number(val);
        else obj[h.trim()] = val;
      });
      return obj as T;
    });
  }

  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      if (line[i] === '"') { inQuotes = !inQuotes; continue; }
      if (line[i] === ',' && !inQuotes) { result.push(current); current = ''; continue; }
      current += line[i];
    }
    result.push(current);
    return result;
  }

  private toCsv<T extends Record<string, any>>(items: T[], headers: string[]): string {
    const escape = (v: any): string => {
      const s = String(v ?? '');
      return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const rows = items.map(item => headers.map(h => escape(item[h])).join(','));
    return [headers.join(','), ...rows].join('\n') + '\n';
  }

  private uid(): string {
    return '_' + Math.random().toString(36).slice(2, 9);
  }

  // ══════════════════════════════════════════════════════════════
  // USERS
  // ══════════════════════════════════════════════════════════════
  async getUsers(): Promise<User[]> {
    const csv = await this.readFile('data/users.csv');
    return this.parseCsv<User>(csv);
  }

  async saveUsers(users: User[]): Promise<void> {
    const headers = ['id', 'name', 'email', 'role', 'active'];
    await this.writeFile('data/users.csv', this.toCsv(users, headers), 'Update users');
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    const users = await this.getUsers();
    const newUser: User = { ...user, id: this.uid() } as User;
    users.push(newUser);
    await this.saveUsers(users);
    return newUser;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const users = await this.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx >= 0) { users[idx] = { ...users[idx], ...updates }; await this.saveUsers(users); }
  }

  // ══════════════════════════════════════════════════════════════
  // PROJECTS
  // ══════════════════════════════════════════════════════════════
  async getProjects(): Promise<Project[]> {
    const [csv, tasksCsv] = await Promise.all([
      this.readFile('data/projects.csv'),
      this.readFile('data/tasks.csv').catch(() => '')
    ]);
    const projects = this.parseCsv<Project>(csv);
    const allTasks = tasksCsv ? this.parseCsv<Task>(tasksCsv) : [];

    const TOTAL_TASKS = 7; // REQUISITI, TEMPI E STIME, SVILUPPO, COLLAUDO LDT, COLLAUDO BU, PRODUZIONE, ADOPTION

    return projects.map(p => {
      const projectTasks = allTasks.filter(t => t.projectId === p.id);
      let completamento: number;
      if (projectTasks.length > 0) {
        const completed = projectTasks.filter(t => t.stato === 'Completato').length;
        completamento = Math.round((completed / TOTAL_TASKS) * 100);
      } else {
        completamento = Number(p.completamento) || 0;
      }
      return { ...p, completamento };
    });
  }

  async saveProjects(projects: Project[]): Promise<void> {
    const headers = ['id','nome','descrizione','tipologia','area','businessUnit','fornitore','owner','stato','dataInizio','dataFine','documentazione','priorita','repositoryUrl'];
    await this.writeFile('data/projects.csv', this.toCsv(projects, headers), 'Update projects');
  }

  async createProject(project: Omit<Project, 'id'>): Promise<Project> {
    const projects = await this.getProjects();
    const newProject: Project = { ...project, id: this.uid() } as Project;
    projects.push(newProject);
    await this.saveProjects(projects);
    return newProject;
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<void> {
    const projects = await this.getProjects();
    const idx = projects.findIndex(p => p.id === id);
    if (idx >= 0) { projects[idx] = { ...projects[idx], ...updates }; await this.saveProjects(projects); }
  }

  async deleteProject(id: string): Promise<void> {
    const [projects, tasks, checklist, tickets] = await Promise.all([
      this.getProjects(), this.getTasks(), this.getChecklist(), this.getTickets()
    ]);
    await Promise.all([
      this.saveProjects(projects.filter(p => p.id !== id)),
      this.saveTasks(tasks.filter(t => t.projectId !== id)),
      this.saveChecklist(checklist.filter(c => c.projectId !== id)),
      this.saveTickets(tickets.filter(t => t.projectId !== id)),
    ]);
  }

  // ══════════════════════════════════════════════════════════════
  // TASKS
  // ══════════════════════════════════════════════════════════════
  async getTasks(projectId?: string): Promise<Task[]> {
    const csv = await this.readFile('data/tasks.csv');
    const all = this.parseCsv<Task>(csv);
    return projectId ? all.filter(t => t.projectId === projectId) : all;
  }

  async saveTasks(tasks: Task[]): Promise<void> {
    const headers = ['id','nome','dataInizio','dataFine','stato','projectId','settimaneStimate'];
    await this.writeFile('data/tasks.csv', this.toCsv(tasks, headers), 'Update tasks');
  }

  async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    const tasks = await this.getTasks();
    const newTask: Task = { ...task, id: this.uid() };
    tasks.push(newTask);
    await this.saveTasks(tasks);
    return newTask;
  }

  async updateTask(id: string, updates: Partial<Task>): Promise<void> {
    const tasks = await this.getTasks();
    const idx = tasks.findIndex(t => t.id === id);
    if (idx >= 0) { tasks[idx] = { ...tasks[idx], ...updates }; await this.saveTasks(tasks); }
  }

  async deleteTask(id: string): Promise<void> {
    const tasks = await this.getTasks();
    await this.saveTasks(tasks.filter(t => t.id !== id));
  }

  // ══════════════════════════════════════════════════════════════
  // CHECKLIST
  // ══════════════════════════════════════════════════════════════
  async getChecklist(projectId?: string): Promise<ChecklistItem[]> {
    const csv = await this.readFile('data/checklist.csv');
    const all = this.parseCsv<ChecklistItem>(csv);
    return projectId ? all.filter(c => c.projectId === projectId) : all;
  }

  async saveChecklist(items: ChecklistItem[]): Promise<void> {
    const headers = ['id','documento','completato','linkUrl','projectId','nonNecessario'];
    await this.writeFile('data/checklist.csv', this.toCsv(items, headers), 'Update checklist');
  }

  async upsertChecklistItem(item: Omit<ChecklistItem, 'id'> & { id?: string }): Promise<void> {
    const all = await this.getChecklist();
    const idx = all.findIndex(c => c.projectId === item.projectId && c.documento === item.documento);
    const base = idx >= 0 ? all[idx] : { nonNecessario: false };
    const full: ChecklistItem = { ...base, id: item.id || (idx >= 0 ? all[idx].id : this.uid()), ...item };
    if (idx >= 0) { all[idx] = full; }
    else { all.push(full); }
    await this.saveChecklist(all);
  }

  // ══════════════════════════════════════════════════════════════
  // TICKETS
  // ══════════════════════════════════════════════════════════════
  async getTickets(projectId?: string): Promise<Ticket[]> {
    const csv = await this.readFile('data/tickets.csv');
    const all = this.parseCsv<Ticket>(csv);
    return projectId ? all.filter(t => t.projectId === projectId) : all;
  }

  async saveTickets(tickets: Ticket[]): Promise<void> {
    const headers = ['id','titolo','descrizione','stato','priorita','riferimentoSD','dataApertura','dataChiusura','note','projectId'];
    await this.writeFile('data/tickets.csv', this.toCsv(tickets, headers), 'Update tickets');
  }

  async createTicket(ticket: Omit<Ticket, 'id'>): Promise<Ticket> {
    const tickets = await this.getTickets();
    const newTicket: Ticket = { ...ticket, id: this.uid() };
    tickets.push(newTicket);
    await this.saveTickets(tickets);
    return newTicket;
  }

  async updateTicket(id: string, updates: Partial<Ticket>): Promise<void> {
    const tickets = await this.getTickets();
    const idx = tickets.findIndex(t => t.id === id);
    if (idx >= 0) { tickets[idx] = { ...tickets[idx], ...updates }; await this.saveTickets(tickets); }
  }

  async deleteTicket(id: string): Promise<void> {
    const tickets = await this.getTickets();
    await this.saveTickets(tickets.filter(t => t.id !== id));
  }

  // ══════════════════════════════════════════════════════════════
  // CONFIG
  // ══════════════════════════════════════════════════════════════
  async getConfig(): Promise<AppConfig> {
    const json = await this.readFile('data/config.json');
    return JSON.parse(json);
  }

  async saveConfig(config: AppConfig): Promise<void> {
    await this.writeFile('data/config.json', JSON.stringify(config, null, 2), 'Update config');
  }

  // ══════════════════════════════════════════════════════════════
  // SUBTASKS
  // ══════════════════════════════════════════════════════════════
  async getSubTasks(taskId?: string, projectId?: string): Promise<any[]> {
    try {
      const csv = await this.readFile('data/subtasks.csv');
      const all = this.parseCsv<any>(csv);
      if (taskId) return all.filter((s: any) => s.taskId === taskId);
      if (projectId) return all.filter((s: any) => s.projectId === projectId);
      return all;
    } catch { return []; }
  }

  async saveSubTasks(subtasks: any[]): Promise<void> {
    const headers = ['id','nome','dataInizio','dataFine','owner','stato','taskId','projectId'];
    await this.writeFile('data/subtasks.csv', this.toCsv(subtasks, headers), 'Update subtasks');
  }

  async createSubTask(s: any): Promise<any> {
    const all = await this.getSubTasks();
    const ns = { ...s, id: this.uid() };
    all.push(ns);
    await this.saveSubTasks(all);
    return ns;
  }

  async updateSubTask(id: string, updates: any): Promise<void> {
    const all = await this.getSubTasks();
    const idx = all.findIndex((s: any) => s.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updates };
      await this.saveSubTasks(all);
    }
  }

  async deleteSubTask(id: string): Promise<void> {
    const all = await this.getSubTasks();
    await this.saveSubTasks(all.filter((s: any) => s.id !== id));
  }

  // ══════════════════════════════════════════════════════════════
  // TASK FISSI — inizializzazione alla creazione progetto
  // ══════════════════════════════════════════════════════════════
  async initProjectTasks(projectId: string, dataInizioProgetto: string, settimaneMap?: Record<string, number>): Promise<void> {
    const SEQUENCE = ['REQUISITI','TEMPI E STIME','SVILUPPO','COLLAUDO LDT','COLLAUDO BU','PRODUZIONE','ADOPTION'];
    const DEFAULT_SETTIMANE: Record<string, number> = {
      'REQUISITI': 1, 'TEMPI E STIME': 1, 'SVILUPPO': 2,
      'COLLAUDO LDT': 1, 'COLLAUDO BU': 1, 'PRODUZIONE': 2, 'ADOPTION': 1
    };
    const allTasks = await this.getTasks();
    const existing = allTasks.filter(t => t.projectId === projectId);
    if (existing.length > 0) return;
    const newTasks = SEQUENCE.map((nome, i) => ({
      id: this.uid(),
      nome,
      dataInizio: i === 0 ? dataInizioProgetto : '',
      dataFine: '',
      stato: 'Da fare',
      projectId,
      settimaneStimate: settimaneMap?.[nome] ?? DEFAULT_SETTIMANE[nome] ?? 1,
    }));
    const updated = [...allTasks, ...newTasks];
    const headers = ['id','nome','dataInizio','dataFine','stato','projectId','settimaneStimate'];
    await this.writeFile('data/tasks.csv', this.toCsv(updated, headers), 'Init tasks for project ' + projectId);
  }

  // ══════════════════════════════════════════════════════════════
  // TASK — aggiornamento con logica a cascata
  // ══════════════════════════════════════════════════════════════
  async updateTaskWithCascade(id: string, updates: any, allProjectTasks: Task[]): Promise<Task[]> {
    const SEQUENCE = ['REQUISITI','TEMPI E STIME','SVILUPPO','COLLAUDO LDT','COLLAUDO BU','PRODUZIONE','ADOPTION'];
    const allTasks = await this.getTasks();
    const idx = allTasks.findIndex(t => t.id === id);
    if (idx < 0) return allProjectTasks;

    allTasks[idx] = { ...allTasks[idx], ...updates };
    const updatedTask = allTasks[idx];

    const taskIdx = SEQUENCE.indexOf(updatedTask.nome);
    if (taskIdx >= 0 && taskIdx < SEQUENCE.length - 1 && updatedTask.dataFine) {
      const nextNome = SEQUENCE[taskIdx + 1];
      const nextIdx = allTasks.findIndex(
        t => t.projectId === updatedTask.projectId && t.nome === nextNome
      );
      if (nextIdx >= 0) {
        const nextDate = new Date(updatedTask.dataFine);
        nextDate.setDate(nextDate.getDate() + 1);
        allTasks[nextIdx].dataInizio = nextDate.toISOString().split('T')[0];
      }
    }

    const headers = ['id','nome','dataInizio','dataFine','stato','projectId','settimaneStimate'];
    await this.writeFile('data/tasks.csv', this.toCsv(allTasks, headers), 'Update task ' + updatedTask.nome);
    return allTasks.filter(t => t.projectId === updatedTask.projectId);
  }

  // ── RICHIESTE ────────────────────────────────────────────────────
  private richiesteHeaders = ['id','titolo','descrizione','buRiferimento','progettoRiferimento',
    'richiedenteId','stato','note','dataCreazione','dataEsito','gestitaId','progettoCreato'];

  async getRichieste(): Promise<Richiesta[]> {
    try {
      const csv = await this.readFile('data/richieste.csv');
      return this.parseCsv<Richiesta>(csv);
    } catch { return []; }
  }

  async saveRichieste(richieste: Richiesta[]): Promise<void> {
    await this.writeFile('data/richieste.csv', this.toCsv(richieste, this.richiesteHeaders), 'Update richieste');
  }

  async createRichiesta(r: Omit<Richiesta, 'id'>): Promise<Richiesta> {
    const all = await this.getRichieste();
    const newR: Richiesta = { ...r as any, id: 'req-' + Date.now() };
    all.push(newR);
    await this.saveRichieste(all);
    return newR;
  }

  async updateRichiesta(id: string, updates: Partial<Richiesta>): Promise<void> {
    const all = await this.getRichieste();
    const idx = all.findIndex(r => r.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...updates }; await this.saveRichieste(all); }
  }

  async accettaRichiesta(id: string, gestitaId: string, projects: Project[], users: User[], config: AppConfig, ownerOverride?: string, documentazione: 'parziale' | 'non necessaria' = 'parziale', settimaneMap?: Record<string, number>): Promise<Project> {
    const all = await this.getRichieste();
    const r = all.find(r => r.id === id)!;

    // Costruisci descrizione: progetto di riferimento + descrizione richiesta
    let desc = r.descrizione;
    if (r.progettoRiferimento) {
      const pRif = projects.find(p => p.id === r.progettoRiferimento);
      if (pRif) desc = `[Rif: ${pRif.nome}] ${desc}`;
    }

    const today = new Date().toISOString().split('T')[0];
    const newProject = await this.createProject({
      nome: r.titolo,
      descrizione: desc,
      tipologia: config.tipologie[0] || '',
      area: '',
      businessUnit: r.buRiferimento,
      fornitore: '',
      owner: ownerOverride || gestitaId,
      stato: 'Pianificazione',
      dataInizio: today,
      dataFine: '',
      completamento: 0,
      documentazione,
      priorita: 'Media',
      repositoryUrl: '',
    });

    // Crea automaticamente tutti i task della sequenza
    await this.initProjectTasks(newProject.id, today, settimaneMap);

    const idx = all.findIndex(r => r.id === id);
    all[idx] = { ...all[idx], stato: 'Accettata', dataEsito: today, gestitaId, progettoCreato: newProject.id };
    await this.saveRichieste(all);
    return newProject;
  }

  async respingiRichiesta(id: string, gestitaId: string, note: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.updateRichiesta(id, { stato: 'Respinta', note, dataEsito: today, gestitaId });
  }

  // ── ACTIVITY LOG ─────────────────────────────────────────────────
  private logHeaders = ['id','timestamp','userId','action','entityType','entityId','entityName',
    'projectId','projectName','field','oldValue','newValue','note'];

  async getLogs(limit = 200): Promise<ActivityLog[]> {
    try {
      const csv = await this.readFile('data/activity_log.csv');
      const all = this.parseCsv<ActivityLog>(csv);
      return all.sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, limit);
    } catch { return []; }
  }

  async addLog(entry: Omit<ActivityLog, 'id'>): Promise<void> {
    try {
      const all = await this.getLogs(500);
      const log: ActivityLog = { ...entry as any, id: 'log-' + Date.now() };
      all.unshift(log);
      // Mantieni solo gli ultimi 500 log
      await this.writeFile('data/activity_log.csv',
        this.toCsv(all.slice(0, 500), this.logHeaders), 'Activity log');
    } catch { /* non bloccare l'operazione principale */ }
  }

  // Helper per loggare facilmente
  async logAction(params: {
    userId: string;
    action: ActivityLog['action'];
    entityType: ActivityLog['entityType'];
    entityId: string;
    entityName: string;
    projectId?: string;
    projectName?: string;
    field?: string;
    oldValue?: string;
    newValue?: string;
    note?: string;
  }): Promise<void> {
    await this.addLog({
      timestamp: new Date().toISOString(),
      userId: params.userId,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      entityName: params.entityName,
      projectId: params.projectId || '',
      projectName: params.projectName || '',
      field: params.field || '',
      oldValue: params.oldValue || '',
      newValue: params.newValue || '',
      note: params.note || '',
    });
  }
}
