using System.Text;
using CasaFinanze.Api.Auth;
using CasaFinanze.Api.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// --- Database (SQLite) ---
// Connection string da config (ConnectionStrings:Default). In Azure punta a /home/data.
var conn = builder.Configuration.GetConnectionString("Default")
           ?? "Data Source=./data/casafinanze.db";
EnsureDbFolder(conn);
builder.Services.AddDbContext<AppDbContext>(o => o.UseSqlite(conn));

// --- Auth (JWT) ---
builder.Services.AddSingleton<JwtTokenService>();
var jwtKey = builder.Configuration["Jwt:Key"]!;
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

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

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
