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

    // Crea un nuovo household + primo utente.
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest req)
    {
        if (await _db.Users.AnyAsync(u => u.Email == req.Email))
            return Conflict("Email già registrata.");

        var hh = new Household { Name = req.HouseholdName ?? "Casa", CreatedUtc = DateTime.UtcNow };
        _db.Households.Add(hh);
        await _db.SaveChangesAsync();

        _db.Settings.Add(new HouseholdSettings { HouseholdId = hh.Id, RedditoR = 2250, RedditoV = 1700, Risparmio = 0, Model = "5050" });
        var user = NewUser(hh.Id, req.Email, req.Password, req.DisplayName);
        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        return new AuthResponse(_jwt.Create(user), user.Email, user.DisplayName, hh.Id);
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest req)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == req.Email);
        if (user == null || !PasswordHasher.Verify(req.Password, user.PasswordHash))
            return Unauthorized("Credenziali non valide.");
        return new AuthResponse(_jwt.Create(user), user.Email, user.DisplayName, user.HouseholdId);
    }

    // Aggiunge un secondo utente all'household corrente (es. Valentina).
    [Authorize]
    [HttpPost("users")]
    public async Task<ActionResult<AuthResponse>> AddUser(AddUserRequest req)
    {
        var householdId = int.Parse(User.FindFirstValue("householdId")!);
        if (await _db.Users.AnyAsync(u => u.Email == req.Email))
            return Conflict("Email già registrata.");

        var user = NewUser(householdId, req.Email, req.Password, req.DisplayName);
        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        return new AuthResponse(_jwt.Create(user), user.Email, user.DisplayName, householdId);
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
