using System.Security.Claims;
using CasaFinanze.Api.Auth;
using CasaFinanze.Api.Data;
using CasaFinanze.Api.Dtos;
using CasaFinanze.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CasaFinanze.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly JwtTokenService _jwt;
    public AuthController(AppDbContext db, JwtTokenService jwt) { _db = db; _jwt = jwt; }

    // Registra un utente. Con JoinCode entra in una casa esistente; altrimenti ne crea una nuova.
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email))
            return Conflict("Email già registrata.");

        Household hh;
        if (!string.IsNullOrWhiteSpace(req.JoinCode))
        {
            // Unione a una casa esistente tramite codice.
            var code = req.JoinCode.Trim().ToUpperInvariant();
            var existing = await _db.Households.FirstOrDefaultAsync(h => h.JoinCode == code);
            if (existing == null) return BadRequest("Codice casa non valido.");
            hh = existing;
        }
        else
        {
            // Nuova casa: genera il codice condiviso e i settings iniziali.
            hh = new Household { Name = req.HouseholdName ?? "Casa", JoinCode = await GenerateJoinCode(), CreatedUtc = DateTime.UtcNow };
            _db.Households.Add(hh);
            await _db.SaveChangesAsync();
            _db.Settings.Add(new HouseholdSettings { HouseholdId = hh.Id, Risparmio = 0, Model = "5050" });
        }

        var user = NewUser(hh.Id, req.Email, req.Password, req.DisplayName);
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return new AuthResponse(_jwt.Create(user), user.Email, user.DisplayName, hh.Id, hh.Name, hh.JoinCode);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var user = await _db.Users.Include(u => u.Household).FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user == null || !PasswordHasher.Verify(req.Password, user.PasswordHash))
            return Unauthorized("Credenziali non valide.");
        return new AuthResponse(_jwt.Create(user), user.Email, user.DisplayName, user.HouseholdId, user.Household!.Name, user.Household!.JoinCode);
    }

    // Aggiunge un secondo utente all'household corrente (es. Valentina).
    [Authorize]
    [HttpPost("users")]
    public async Task<ActionResult<AuthResponse>> AddUser(AddUserRequest req)
    {
        var householdId = int.Parse(User.FindFirstValue("householdId")!);
        if (await _db.Users.AnyAsync(u => u.Email == req.Email))
            return Conflict("Email già registrata.");

        var hh = await _db.Households.FirstAsync(h => h.Id == householdId);
        var user = NewUser(householdId, req.Email, req.Password, req.DisplayName);
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return new AuthResponse(_jwt.Create(user), user.Email, user.DisplayName, householdId, hh.Name, hh.JoinCode);
    }

    // Codice casa di 6 caratteri, senza simboli ambigui (0/O, 1/I), garantito univoco.
    private async Task<string> GenerateJoinCode()
    {
        const string alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        for (var attempt = 0; attempt < 10; attempt++)
        {
            var code = new string(Enumerable.Range(0, 6).Select(_ => alphabet[Random.Shared.Next(alphabet.Length)]).ToArray());
            if (!await _db.Households.AnyAsync(h => h.JoinCode == code)) return code;
        }
        throw new InvalidOperationException("Impossibile generare un codice casa univoco.");
    }

    private static User NewUser(int householdId, string email, string password, string? displayName) => new()
    {
        HouseholdId = householdId,
        Email = email,
        PasswordHash = PasswordHasher.Hash(password),
        DisplayName = displayName ?? email,
        CreatedUtc = DateTime.UtcNow,
    };
}
