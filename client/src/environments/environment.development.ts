// Sviluppo: apiBaseUrl vuoto -> le chiamate restano relative (`/api/...`)
// e proxy.conf.json le inoltra al backend locale (http://localhost:5080).
export const environment = {
  production: false,
  apiBaseUrl: '',
};
