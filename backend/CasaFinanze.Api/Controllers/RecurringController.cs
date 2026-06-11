using CasaFinanze.Api.Data;
using CasaFinanze.Api.Dtos;
using CasaFinanze.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CasaFinanze.Api.Controllers;

public class RecurringController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public RecurringController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IEnumerable<RecurringDto>> Get() =>
        await _db.Recurrings.Where(r => r.HouseholdId == HouseholdId)
            .Select(r => ToDto(r)).ToListAsync();

    [HttpPost]
    public async Task<ActionResult<RecurringDto>> Create(RecurringInput i)
    {
        var r = new Recurring
        {
            HouseholdId = HouseholdId,
            Desc = i.Desc, Amount = i.Amount, Cat = i.Cat, Payer = i.Payer,
            Freq = i.Freq, FromMonth = i.FromMonth, ToMonth = i.ToMonth, ChargeDay = i.ChargeDay,
        };
        _db.Recurrings.Add(r);
        await _db.SaveChangesAsync();
        return ToDto(r);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<RecurringDto>> Update(int id, RecurringInput i)
    {
        var r = await _db.Recurrings.FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == HouseholdId);
        if (r == null) return NotFound();
        r.Desc = i.Desc; r.Amount = i.Amount; r.Cat = i.Cat; r.Payer = i.Payer;
        r.Freq = i.Freq; r.FromMonth = i.FromMonth; r.ToMonth = i.ToMonth; r.ChargeDay = i.ChargeDay;
        await _db.SaveChangesAsync();
        return ToDto(r);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var r = await _db.Recurrings.FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == HouseholdId);
        if (r == null) return NotFound();
        _db.Recurrings.Remove(r);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static RecurringDto ToDto(Recurring r) =>
        new(r.Id, r.Desc, r.Amount, r.Cat, r.Payer, r.Freq, r.FromMonth, r.ToMonth, r.ChargeDay);
}
