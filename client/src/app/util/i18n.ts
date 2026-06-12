// Etichette IT (struttura pronta per altre lingue, come l'app originale).

export const MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

export const SCREENS: Record<string, string> = {
  dash: 'Panoramica', uscite: 'Movimenti', aggiungi: 'Aggiungi uscita',
  ricorrenti: 'Uscite', previsione: 'Previsione', grafici: 'Grafici', impostazioni: 'Impostazioni',
};

// Categorie "fisse" non personali. Le personali sono per-membro (id `p{userId}`).
export const CAT_LABELS: Record<string, string> = {
  common: 'Comuni obbligatorie', risparmio: 'Risparmio', variabile: 'Variabili comuni',
  extra: 'Extra',
};

export const CAT_FORM_LABELS: Record<string, string> = {
  common: 'Spese comuni obbligatorie', risparmio: 'Risparmio programmato', variabile: 'Spese variabili comuni',
  extra: 'Extra / Acquisti straordinari',
};

export const CAT_ICONS: Record<string, string> = {
  common: 'ti-home', risparmio: 'ti-piggy-bank', variabile: 'ti-shopping-cart',
  extra: 'ti-star',
};

export const FREQS: Record<string, string> = {
  mensile: 'Ogni mese', bimestrale: 'Ogni 2 mesi', trimestrale: 'Ogni 3 mesi',
  semestrale: 'Ogni 6 mesi', annuale: 'Ogni anno',
};

export const MODELS: Record<string, { label: string; desc: string }> = {
  '5050': { label: 'Parti uguali', desc: 'Ogni spesa comune è divisa in parti uguali tra i membri.' },
  prop: { label: 'Proporzionale', desc: 'Ciascuno contribuisce in proporzione al proprio reddito.' },
  unico: { label: 'Pot unico', desc: 'Tutto entra in un conto comune, quota uguale per tutti.' },
};

// Etichetta del conto comune; i membri sono risolti dinamicamente dai loro nomi.
export const PAYERS: Record<string, string> = {
  comune: 'Conto comune',
};

// Colori delle categorie fisse + neutro per le custom.
export const CAT_COLORS: Record<string, string> = {
  common: '#2D7D6F', risparmio: '#3B6D11', extra: '#E07A2F', custom: '#55617A',
};

// Palette assegnata ai membri per indice (i primi due ricalcano i vecchi colori R/V).
export const MEMBER_COLORS = ['#185FA5', '#993556', '#2D7D6F', '#E07A2F', '#7A4FA5', '#3B6D11', '#B5852A', '#0E7C86'];

export function memberColor(index: number): string {
  return MEMBER_COLORS[((index % MEMBER_COLORS.length) + MEMBER_COLORS.length) % MEMBER_COLORS.length];
}
