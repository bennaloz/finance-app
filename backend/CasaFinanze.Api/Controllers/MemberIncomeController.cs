using CasaFinanze.Api.Data;
using CasaFinanze.Api.Dtos;
using CasaFinanze.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CasaFinanze.Api.Controllers;

// Redditi dei membri per mese (override datati con carry-forward lato client).
public class MemberIncomeController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public MemberIncomeController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IEnumerable<MemberIncomeDto>> Get() =>
        await _db.MemberIncomes.Where(x => x.HouseholdId == HouseholdId)
            .OrderBy(x => x.Month)
            .Select(x => ToDto(x)).ToListAsync();

    // Upsert: un solo reddito per (household, membro, mese).
    [HttpPost]
    public async Task<ActionResult<MemberIncomeDto>> Set(MemberIncomeInput i)
    {
        var x = await _db.MemberIncomes.FirstOrDefaultAsync(
            e => e.HouseholdId == HouseholdId && e.UserId == i.UserId && e.Month == i.Month);
        if (x == null)
        {
            x = new MemberIncome { HouseholdId = HouseholdId, UserId = i.UserId, Month = i.Month, Amount = i.Amount };
            _db.MemberIncomes.Add(x);
        }
        else
        {
            x.Amount = i.Amount;
        }
        await _db.SaveChangesAsync();
        return ToDto(x);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var x = await _db.MemberIncomes.FirstOrDefaultAsync(e => e.Id == id && e.HouseholdId == HouseholdId);
        if (x == null) return NotFound();
        _db.MemberIncomes.Remove(x);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static MemberIncomeDto ToDto(MemberIncome x) => new(x.Id, x.UserId, x.Month, x.Amount);
}
