using CasaFinanze.Api.Data;
using CasaFinanze.Api.Dtos;
using CasaFinanze.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CasaFinanze.Api.Controllers;

public class ScheduledController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public ScheduledController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IEnumerable<ScheduledDto>> Get() =>
        await _db.Scheduleds.Where(s => s.HouseholdId == HouseholdId)
            .Select(s => ToDto(s)).ToListAsync();

    [HttpPost]
    public async Task<ActionResult<ScheduledDto>> Create(ScheduledInput i)
    {
        var s = new Scheduled
        {
            HouseholdId = HouseholdId,
            Desc = i.Desc, Amount = i.Amount, Cat = i.Cat, Payer = i.Payer, Month = i.Month,
        };
        _db.Scheduleds.Add(s);
        await _db.SaveChangesAsync();
        return ToDto(s);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ScheduledDto>> Update(int id, ScheduledInput i)
    {
        var s = await _db.Scheduleds.FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == HouseholdId);
        if (s == null) return NotFound();
        s.Desc = i.Desc; s.Amount = i.Amount; s.Cat = i.Cat; s.Payer = i.Payer; s.Month = i.Month;
        await _db.SaveChangesAsync();
        return ToDto(s);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var s = await _db.Scheduleds.FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == HouseholdId);
        if (s == null) return NotFound();
        _db.Scheduleds.Remove(s);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static ScheduledDto ToDto(Scheduled s) =>
        new(s.Id, s.Desc, s.Amount, s.Cat, s.Payer, s.Month);
}
