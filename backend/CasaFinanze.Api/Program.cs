using System.Text;
using CasaFinanze.Api.Auth;
using CasaFinanze.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// --- Database (SQLite) ---
// Path del DB configurabile. Precedenza:
//   1. ConnectionStrings:Default da config/ambiente (App Setting ConnectionStrings__Default su Azure).
//   2. Default automatico: su Azure App Service (Linux) -> /home/data (unica cartella persistente);
//      in locale -> ./data accanto all'app.
// Vincolo: SQLite richiede una sola istanza (no scale-out).
var conn = builder.Configuration.GetConnectionString("Default");
if (string.IsNullOrWhiteSpace(conn))
{
    // WEBSITE_INSTANCE_ID è presente solo quando si gira dentro Azure App Service.
    var onAzure = !string.IsNullOrEmpty(Environment.GetEnvironmentVariable("WEBSITE_INSTANCE_ID"));
    var dbPath = onAzure ? "/home/data/casafinanze.db" : "./data/casafinanze.db";
    conn = $"Data Source={dbPath}";
}
EnsureDbFolder(conn);
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(conn));

// --- Auth (JWT) ---
builder.Services.AddSingleton<JwtTokenService>();
// La chiave NON è in appsettings.json: in sviluppo arriva da appsettings.Development.json,
// in produzione dall'App Setting/variabile d'ambiente Jwt__Key.
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey))
    throw new InvalidOperationException(
        "Jwt:Key non configurata. Imposta l'App Setting/variabile d'ambiente 'Jwt__Key' " +
        "(min 32 caratteri) oppure il valore in appsettings.Development.json per lo sviluppo locale.");
var jwtIssuer = builder.Configuration["Jwt:Issuer"];
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false; // mantieni i claim custom (householdId/userId) verbatim
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = jwtIssuer,
            ValidateAudience = true,
            ValidAudience = jwtIssuer,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
            ValidateLifetime = true,
        };
    });
builder.Services.AddAuthorization();

// --- CORS ---
// Il frontend Angular è ospitato su un'origine diversa (Azure Static Web Apps), quindi servono
// le intestazioni CORS. Le origini consentite arrivano da config: Cors:AllowedOrigins (array)
// oppure dall'App Setting Cors__AllowedOrigins__0, Cors__AllowedOrigins__1, ...
const string CorsPolicy = "frontend";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                     ?? Array.Empty<string>();
builder.Services.AddCors(o => o.AddPolicy(CorsPolicy, p =>
{
    if (allowedOrigins.Length > 0)
        p.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
}));

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// Applica le migration allo startup (crea/aggiorna il DB).
using (var scope = app.Services.CreateScope())
{
    scope.ServiceProvider.GetRequiredService<AppDbContext>().Database.Migrate();
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors(CorsPolicy);
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Endpoint di keep-warm: leggerissimo (nessun auth, nessun accesso al DB), serve solo a
// tenere sveglio l'App Service Free, che altrimenti scarica l'app dopo ~20 min di inattività
// e impiega ~30s a ripartire (cold start). Un pinger esterno gratuito lo chiama ogni ~5 min.
app.MapGet("/health", () => Results.Ok("ok")).AllowAnonymous();

// Serve il client Angular (build statica in wwwroot) con fallback SPA.
app.UseDefaultFiles();
app.UseStaticFiles();
app.MapFallbackToFile("index.html");

app.Run();

// Crea la cartella del file SQLite se non esiste (es. ./data o /home/data).
static void EnsureDbFolder(string connectionString)
{
    const string marker = "Data Source=";
    var idx = connectionString.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
    if (idx < 0) return;
    var path = connectionString[(idx + marker.Length)..].Split(';')[0].Trim();
    var dir = Path.GetDirectoryName(path);
    if (!string.IsNullOrEmpty(dir)) Directory.CreateDirectory(dir);
}
