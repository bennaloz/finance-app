using CasaFinanze.Api.Data;
using CasaFinanze.Api.Dtos;
using CasaFinanze.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CasaFinanze.Api.Controllers;

// Allineamenti del conto comune: ancore di saldo da cui parte la Previsione.
public class AlignmentController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public AlignmentController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IEnumerable<AlignmentDto>> Get() =>
        await _db.Alignments.Where(a => a.HouseholdId == HouseholdId)
            .OrderBy(a => a.Month)
            .Select(a => ToDto(a)).ToListAsync();

    // Upsert: un solo allineamento per (household, mese). Reinserire un mese ne aggiorna il saldo.
    [HttpPost]
    public async Task<ActionResult<AlignmentDto>> Set(AlignmentInput i)
    {
        var a = await _db.Alignments.FirstOrDefaultAsync(x => x.HouseholdId == HouseholdId && x.Month == i.Month);
        if (a == null)
        {
            a = new Alignment { HouseholdId = HouseholdId, Month = i.Month, Amount = i.Amount };
            _db.Alignments.Add(a);
        }
        else
        {
            a.Amount = i.Amount;
        }
        await _db.SaveChangesAsync();
        return ToDto(a);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var a = await _db.Alignments.FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == HouseholdId);
        if (a == null) return NotFound();
        _db.Alignments.Remove(a);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static AlignmentDto ToDto(Alignment a) => new(a.Id, a.Month, a.Amount);
}
