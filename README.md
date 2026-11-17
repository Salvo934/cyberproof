# CyberProof

MVP SaaS per la gestione e la documentazione delle misure di cybersecurity, predisposto per associare i controlli ai riferimenti normativi NIS2 (Direttiva (UE) 2022/2555, D.Lgs. 138/2024, misure di base ACN).

> CyberProof è uno strumento di supporto documentale. Non calcola né certifica la conformità normativa.

## Avvio locale

### 1. Progetto Supabase
1. Crea un progetto su [supabase.com](https://supabase.com) (il piano gratuito è sufficiente).
2. In **SQL Editor** esegui il contenuto di `supabase/migrations/0001_init.sql`: crea tabelle, policy RLS, trigger e il bucket privato `evidence-files`.
3. In **Authentication → URL Configuration** imposta:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`

### 2. Variabili d'ambiente
```bash
cp .env.example .env.local
```
Inserisci in `.env.local` il **Project URL** e la **publishable key** (Project Settings → API Keys). Non usare mai la service role key nel frontend.

### 3. Avvio
```bash
npm install
npm run dev
```
Apri http://localhost:3000, registrati e, a registro vuoto, usa **Carica dati demo** per i 10 controlli di esempio.

## Sicurezza

- **Row Level Security** su tutte le tabelle: ogni utente legge e modifica solo i dati della propria organizzazione (un'organizzazione per account, creata alla registrazione).
- **Documenti** in un bucket privato, con percorso `{organizzazione}/{controllo}/{evidenza}/{file}` e policy che limitano l'accesso alla cartella della propria organizzazione. Download solo tramite URL firmati validi 60 secondi.
- **Upload controllati**: PDF, immagini, TXT/CSV, Word, Excel, max 20 MB (verifica nel client e nel bucket). Per ogni file viene salvata l'impronta SHA-256.
- **Sessione** in cookie gestiti da `@supabase/ssr`; il proxy (`src/proxy.ts`) rinnova la sessione e protegge le rotte, ma la protezione dei dati è affidata alle policy del database.
- Redirect post-login limitati a percorsi interni (nessun open redirect).

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Lucide · Recharts · jsPDF · Supabase (Postgres, Auth, Storage).

## Struttura

```
src/
  app/                    Rotte app: /dashboard, /controls, /controls/[id], /reports
                          Rotte accesso: /login, /signup, /auth/*, /setup
  proxy.ts                Sessione e protezione delle rotte
supabase/migrations/      Schema SQL, policy RLS, bucket
  components/
    ui/                   Componenti shadcn/ui
    layout/               Shell, sidebar, header di pagina
    common/               Badge di stato, empty state, disclaimer
    controls/ dashboard/  Viste per funzionalità
  lib/
    models/               Tipi (Organization, SecurityControl, Evidence, ControlStatus) ed etichette
    data/                 Dati dimostrativi fittizi
    persistence/          Repository Supabase e archivio documenti (Storage)
    store/                Cache client dei dati e azioni (useSyncExternalStore)
    supabase/             Client browser/server e configurazione
    auth/                 Rotte protette, messaggi di errore, regole password
    domain/               Logica applicativa (CRUD, filtri, metriche, attività)
    report/               Modello del report e rendering PDF
```

## Modello concettuale

L'app tiene distinti quattro concetti:

| Concetto | Dove |
| --- | --- |
| Stato della documentazione | `SecurityControl.status` |
| Implementazione della misura (dichiarata) | `SecurityControl.implementation` |
| Verifica dell'efficacia | `SecurityControl.lastVerifiedAt` + evidenze |
| Conformità normativa | **non calcolata** |

I 10 controlli demo sono esempi e non costituiscono una checklist completa o ufficiale. DORA è prevista come estensione futura.

## Roadmap MVP

- [x] Step 1 — Struttura, layout, sidebar, design system, dati demo
- [x] Step 2 — Registro controlli con CRUD, ricerca, filtri e ordinamento
- [x] Step 3 — Gestione evidenze (metadati + riferimento al documento; upload sicuro predisposto, non attivo)
- [x] Step 4 — Dashboard collegata ai dati: KPI, distribuzione per stato, attività da attenzionare
- [x] Step 5 — Esportazione PDF (generata nel browser con jsPDF) e verifica dei flussi
- [x] Login (email e password, recupero password), database Supabase con RLS, upload sicuro dei documenti
