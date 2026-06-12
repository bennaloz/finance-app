using System.Text.Json;
using CasaFinanze.Api.Data;
using CasaFinanze.Api.Dtos;
using CasaFinanze.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CasaFinanze.Api.Controllers;

public class SettingsController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public SettingsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<SettingsDto>> Get() => await BuildDto();

    [HttpPut]
    public async Task<ActionResult<SettingsDto>> Update(SettingsInput input)
    {
        var s = await _db.Settings.FirstAsync(x => x.HouseholdId == HouseholdId);

        // Logga il cambio di modello con uno snapshot dei redditi correnti dei membri.
        if (s.Model != input.Model)
        {
            _db.ModelLog.Add(new ModelLogEntry
            {
                HouseholdId = HouseholdId,
                Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                Model = input.Model,
                ModelLabel = input.ModelLabel ?? input.Model,
                IncomesJson = await BuildIncomesSnapshot(),
            });
        }

        s.Risparmio = input.Risparmio;
        s.Model = input.Model;
        await _db.SaveChangesAsync();
        return await BuildDto();
    }

    // Snapshot {nome: reddito} dei membri correnti, per lo storico modelli.
    private async Task<string> BuildIncomesSnapshot()
    {
        var incomes = await _db.Users
            .Where(u => u.HouseholdId == HouseholdId)
            .OrderBy(u => u.Id)
            .ToDictionaryAsync(u => u.DisplayName, u => u.MonthlyIncome);
        return JsonSerializer.Serialize(incomes);
    }

    private async Task<SettingsDto> BuildDto()
    {
        var s = await _db.Settings.FirstAsync(x => x.HouseholdId == HouseholdId);
        var log = await _db.ModelLog
            .Where(x => x.HouseholdId == HouseholdId)
            .OrderByDescending(x => x.Id)
            .Take(12)
            .Select(x => new ModelLogDto(x.Date, x.Model, x.ModelLabel, x.IncomesJson))
            .ToListAsync();
        return new SettingsDto(s.Risparmio, s.Model, log);
    }
}
