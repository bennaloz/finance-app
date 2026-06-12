using CasaFinanze.Api.Data;
using CasaFinanze.Api.Dtos;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CasaFinanze.Api.Controllers;

// I membri del nucleo sono gli utenti dell'household, ciascuno col proprio reddito mensile.
// Qualsiasi membro può vedere e modificare i redditi del nucleo (impostazioni condivise).
public class MembersController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public MembersController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<ActionResult<List<MemberDto>>> Get() =>
        await _db.Users
            .Where(u => u.HouseholdId == HouseholdId)
            .OrderBy(u => u.Id)
            .Select(u => new MemberDto(u.Id, u.DisplayName, u.MonthlyIncome))
            .ToListAsync();

    [HttpPut("{id:int}")]
    public async Task<ActionResult<MemberDto>> Update(int id, MemberInput input)
    {
        var member = await _db.Users.FirstOrDefaultAsync(u => u.Id == id && u.HouseholdId == HouseholdId);
        if (member == null) return NotFound();

        member.MonthlyIncome = input.MonthlyIncome;
        if (!string.IsNullOrWhiteSpace(input.DisplayName)) member.DisplayName = input.DisplayName.Trim();
        await _db.SaveChangesAsync();
        return new MemberDto(member.Id, member.DisplayName, member.MonthlyIncome);
    }
}
