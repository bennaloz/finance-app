namespace CasaFinanze.Api.Dtos;

// --- Auth ---
public record RegisterRequest(string Email, string Password, string? DisplayName, string? HouseholdName, string? JoinCode);
public record LoginRequest(string Email, string Password);
public record AddUserRequest(string Email, string Password, string? DisplayName);
public record AuthResponse(string Token, string Email, string DisplayName, int HouseholdId, string HouseholdName, string JoinCode);

// --- Settings ---
// IncomesJson: snapshot {nome: reddito} dei membri al momento del cambio (storico).
public record ModelLogDto(string Date, string Model, string ModelLabel, string IncomesJson);
public record SettingsDto(decimal Risparmio, string Model, List<ModelLogDto> ModelLog);
public record SettingsInput(decimal Risparmio, string Model, string? ModelLabel);

// --- Members (= utenti del nucleo, con reddito) ---
public record MemberDto(int Id, string DisplayName, decimal MonthlyIncome);
public record MemberInput(decimal MonthlyIncome, string? DisplayName);

// --- Expenses ---
public record ExpenseDto(int Id, string Desc, decimal Amount, string Cat, string Payer, string Date, string Tipo, int? RecurringId, int? ScheduledId);
public record ExpenseInput(string Desc, decimal Amount, string Cat, string Payer, string Date, string? Tipo, int? RecurringId, int? ScheduledId);

// --- Recurring ---
public record RecurringDto(int Id, string Desc, decimal Amount, string Cat, string Payer, string Freq, string FromMonth, string? ToMonth, int? ChargeDay);
public record RecurringInput(string Desc, decimal Amount, string Cat, string Payer, string Freq, string FromMonth, string? ToMonth, int? ChargeDay);

// --- Scheduled ---
public record ScheduledDto(int Id, string Desc, decimal Amount, string Cat, string Payer, string Month);
public record ScheduledInput(string Desc, decimal Amount, string Cat, string Payer, string Month);

// --- Alignment (ancora di saldo del conto comune per la previsione) ---
public record AlignmentDto(int Id, string Month, decimal Amount);
public record AlignmentInput(string Month, decimal Amount);

// --- MemberIncome (reddito di un membro per un mese, con carry-forward) ---
public record MemberIncomeDto(int Id, int UserId, string Month, decimal Amount);
public record MemberIncomeInput(int UserId, string Month, decimal Amount);

// --- Categories ---
public record CategoryDto(int Id, string Label, bool Common, string Icon);
public record CategoryInput(string Label, bool Common, string? Icon);
