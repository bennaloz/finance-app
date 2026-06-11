using CasaFinanze.Api.Data;
using CasaFinanze.Api.Dtos;
using CasaFinanze.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CasaFinanze.Api.Controllers;

public class CategoriesController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public CategoriesController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IEnumerable<CategoryDto>> Get() =>
        await _db.CustomCategories.Where(c => c.HouseholdId == HouseholdId)
            .Select(c => new CategoryDto(c.Id, c.Label, c.Common, c.Icon)).ToListAsync();

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(CategoryInput i)
    {
        var c = new CustomCategory
        {
            HouseholdId = HouseholdId,
            Label = i.Label,
            Common = i.Common,
            Icon = string.IsNullOrWhiteSpace(i.Icon) ? "ti-tag" : i.Icon!,
        };
        _db.CustomCategories.Add(c);
        await _db.SaveChangesAsync();
        return new CategoryDto(c.Id, c.Label, c.Common, c.Icon);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var c = await _db.CustomCategories.FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == HouseholdId);
        if (c == null) return NotFound();
        _db.CustomCategories.Remove(c);
        await _db.SaveChangesAsync();
        return NoContent();
    }
}
