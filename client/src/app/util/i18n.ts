// Etichette IT (struttura pronta per altre lingue, come l'app originale).

export const MONTHS = ['Gennaio','Febbraio','Marzo','Aprile','Maggio','Giugno','Luglio','Agosto','Settembre','Ottobre','Novembre','Dicembre'];

export const SCREENS: Record<string, string> = {
  dash: 'Panoramica', uscite: 'Movimenti', aggiungi: 'Aggiungi uscita',
  ricorrenti: 'Uscite', previsione: 'Previsione', grafici: 'Grafici', impostazioni: 'Impostazioni',
};

export const CAT_LABELS: Record<string, string> = {
  common: 'Comuni obbligatorie', risparmio: 'Risparmio', variabile: 'Variabili comuni',
  riccardo: 'Personali R.', valentina: 'Personali V.', extra: 'Extra',
};

export const CAT_FORM_LABELS: Record<string, string> = {
  common: 'Spese comuni obbligatorie', risparmio: 'Risparmio programmato', variabile: 'Spese variabili comuni',
  riccardo: 'Personali Riccardo', valentina: 'Personali Valentina', extra: 'Extra / Acquisti straordinari',
};

export const CAT_ICONS: Record<string, string> = {
  common: 'ti-home', risparmio: 'ti-piggy-bank', variabile: 'ti-shopping-cart',
  riccardo: 'ti-user', valentina: 'ti-user', extra: 'ti-star',
};

export const FREQS: Record<string, string> = {
  mensile: 'Ogni mese', bimestrale: 'Ogni 2 mesi', trimestrale: 'Ogni 3 mesi',
  semestrale: 'Ogni 6 mesi', annuale: 'Ogni anno',
};

export const MODELS: Record<string, { label: string; desc: string }> = {
  '5050': { label: '50/50 fisso', desc: 'Ogni spesa comune viene divisa esattamente a metà.' },
  prop: { label: 'Proporzionale', desc: 'Ciascuno contribuisce in proporzione al proprio reddito.' },
  unico: { label: 'Pot unico', desc: 'Tutto entra in un conto comune, paghetta uguale per entrambi.' },
};

export const PAYERS: Record<string, string> = {
  comune: 'Conto comune', riccardo: 'Riccardo', valentina: 'Valentina',
};

export const CAT_COLORS: Record<string, string> = {
  common: '#2D7D6F', risparmio: '#3B6D11', riccardo: '#185FA5',
  valentina: '#993556', extra: '#E07A2F', custom: '#55617A',
};
