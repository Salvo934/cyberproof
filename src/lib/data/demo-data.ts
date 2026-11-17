import type { AppData, Evidence, Organization, SecurityControl } from "@/lib/models/types";

/**
 * Dati dimostrativi, interamente fittizi.
 *
 * I 10 controlli sono esempi didattici: NON costituiscono una checklist
 * completa né ufficiale degli obblighi NIS2. I riferimenti normativi indicano
 * l'area della Direttiva (UE) 2022/2555 e del D.Lgs. 138/2024 a cui il
 * controllo è ricondotto in modo indicativo, e vanno sempre verificati sulle
 * fonti ufficiali.
 */

const SEED_TIMESTAMP = "2026-11-01T09:00:00.000Z";

export const DEMO_ORGANIZATION: Organization = {
  id: "org_demo",
  name: "Azienda Demo S.r.l.",
  sector: "Trasporti e logistica (esempio)",
  nis2Classification: "importante",
  isDemo: true,
};

type SeedControl = Omit<SecurityControl, "createdAt" | "updatedAt">;

const seedControls: SeedControl[] = [
  {
    id: "ctrl_gov_01",
    code: "CP-GOV-01",
    name: "Politica di sicurezza e analisi dei rischi",
    category: "governance",
    description:
      "Politica di sicurezza dei sistemi informativi approvata dalla direzione e analisi dei rischi aggiornata almeno annualmente.",
    regulatoryReferences: [
      {
        source: "direttiva_ue_2022_2555",
        article: "Art. 21, par. 2, lett. a)",
        summary: "Politiche di analisi dei rischi e di sicurezza dei sistemi informatici",
      },
      {
        source: "dlgs_138_2024",
        article: "Art. 24",
        summary: "Misure di gestione dei rischi per la sicurezza informatica",
      },
    ],
    status: "documentato",
    implementation: "attuata",
    owner: "Direzione / CISO esterno",
    lastVerifiedAt: "2026-09-15",
  },
  {
    id: "ctrl_acc_01",
    code: "CP-ACC-01",
    name: "Gestione delle utenze e dei privilegi",
    category: "gestione_accessi",
    description:
      "Processo di creazione, modifica e revoca delle utenze, con revisione periodica dei privilegi amministrativi secondo il principio del minimo privilegio.",
    regulatoryReferences: [
      {
        source: "direttiva_ue_2022_2555",
        article: "Art. 21, par. 2, lett. i)",
        summary: "Sicurezza delle risorse umane, controllo dell'accesso e gestione degli attivi",
      },
    ],
    status: "documentato",
    implementation: "attuata",
    owner: "Responsabile IT",
    lastVerifiedAt: "2026-10-02",
  },
  {
    id: "ctrl_acc_02",
    code: "CP-ACC-02",
    name: "Autenticazione a più fattori",
    category: "gestione_accessi",
    description:
      "Autenticazione a più fattori per accessi remoti, posta elettronica e account amministrativi.",
    regulatoryReferences: [
      {
        source: "direttiva_ue_2022_2555",
        article: "Art. 21, par. 2, lett. j)",
        summary: "Autenticazione a più fattori e comunicazioni protette",
      },
    ],
    status: "in_lavorazione",
    implementation: "parziale",
    owner: "Responsabile IT",
    lastVerifiedAt: null,
  },
  {
    id: "ctrl_bck_01",
    code: "CP-BCK-01",
    name: "Backup periodici e test di ripristino",
    category: "backup_continuita",
    description:
      "Backup dei sistemi critici con copia offline o immutabile e test di ripristino documentati con cadenza almeno annuale.",
    regulatoryReferences: [
      {
        source: "direttiva_ue_2022_2555",
        article: "Art. 21, par. 2, lett. c)",
        summary: "Continuità operativa, gestione dei backup e ripristino in caso di disastro",
      },
    ],
    status: "da_verificare",
    implementation: "attuata",
    owner: "Amministratore di sistema",
    lastVerifiedAt: "2025-10-20",
  },
  {
    id: "ctrl_log_01",
    code: "CP-LOG-01",
    name: "Raccolta e conservazione dei log di sicurezza",
    category: "logging_monitoraggio",
    description:
      "Raccolta centralizzata dei log di autenticazione e dei sistemi critici, con periodo di conservazione definito e accesso ristretto.",
    regulatoryReferences: [
      {
        source: "direttiva_ue_2022_2555",
        article: "Art. 21, par. 2, lett. b)",
        summary: "Gestione degli incidenti (mappatura indicativa: i log supportano rilevamento e analisi)",
      },
    ],
    status: "in_lavorazione",
    implementation: "parziale",
    owner: "Responsabile IT",
    lastVerifiedAt: null,
  },
  {
    id: "ctrl_inc_01",
    code: "CP-INC-01",
    name: "Procedura di gestione e notifica degli incidenti",
    category: "gestione_incidenti",
    description:
      "Procedura che definisce ruoli, classificazione degli incidenti, escalation e tempistiche di notifica al CSIRT Italia.",
    regulatoryReferences: [
      {
        source: "direttiva_ue_2022_2555",
        article: "Art. 21, par. 2, lett. b)",
        summary: "Gestione degli incidenti",
      },
      {
        source: "direttiva_ue_2022_2555",
        article: "Art. 23",
        summary: "Obblighi di segnalazione",
      },
      {
        source: "dlgs_138_2024",
        article: "Art. 25",
        summary: "Obblighi in materia di notifica di incidente",
      },
    ],
    status: "documentato",
    implementation: "attuata",
    owner: "Referente incident response",
    lastVerifiedAt: "2026-06-10",
  },
  {
    id: "ctrl_vul_01",
    code: "CP-VUL-01",
    name: "Gestione delle vulnerabilità e patch management",
    category: "gestione_vulnerabilita",
    description:
      "Scansioni periodiche delle vulnerabilità, prioritizzazione in base alla criticità e applicazione delle patch entro tempi definiti.",
    regulatoryReferences: [
      {
        source: "direttiva_ue_2022_2555",
        article: "Art. 21, par. 2, lett. e)",
        summary: "Sicurezza dell'acquisizione, sviluppo e manutenzione, incluse gestione e divulgazione delle vulnerabilità",
      },
    ],
    status: "in_lavorazione",
    implementation: "parziale",
    owner: "Amministratore di sistema",
    lastVerifiedAt: null,
  },
  {
    id: "ctrl_for_01",
    code: "CP-FOR-01",
    name: "Formazione periodica sulla sicurezza",
    category: "formazione",
    description:
      "Programma annuale di formazione e sensibilizzazione per dipendenti e organi di gestione, con registro delle presenze.",
    regulatoryReferences: [
      {
        source: "direttiva_ue_2022_2555",
        article: "Art. 21, par. 2, lett. g)",
        summary: "Pratiche di igiene informatica di base e formazione",
      },
      {
        source: "direttiva_ue_2022_2555",
        article: "Art. 20, par. 2",
        summary: "Formazione dei membri degli organi di gestione",
      },
    ],
    status: "da_verificare",
    implementation: "attuata",
    owner: "Ufficio HR",
    lastVerifiedAt: "2025-12-05",
  },
  {
    id: "ctrl_sup_01",
    code: "CP-SUP-01",
    name: "Valutazione della sicurezza dei fornitori ICT",
    category: "fornitori",
    description:
      "Censimento dei fornitori ICT critici e valutazione dei requisiti di sicurezza nei contratti.",
    regulatoryReferences: [
      {
        source: "direttiva_ue_2022_2555",
        article: "Art. 21, par. 2, lett. d)",
        summary: "Sicurezza della catena di approvvigionamento",
      },
    ],
    status: "da_valutare",
    implementation: "non_definita",
    owner: "Ufficio acquisti",
    lastVerifiedAt: null,
  },
  {
    id: "ctrl_cry_01",
    code: "CP-CRY-01",
    name: "Cifratura dei dispositivi e dei dati",
    category: "crittografia",
    description:
      "Cifratura dei dischi dei dispositivi portatili e dei supporti rimovibili, con gestione documentata delle chiavi di ripristino.",
    regulatoryReferences: [
      {
        source: "direttiva_ue_2022_2555",
        article: "Art. 21, par. 2, lett. h)",
        summary: "Politiche e procedure relative all'uso della crittografia e della cifratura",
      },
    ],
    status: "da_valutare",
    implementation: "pianificata",
    owner: "Responsabile IT",
    lastVerifiedAt: null,
  },
];

type SeedEvidence = Omit<Evidence, "createdAt" | "updatedAt">;

const DEMO_REPO = "Repository documentale demo";

const seedEvidences: SeedEvidence[] = [
  {
    id: "evd_001",
    controlId: "ctrl_gov_01",
    title: "Politica di sicurezza delle informazioni v1.2",
    description: "Documento di politica approvato dal consiglio di amministrazione.",
    documentType: "policy",
    collectedAt: "2026-03-12",
    owner: "Direzione / CISO esterno",
    notes: "Documento fittizio a scopo dimostrativo.",
    reference: { kind: "riferimento_esterno", location: `${DEMO_REPO} › ISMS/01-Policy/Politica-sicurezza-v1.2` },
  },
  {
    id: "evd_002",
    controlId: "ctrl_gov_01",
    title: "Verbale di riesame dell'analisi dei rischi 2026",
    description: "Verbale della riunione di riesame annuale dei rischi.",
    documentType: "verbale",
    collectedAt: "2026-09-15",
    owner: "Direzione / CISO esterno",
    notes: "",
    reference: { kind: "riferimento_esterno", location: `${DEMO_REPO} › ISMS/02-Rischi/Verbale-riesame-2026` },
  },
  {
    id: "evd_003",
    controlId: "ctrl_acc_01",
    title: "Procedura di gestione delle utenze",
    description: "Procedura per provisioning, modifica e revoca degli account.",
    documentType: "procedura",
    collectedAt: "2026-02-20",
    owner: "Responsabile IT",
    notes: "",
    reference: { kind: "riferimento_esterno", location: `${DEMO_REPO} › ISMS/03-Procedure/Gestione-utenze` },
  },
  {
    id: "evd_004",
    controlId: "ctrl_acc_01",
    title: "Revisione trimestrale dei privilegi – Q3 2026",
    description: "Esito della revisione degli account con privilegi amministrativi.",
    documentType: "report_tecnico",
    collectedAt: "2026-10-02",
    owner: "Responsabile IT",
    notes: "Rimossi 3 account amministrativi non più necessari (dato fittizio).",
    reference: { kind: "riferimento_esterno", location: `${DEMO_REPO} › Evidenze/Accessi/Revisione-privilegi-Q3-2026` },
  },
  {
    id: "evd_005",
    controlId: "ctrl_bck_01",
    title: "Report test di ripristino 2025",
    description: "Esito del test di ripristino del server gestionale.",
    documentType: "report_tecnico",
    collectedAt: "2025-10-20",
    owner: "Amministratore di sistema",
    notes: "Test da ripetere: ultima esecuzione oltre 12 mesi fa.",
    reference: { kind: "riferimento_esterno", location: `${DEMO_REPO} › Evidenze/Backup/Test-ripristino-2025` },
  },
  {
    id: "evd_006",
    controlId: "ctrl_inc_01",
    title: "Procedura di incident response v2.0",
    description: "Procedura con matrice di escalation e modelli di notifica.",
    documentType: "procedura",
    collectedAt: "2026-06-10",
    owner: "Referente incident response",
    notes: "",
    reference: { kind: "riferimento_esterno", location: `${DEMO_REPO} › ISMS/03-Procedure/Incident-response-v2.0` },
  },
  {
    id: "evd_007",
    controlId: "ctrl_for_01",
    title: "Registro presenze formazione 2025",
    description: "Elenco dei partecipanti alla sessione annuale di sensibilizzazione.",
    documentType: "registro",
    collectedAt: "2025-12-05",
    owner: "Ufficio HR",
    notes: "",
    reference: null,
  },
];

/** Restituisce una copia nuova e indipendente del dataset dimostrativo. */
export function createDemoData(): AppData {
  return {
    schemaVersion: 1,
    organization: { ...DEMO_ORGANIZATION },
    controls: seedControls.map((c) => ({
      ...c,
      regulatoryReferences: c.regulatoryReferences.map((r) => ({ ...r })),
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    })),
    evidences: seedEvidences.map((e) => ({
      ...e,
      reference: e.reference ? { ...e.reference } : null,
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    })),
  };
}
