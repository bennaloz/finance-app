using CasaFinanze.Api.Data;
using CasaFinanze.Api.Dtos;
using CasaFinanze.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace CasaFinanze.Api.Controllers;

public class ExpensesController : ApiControllerBase
{
    private readonly AppDbContext _db;
    public ExpensesController(AppDbContext db) => _db = db;

    // GET /api/expenses?month=yyyy-MM → spese reali del mese.
    [HttpGet]
    public async Task<IEnumerable<ExpenseDto>> Get([FromQuery] string month)
    {
        return await _db.Expenses
            .Where(e => e.HouseholdId == HouseholdId && e.Date.StartsWith(month))
            .OrderByDescending(e => e.Date)
            .Select(e => ToDto(e))
            .ToListAsync();
    }

    // POST /api/expenses → crea una spesa. Per "segna come pagata" si passa
    // RecurringId o ScheduledId valorizzato (tipo = ricorrente/programmata).
    [HttpPost]
    public async Task<ActionResult<ExpenseDto>> Create(ExpenseInput input)
    {
        var e = new Expense
        {
            HouseholdId = HouseholdId,
            Desc = input.Desc,
            Amount = input.Amount,
            Cat = input.Cat,
            Payer = input.Payer,
            Date = input.Date,
            Tipo = input.Tipo ?? "singola",
            RecurringId = input.RecurringId,
            ScheduledId = input.ScheduledId,
        };
        _db.Expenses.Add(e);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(Get), new { month = e.Date[..7] }, ToDto(e));
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ExpenseDto>> Update(int id, ExpenseInput input)
    {
        var e = await _db.Expenses.FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == HouseholdId);
        if (e == null) return NotFound();
        e.Desc = input.Desc;
        e.Amount = input.Amount;
        e.Cat = input.Cat;
        e.Payer = input.Payer;
        e.Date = input.Date;
        if (input.Tipo != null) e.Tipo = input.Tipo;
        await _db.SaveChangesAsync();
        return ToDto(e);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var e = await _db.Expenses.FirstOrDefaultAsync(x => x.Id == id && x.HouseholdId == HouseholdId);
        if (e == null) return NotFound();
        _db.Expenses.Remove(e);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    private static ExpenseDto ToDto(Expense e) =>
        new(e.Id, e.Desc, e.Amount, e.Cat, e.Payer, e.Date, e.Tipo, e.RecurringId, e.ScheduledId);
}
