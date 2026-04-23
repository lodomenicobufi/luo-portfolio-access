// src/app/components/config/config.component.ts
import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GithubDataService } from '../../core/services/github-data.service';
import { AppConfig } from '../../core/models';

interface ConfigField { key: keyof AppConfig; label: string; hint: string; }

@Component({
  selector: 'app-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-hdr">
        <div>
          <div class="page-title">Configurazione</div>
          <div class="page-sub">Valori dei campi configurabili — salvati in data/config.json nel repository</div>
        </div>
      </div>
      <div class="info-banner">Le modifiche vengono salvate immediatamente nel file <strong>data/config.json</strong> del repository GitHub e sono condivise con tutti gli utenti.</div>

      @if (loading()) {
        <div class="loading-full"><span class="spinner"></span></div>
      } @else {
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
          @for (field of fields; track field.key) {
            <div class="card">
              <div style="margin-bottom:4px;display:flex;align-items:center;justify-content:space-between">
                <span class="card-title">{{ field.label }}</span>
                @if (saving() === field.key) { <span class="spinner" style="width:14px;height:14px"></span> }
              </div>
              <p style="font-size:11px;color:var(--gray-400);margin-bottom:10px">{{ field.hint }}</p>
              <div style="display:flex;flex-wrap:wrap;margin-bottom:12px;min-height:28px">
                @for (v of config()![field.key]; track v) {
                  <span class="ctag">{{ v }}<button (click)="removeItem(field.key, v)">×</button></span>
                }
                @if (!config()![field.key].length) {
                  <span style="font-size:12px;color:var(--gray-400)">Nessun valore</span>
                }
              </div>
              <div style="display:flex;gap:6px">
                <input class="fi" style="flex:1" placeholder="Aggiungi valore..."
                  [(ngModel)]="newVals[field.key]"
                  (keydown.enter)="addItem(field.key)"/>
                <button class="btn btn-p btn-sm" (click)="addItem(field.key)" [disabled]="!!saving()">+</button>
              </div>
            </div>
          }
        </div>
      }
      @if (toast()) { <div class="toast ok">{{ toast() }}</div> }
    </div>
  `,
  styles: [`
    .ctag { display:inline-flex; align-items:center; gap:6px; background:var(--gray-100); border-radius:4px; padding:4px 10px; font-size:12px; font-weight:500; margin:3px; }
    .ctag button { background:none; border:none; cursor:pointer; color:var(--gray-400); font-size:15px; line-height:1; }
    .ctag button:hover { color:var(--danger); }
  `]
})
export class ConfigComponent implements OnInit {
  db = inject(GithubDataService);
  loading = signal(true);
  saving = signal<string>('');
  config = signal<AppConfig | null>(null);
  toast = signal('');
  newVals: Partial<Record<keyof AppConfig, string>> = {};

  fields: ConfigField[] = [
    { key:'tipologie',    label:'Tipologie Progetto',          hint:'Categorizza i progetti per tipo' },
    { key:'aree',         label:'Aree di Riferimento',         hint:'Aree organizzative coinvolte' },
    { key:'businessUnits',label:'Business Unit',               hint:'Business Unit aziendali' },
    { key:'fornitori',    label:'Fornitori',                   hint:'Fornitori e partner esterni' },
    { key:'statiProgetto',label:'Stati Progetto',              hint:'Workflow stati del progetto' },
    { key:'statiTask',    label:'Stati Task',                  hint:'Workflow stati dei task' },
    { key:'priorita',     label:'Livelli di Priorità',         hint:'Priorità per progetti e ticket' },
    { key:'statiTicket',  label:'Stati Ticket Service Desk',   hint:'Workflow stati dei ticket' },
    { key:'docFields',    label:'Checklist Documenti',         hint:'Documenti nella checklist progetto' },
  ];

  ngOnInit() { this.load(); }

  async load() {
    this.loading.set(true);
    this.config.set(await this.db.getConfig());
    this.loading.set(false);
  }

  async addItem(key: keyof AppConfig) {
    const v = (this.newVals[key] || '').trim();
    const cfg = this.config();
    if (!v || !cfg || (cfg[key] as string[]).includes(v)) return;
    this.saving.set(key);
    const updated = { ...cfg, [key]: [...(cfg[key] as string[]), v] };
    await this.db.saveConfig(updated);
    this.config.set(updated);
    this.newVals[key] = '';
    this.saving.set('');
    this.showToast('Valore aggiunto');
  }

  async removeItem(key: keyof AppConfig, val: string) {
    if (!confirm(`Rimuovere "${val}"?`)) return;
    const cfg = this.config()!;
    this.saving.set(key);
    const updated = { ...cfg, [key]: (cfg[key] as string[]).filter(v => v !== val) };
    await this.db.saveConfig(updated);
    this.config.set(updated);
    this.saving.set('');
    this.showToast('Valore rimosso');
  }

  showToast(msg: string) { this.toast.set(msg); setTimeout(() => this.toast.set(''), 3000); }
}
