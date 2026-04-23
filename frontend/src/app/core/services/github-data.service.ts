// src/app/core/services/github-data.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { User, Project, Task, ChecklistItem, Ticket, AppConfig } from '../models';

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
    const csv = await this.readFile('data/projects.csv');
    return this.parseCsv<Project>(csv).map(p => ({
      ...p,
      completamento: Number(p.completamento) || 0
    }));
  }

  async saveProjects(projects: Project[]): Promise<void> {
    const headers = ['id','nome','descrizione','tipologia','area','businessUnit','fornitore','owner','stato','dataInizio','dataFine','completamento','documentazione','priorita','repositoryUrl'];
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
    const headers = ['id','nome','dataInizio','dataFine','stato','projectId'];
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
    const headers = ['id','documento','completato','linkUrl','projectId'];
    await this.writeFile('data/checklist.csv', this.toCsv(items, headers), 'Update checklist');
  }

  async upsertChecklistItem(item: Omit<ChecklistItem, 'id'> & { id?: string }): Promise<void> {
    const all = await this.getChecklist();
    const idx = all.findIndex(c => c.projectId === item.projectId && c.documento === item.documento);
    if (idx >= 0) { all[idx] = { ...all[idx], ...item } as ChecklistItem; }
    else { all.push({ ...item, id: this.uid() } as ChecklistItem); }
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

  async createSubTask(s: Omit<any,'id'>): Promise<any> {
    const all = await this.getSubTasks();
    const ns = { ...s, id: this.uid() };
    all.push(ns);
    await this.saveSubTasks(all);
    return ns;
  }

  async updateSubTask(id: string, updates: Partial<any>): Promise<void> {
    const all = await this.getSubTasks();
    const idx = all.findIndex((s: any) => s.id === id);
    if (idx >= 0) { all[idx] = { ...all[idx], ...updates }; await this.saveSubTasks(all); }
  }

  async deleteSubTask(id: string): Promise<void> {
    const all = await this.getSubTasks();
    await this.saveSubTasks(all.filter((s: any) => s.id !== id));
  }

  // ══════════════════════════════════════════════════════════════
  // TASK FISSI — inizializzazione alla creazione progetto
  // ══════════════════════════════════════════════════════════════
  async initProjectTasks(projectId: string, dataInizioProgetto: string): Promise<void> {
    const SEQUENCE = ['REQUISITI','TEMPI E STIME','SVILUPPO','COLLAUDO LDT','COLLAUDO BU','PRODUZIONE','ADOPTION'];
    const allTasks = await this.getTasks();
    // Se i task del progetto esistono già, non ricrearli
    const existing = allTasks.filter(t => t.projectId === projectId);
    if (existing.length > 0) return;
    // Crea solo REQUISITI con data inizio, gli altri vuoti
    const newTasks: Task[] = SEQUENCE.map((nome, i) => ({
      id: this.uid(),
      nome,
      dataInizio: i === 0 ? dataInizioProgetto : '',
      dataFine: '',
      stato: 'Da fare',
      projectId,
    }));
    const updated = [...allTasks, ...newTasks];
    const headers = ['id','nome','dataInizio','dataFine','stato','projectId'];
    await this.writeFile('data/tasks.csv', this.toCsv(updated, headers), `Init tasks for project ${projectId}`);
  }

  // ══════════════════════════════════════════════════════════════
  // TASK — aggiornamento con logica a cascata
  // ══════════════════════════════════════════════════════════════
  async updateTaskWithCascade(id: string, updates: Partial<Task>, allProjectTasks: Task[]): Promise<Task[]> {
    const SEQUENCE = ['REQUISITI','TEMPI E STIME','SVILUPPO','COLLAUDO LDT','COLLAUDO BU','PRODUZIONE','ADOPTION'];
    const allTasks = await this.getTasks();
    const idx = allTasks.findIndex(t => t.id === id);
    if (idx < 0) return allProjectTasks;

    allTasks[idx] = { ...allTasks[idx], ...updates };
    const updatedTask = allTasks[idx];

    // Logica cascata: se task completato + ha data fine → sblocca il successivo
    const taskIdx = SEQUENCE.indexOf(updatedTask.nome);
    if (
      taskIdx >= 0 &&
      taskIdx < SEQUENCE.length - 1 &&
      updatedTask.stato === 'Completato' &&
      updatedTask.dataFine
    ) {
      const nextNome = SEQUENCE[taskIdx + 1];
      const nextIdx = allTasks.findIndex(t => t.projectId === updatedTask.projectId && t.nome === nextNome);
      if (nextIdx >= 0 && allTasks[nextIdx].stato === 'Da fare' && !allTasks[nextIdx].dataInizio) {
        // Calcola dataInizio = dataFine del precedente + 1 giorno
        const nextDate = new Date(updatedTask.dataFine);
        nextDate.setDate(nextDate.getDate() + 1);
        allTasks[nextIdx].dataInizio = nextDate.toISOString().split('T')[0];
      }
    }

    const headers = ['id','nome','dataInizio','dataFine','stato','projectId'];
    await this.writeFile('data/tasks.csv', this.toCsv(allTasks, headers), `Update task ${updatedTask.nome}`);
    return allTasks.filter(t => t.projectId === updatedTask.projectId);
  }
