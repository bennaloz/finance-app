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

        // Logga il cambio come fa saveSettings() nell'app attuale.
        bool changed = s.Model != input.Model || s.RedditoR != input.RedditoR || s.RedditoV != input.RedditoV;
        if (changed)
        {
            _db.ModelLog.Add(new ModelLogEntry
            {
                HouseholdId = HouseholdId,
                Date = DateTime.UtcNow.ToString("yyyy-MM-dd"),
                Model = input.Model,
                ModelLabel = input.ModelLabel ?? input.Model,
                RedditoR = input.RedditoR,
                RedditoV = input.RedditoV,
            });
        }

        s.RedditoR = input.RedditoR;
        s.RedditoV = input.RedditoV;
        s.Risparmio = input.Risparmio;
        s.Model = input.Model;
        await _db.SaveChangesAsync();
        return await BuildDto();
    }

    private async Task<SettingsDto> BuildDto()
    {
        var s = await _db.Settings.FirstAsync(x => x.HouseholdId == HouseholdId);
        var log = await _db.ModelLog
            .Where(x => x.HouseholdId == HouseholdId)
            .OrderByDescending(x => x.Id)
            .Take(12)
            .Select(x => new ModelLogDto(x.Date, x.Model, x.ModelLabel, x.RedditoR, x.RedditoV))
            .ToListAsync();
        return new SettingsDto(s.RedditoR, s.RedditoV, s.Risparmio, s.Model, log);
    }
}
