# CyberProof

MVP SaaS per la gestione e la documentazione delle misure di cybersecurity, predisposto per associare i controlli ai riferimenti normativi NIS2 (Direttiva (UE) 2022/2555, D.Lgs. 138/2024, misure di base ACN).

> CyberProof è uno strumento di supporto documentale. Non calcola né certifica la conformità normativa.

## Avvio locale

```bash
npm install
npm run dev
```

Apri http://localhost:3000 (reindirizza a `/dashboard`).

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Lucide · Recharts · jsPDF · LocalStorage (Supabase in una fase successiva).

## Struttura

```
src/
  app/                    Rotte: /dashboard, /controls, /controls/[id], /reports
  components/
    ui/                   Componenti shadcn/ui
    layout/               Shell, sidebar, header di pagina
    common/               Badge di stato, empty state, disclaimer
    controls/ dashboard/  Viste per funzionalità
  lib/
    models/               Tipi (Organization, SecurityControl, Evidence, ControlStatus) ed etichette
    data/                 Dati dimostrativi fittizi
    persistence/          Adapter LocalStorage (solo metadati, nessun documento)
    store/                Store client condiviso (useSyncExternalStore)
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
