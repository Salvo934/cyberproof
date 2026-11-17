import type { ControlCategory, RegulatoryReference } from "@/lib/models/types";

/**
 * Catalogo di controlli di sicurezza comuni, proposto come suggerimento nel
 * campo "Nome" per velocizzare la compilazione.
 *
 * NON è una checklist completa né ufficiale degli obblighi NIS2: è un elenco
 * di misure ricorrenti. I riferimenti indicano, in modo indicativo, l'area
 * dell'art. 21, par. 2 della Direttiva (UE) 2022/2555 (o dell'art. 20 per gli
 * organi di gestione) e vanno verificati sulle fonti ufficiali.
 */

export interface ControlTemplate {
  name: string;
  category: ControlCategory;
  description: string;
  regulatoryReferences: RegulatoryReference[];
}

const nis2 = (letter: string, summary: string): RegulatoryReference => ({
  source: "direttiva_ue_2022_2555",
  article: `Art. 21, par. 2, lett. ${letter})`,
  summary,
});

const REF = {
  a: nis2("a", "Politiche di analisi dei rischi e di sicurezza dei sistemi informatici"),
  b: nis2("b", "Gestione degli incidenti"),
  c: nis2("c", "Continuità operativa, gestione dei backup e ripristino in caso di disastro, gestione delle crisi"),
  d: nis2("d", "Sicurezza della catena di approvvigionamento"),
  e: nis2("e", "Sicurezza dell'acquisizione, sviluppo e manutenzione, incluse gestione e divulgazione delle vulnerabilità"),
  f: nis2("f", "Strategie e procedure per valutare l'efficacia delle misure di gestione dei rischi"),
  g: nis2("g", "Pratiche di igiene informatica di base e formazione"),
  h: nis2("h", "Politiche e procedure relative all'uso della crittografia e della cifratura"),
  i: nis2("i", "Sicurezza delle risorse umane, controllo dell'accesso e gestione degli attivi"),
  j: nis2("j", "Autenticazione a più fattori e comunicazioni protette"),
  art20_1: {
    source: "direttiva_ue_2022_2555",
    article: "Art. 20, par. 1",
    summary: "Approvazione e supervisione delle misure da parte degli organi di gestione",
  } satisfies RegulatoryReference,
  art20_2: {
    source: "direttiva_ue_2022_2555",
    article: "Art. 20, par. 2",
    summary: "Formazione dei membri degli organi di gestione",
  } satisfies RegulatoryReference,
  art23: { source: "direttiva_ue_2022_2555", article: "Art. 23", summary: "Obblighi di segnalazione" } satisfies RegulatoryReference,
  dlgs24: {
    source: "dlgs_138_2024",
    article: "Art. 24",
    summary: "Misure di gestione dei rischi per la sicurezza informatica",
  } satisfies RegulatoryReference,
  dlgs25: {
    source: "dlgs_138_2024",
    article: "Art. 25",
    summary: "Obblighi in materia di notifica di incidente",
  } satisfies RegulatoryReference,
};

export const CONTROL_CATALOG: ControlTemplate[] = [
  // Governance e rischio
  {
    name: "Politica di sicurezza e analisi dei rischi",
    category: "governance",
    description:
      "Politica di sicurezza dei sistemi informativi approvata dalla direzione e analisi dei rischi aggiornata almeno annualmente.",
    regulatoryReferences: [REF.a, REF.dlgs24],
  },
  {
    name: "Approvazione delle misure da parte degli organi di gestione",
    category: "governance",
    description:
      "Approvazione formale delle misure di gestione dei rischi da parte degli organi di gestione e supervisione periodica della loro attuazione.",
    regulatoryReferences: [REF.art20_1],
  },
  {
    name: "Inventario degli asset ICT",
    category: "governance",
    description: "Inventario aggiornato di hardware, software e servizi ICT, con responsabile e criticità di ciascun asset.",
    regulatoryReferences: [REF.i],
  },
  {
    name: "Valutazione periodica dell'efficacia delle misure",
    category: "governance",
    description:
      "Riesame periodico delle misure di sicurezza tramite audit interni, indicatori o test, con piano delle azioni correttive.",
    regulatoryReferences: [REF.f],
  },
  // Gestione accessi
  {
    name: "Gestione delle utenze e dei privilegi",
    category: "gestione_accessi",
    description:
      "Processo di creazione, modifica e revoca delle utenze, con revisione periodica dei privilegi secondo il principio del minimo privilegio.",
    regulatoryReferences: [REF.i],
  },
  {
    name: "Autenticazione a più fattori",
    category: "gestione_accessi",
    description: "Autenticazione a più fattori per accessi remoti, posta elettronica e account amministrativi.",
    regulatoryReferences: [REF.j],
  },
  {
    name: "Gestione degli account privilegiati",
    category: "gestione_accessi",
    description:
      "Account amministrativi separati da quelli di uso quotidiano, elenco aggiornato degli amministratori e tracciamento del loro utilizzo.",
    regulatoryReferences: [REF.i],
  },
  {
    name: "Revoca degli accessi alla cessazione del rapporto",
    category: "gestione_accessi",
    description:
      "Disattivazione tempestiva di account, badge e accessi remoti alla cessazione o al cambio di mansione di dipendenti e collaboratori.",
    regulatoryReferences: [REF.i],
  },
  // Backup e continuità
  {
    name: "Backup periodici e test di ripristino",
    category: "backup_continuita",
    description:
      "Backup dei sistemi critici con copia offline o immutabile e test di ripristino documentati con cadenza almeno annuale.",
    regulatoryReferences: [REF.c],
  },
  {
    name: "Piano di continuità operativa e disaster recovery",
    category: "backup_continuita",
    description:
      "Piano che definisce servizi critici, tempi di ripristino attesi, ruoli e procedure in caso di indisponibilità prolungata dei sistemi.",
    regulatoryReferences: [REF.c],
  },
  {
    name: "Gestione delle crisi",
    category: "backup_continuita",
    description: "Procedura e comitato di gestione delle crisi, con catena decisionale e piano di comunicazione interna ed esterna.",
    regulatoryReferences: [REF.c],
  },
  // Logging e monitoraggio
  {
    name: "Raccolta e conservazione dei log di sicurezza",
    category: "logging_monitoraggio",
    description:
      "Raccolta centralizzata dei log di autenticazione e dei sistemi critici, con periodo di conservazione definito e accesso ristretto.",
    regulatoryReferences: [REF.b],
  },
  {
    name: "Monitoraggio degli eventi di sicurezza",
    category: "logging_monitoraggio",
    description:
      "Analisi periodica o automatizzata degli eventi di sicurezza, con soglie di allerta e responsabilità di verifica definite.",
    regulatoryReferences: [REF.b],
  },
  // Gestione incidenti
  {
    name: "Procedura di gestione e notifica degli incidenti",
    category: "gestione_incidenti",
    description:
      "Procedura che definisce ruoli, classificazione degli incidenti, escalation e tempistiche di notifica al CSIRT Italia.",
    regulatoryReferences: [REF.b, REF.art23, REF.dlgs25],
  },
  {
    name: "Registro degli incidenti di sicurezza",
    category: "gestione_incidenti",
    description: "Registro degli incidenti e dei quasi-incidenti, con analisi delle cause e azioni correttive adottate.",
    regulatoryReferences: [REF.b],
  },
  // Gestione vulnerabilità
  {
    name: "Gestione delle vulnerabilità e patch management",
    category: "gestione_vulnerabilita",
    description:
      "Scansioni periodiche delle vulnerabilità, prioritizzazione in base alla criticità e applicazione delle patch entro tempi definiti.",
    regulatoryReferences: [REF.e],
  },
  {
    name: "Configurazione sicura dei sistemi (hardening)",
    category: "gestione_vulnerabilita",
    description:
      "Configurazioni di base sicure per server, postazioni e dispositivi di rete, con disattivazione di servizi e account non necessari.",
    regulatoryReferences: [REF.e],
  },
  {
    name: "Protezione delle postazioni di lavoro",
    category: "gestione_vulnerabilita",
    description: "Soluzione antimalware/EDR attiva e aggiornata su tutte le postazioni e i server, con monitoraggio degli avvisi.",
    regulatoryReferences: [REF.g],
  },
  {
    name: "Sviluppo e acquisizione sicura del software",
    category: "gestione_vulnerabilita",
    description:
      "Requisiti di sicurezza nell'acquisto e nello sviluppo di software, con verifiche prima della messa in produzione.",
    regulatoryReferences: [REF.e],
  },
  // Formazione
  {
    name: "Formazione periodica sulla sicurezza",
    category: "formazione",
    description:
      "Programma annuale di formazione e sensibilizzazione per dipendenti e collaboratori, con registro delle presenze.",
    regulatoryReferences: [REF.g],
  },
  {
    name: "Formazione degli organi di gestione",
    category: "formazione",
    description:
      "Formazione specifica per i membri degli organi di gestione sui rischi informatici e sul loro impatto sui servizi.",
    regulatoryReferences: [REF.art20_2],
  },
  {
    name: "Simulazioni di phishing",
    category: "formazione",
    description: "Campagne periodiche di phishing simulato con misurazione dei risultati e formazione mirata.",
    regulatoryReferences: [REF.g],
  },
  // Fornitori
  {
    name: "Valutazione della sicurezza dei fornitori ICT",
    category: "fornitori",
    description: "Censimento dei fornitori ICT critici e valutazione dei loro requisiti di sicurezza.",
    regulatoryReferences: [REF.d],
  },
  {
    name: "Clausole di sicurezza nei contratti con i fornitori",
    category: "fornitori",
    description:
      "Requisiti di sicurezza, obblighi di notifica degli incidenti e diritto di verifica inseriti nei contratti con i fornitori ICT.",
    regulatoryReferences: [REF.d],
  },
  // Crittografia
  {
    name: "Cifratura dei dispositivi e dei dati",
    category: "crittografia",
    description:
      "Cifratura dei dischi dei dispositivi portatili e dei supporti rimovibili, con gestione documentata delle chiavi di ripristino.",
    regulatoryReferences: [REF.h],
  },
  {
    name: "Cifratura dei dati in transito",
    category: "crittografia",
    description: "Protocolli cifrati (es. TLS, VPN) per le comunicazioni verso l'esterno e tra le sedi.",
    regulatoryReferences: [REF.h],
  },
  {
    name: "Gestione delle chiavi crittografiche",
    category: "crittografia",
    description: "Regole per generazione, conservazione, rotazione e revoca delle chiavi e dei certificati.",
    regulatoryReferences: [REF.h],
  },
];

function normalize(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

/** Suggerimenti che contengono tutte le parole digitate (senza accenti né maiuscole). */
export function searchControlCatalog(query: string, catalog: ControlTemplate[] = CONTROL_CATALOG): ControlTemplate[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return catalog;
  return catalog.filter((t) => {
    const haystack = normalize(`${t.name} ${t.description}`);
    return words.every((w) => haystack.includes(w));
  });
}
