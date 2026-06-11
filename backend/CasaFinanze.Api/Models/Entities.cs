namespace CasaFinanze.Api.Models;

// Un "household" è il nucleo che condivide i dati (oggi: una coppia).
// Tutte le altre entità sono isolate per HouseholdId → schema già multi-tenant.
public class Household
{
    public int Id { get; set; }
    public string Name { get; set; } = "Casa";
    // Codice condiviso che un secondo utente inserisce in fase di registrazione per
    // unirsi a questa casa invece di crearne una nuova. Univoco.
    public string JoinCode { get; set; } = "";
    public string MemberAName { get; set; } = "Riccardo";
    public string MemberBName { get; set; } = "Valentina";
    public DateTime CreatedUtc { get; set; }
    public List<User> Users { get; set; } = new();
}

public class User
{
    public int Id { get; set; }
    public int HouseholdId { get; set; }
    public Household? Household { get; set; }
    public string Email { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public DateTime CreatedUtc { get; set; }
}

// Una riga per household: redditi, risparmio programmato, modello di divisione.
public class HouseholdSettings
{
    public int Id { get; set; }
    public int HouseholdId { get; set; }
    public decimal RedditoR { get; set; }
    public decimal RedditoV { get; set; }
    public decimal Risparmio { get; set; }
    public string Model { get; set; } = "5050";
}

// Storico dei cambi di modello/redditi (come il modelLog dell'app attuale).
public class ModelLogEntry
{
    public int Id { get; set; }
    public int HouseholdId { get; set; }
    public string Date { get; set; } = "";   // yyyy-MM-dd
    public string Model { get; set; } = "";
    public string ModelLabel { get; set; } = "";
    public decimal RedditoR { get; set; }
    public decimal RedditoV { get; set; }
}

public class CustomCategory
{
    public int Id { get; set; }
    public int HouseholdId { get; set; }
    public string Label { get; set; } = "";
    public bool Common { get; set; }
    public string Icon { get; set; } = "ti-tag";
}

// Spese ricorrenti (frequenza configurabile, giorno di addebito opzionale).
public class Recurring
{
    public int Id { get; set; }
    public int HouseholdId { get; set; }
    public string Desc { get; set; } = "";
    public decimal Amount { get; set; }
    public string Cat { get; set; } = "";
    public string Payer { get; set; } = "comune";
    public string Freq { get; set; } = "mensile";
    public string FromMonth { get; set; } = "";   // yyyy-MM
    public string? ToMonth { get; set; }
    public int? ChargeDay { get; set; }
}

// Spese programmate su un mese specifico.
public class Scheduled
{
    public int Id { get; set; }
    public int HouseholdId { get; set; }
    public string Desc { get; set; } = "";
    public decimal Amount { get; set; }
    public string Cat { get; set; } = "";
    public string Payer { get; set; } = "comune";
    public string Month { get; set; } = "";       // yyyy-MM
}

// Spese REALI memorizzate (singole + ricorrenti/programmate "pagate").
// Le proiezioni non si salvano: le calcola il client.
public class Expense
{
    public int Id { get; set; }
    public int HouseholdId { get; set; }
    public string Desc { get; set; } = "";
    public decimal Amount { get; set; }
    public string Cat { get; set; } = "";
    public string Payer { get; set; } = "comune";
    public string Date { get; set; } = "";        // yyyy-MM-dd
    public string Tipo { get; set; } = "singola";
    public int? RecurringId { get; set; }         // valorizzato se "pagata" da ricorrente
    public int? ScheduledId { get; set; }         // valorizzato se "pagata" da programmata
}
