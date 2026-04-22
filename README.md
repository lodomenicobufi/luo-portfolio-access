# luo-portfolio-access

**LUO Portfolio Progetti** — versione GitHub Pages con Angular frontend e CSV come database.

## Stack
- **Frontend**: Angular 17 (TypeScript, standalone components)
- **Database**: File CSV nel repository (`data/`)
- **Hosting**: GitHub Pages (automatico via GitHub Actions)
- **Auth**: GitHub Personal Access Token + email

## Avvio locale

```bash
cd frontend
npm install
ng serve
```

App disponibile su: http://localhost:4200

## Deploy online

Push su `main` → GitHub Actions compila e deploya automaticamente su GitHub Pages.

URL: `https://[username].github.io/luo-portfolio-access/`

## Struttura dati

| File | Contenuto |
|------|-----------|
| `data/users.csv` | Utenti e ruoli |
| `data/projects.csv` | Anagrafica progetti |
| `data/tasks.csv` | Task interni |
| `data/checklist.csv` | Checklist documenti |
| `data/tickets.csv` | Ticket Service Desk |
| `data/config.json` | Configurazione campi |

## Login

1. Inserisci la tua email (deve essere in `data/users.csv`)
2. Inserisci il tuo GitHub Personal Access Token (scope: `repo`)
3. Inserisci owner e nome del repository

---
*LUO — People and Tech*
