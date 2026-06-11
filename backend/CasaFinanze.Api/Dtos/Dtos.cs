namespace CasaFinanze.Api.Dtos;

// --- Auth ---
public record RegisterRequest(string Email, string Password, string? DisplayName, string? HouseholdName, string? JoinCode);
public record LoginRequest(string Email, string Password);
public record AddUserRequest(string Email, string Password, string? DisplayName);
public record AuthResponse(string Token, string Email, string DisplayName, int HouseholdId, string HouseholdName, string JoinCode);

// --- Settings ---
public record ModelLogDto(string Date, string Model, string ModelLabel, decimal RedditoR, decimal RedditoV);
public record SettingsDto(decimal RedditoR, decimal RedditoV, decimal Risparmio, string Model, List<ModelLogDto> ModelLog);
public record SettingsInput(decimal RedditoR, decimal RedditoV, decimal Risparmio, string Model, string? ModelLabel);

// --- Expenses ---
public record ExpenseDto(int Id, string Desc, decimal Amount, string Cat, string Payer, string Date, string Tipo, int? RecurringId, int? ScheduledId);
public record ExpenseInput(string Desc, decimal Amount, string Cat, string Payer, string Date, string? Tipo, int? RecurringId, int? ScheduledId);

// --- Recurring ---
public record RecurringDto(int Id, string Desc, decimal Amount, string Cat, string Payer, string Freq, string FromMonth, string? ToMonth, int? ChargeDay);
public record RecurringInput(string Desc, decimal Amount, string Cat, string Payer, string Freq, string FromMonth, string? ToMonth, int? ChargeDay);

// --- Scheduled ---
public record ScheduledDto(int Id, string Desc, decimal Amount, string Cat, string Payer, string Month);
public record ScheduledInput(string Desc, decimal Amount, string Cat, string Payer, string Month);

// --- Categories ---
public record CategoryDto(int Id, string Label, bool Common, string Icon);
public record CategoryInput(string Label, bool Common, string? Icon);
