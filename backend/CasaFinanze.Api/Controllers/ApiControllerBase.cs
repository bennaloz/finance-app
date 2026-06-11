using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace CasaFinanze.Api.Controllers;

// Base per i controller protetti: espone l'household/utente corrente dal token JWT.
[ApiController]
[Authorize]
[Route("api/[controller]")]
public abstract class ApiControllerBase : ControllerBase
{
    protected int HouseholdId => int.Parse(User.FindFirstValue("householdId")!);
    protected int UserId => int.Parse(User.FindFirstValue("userId")!);
}
