using CasaFinanze.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace CasaFinanze.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Household> Households => Set<Household>();
    public DbSet<User> Users => Set<User>();
    public DbSet<HouseholdSettings> Settings => Set<HouseholdSettings>();
    public DbSet<ModelLogEntry> ModelLog => Set<ModelLogEntry>();
    public DbSet<CustomCategory> CustomCategories => Set<CustomCategory>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<Recurring> Recurrings => Set<Recurring>();
    public DbSet<Scheduled> Scheduleds => Set<Scheduled>();

    protected override void OnModelCreating(ModelBuilder b)
    {
        b.Entity<User>().HasIndex(u => u.Email).IsUnique();
        b.Entity<Household>().HasIndex(h => h.JoinCode).IsUnique();
        b.Entity<HouseholdSettings>().HasIndex(s => s.HouseholdId).IsUnique();
        // Indici per lo scoping per-household (tutte le query filtrano su HouseholdId).
        b.Entity<Expense>().HasIndex(e => e.HouseholdId);
        b.Entity<Recurring>().HasIndex(e => e.HouseholdId);
        b.Entity<Scheduled>().HasIndex(e => e.HouseholdId);
        b.Entity<CustomCategory>().HasIndex(e => e.HouseholdId);
        b.Entity<ModelLogEntry>().HasIndex(e => e.HouseholdId);
    }
}
