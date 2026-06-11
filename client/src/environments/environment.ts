// Produzione: il frontend è su Azure Static Web Apps, distinto dal backend.
// Imposta l'URL dell'App Service (senza slash finale), es:
//   apiBaseUrl: 'https://casafinanze-api.azurewebsites.net'
// Le chiamate diventano `${apiBaseUrl}/api/...`. Il backend deve avere questa
// origine fra le Cors:AllowedOrigins.
export const environment = {
  production: true,
  apiBaseUrl: '',
};
