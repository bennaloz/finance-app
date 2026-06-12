using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaFinanze.Api.Migrations
{
    /// <inheritdoc />
    public partial class NucleoMultiMembro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1) Nuove colonne (il reddito si sposta sul membro; lo storico diventa snapshot JSON).
            migrationBuilder.AddColumn<decimal>(
                name: "MonthlyIncome", table: "Users", type: "TEXT", nullable: false, defaultValue: 0m);
            migrationBuilder.AddColumn<string>(
                name: "IncomesJson", table: "ModelLog", type: "TEXT", nullable: false, defaultValue: "{}");

            // 2) Backfill (le vecchie colonne esistono ancora). Mappa per nome del membro.
            //    Reddito dei membri: redditoR -> membro A, redditoV -> membro B (match su DisplayName).
            migrationBuilder.Sql(@"
                UPDATE Users SET MonthlyIncome = COALESCE((
                    SELECT CASE
                        WHEN Users.DisplayName = h.MemberAName THEN s.RedditoR
                        WHEN Users.DisplayName = h.MemberBName THEN s.RedditoV
                        ELSE '0' END
                    FROM Households h JOIN Settings s ON s.HouseholdId = h.Id
                    WHERE h.Id = Users.HouseholdId), '0');");

            //    Storico: costruisci {nomeA: redditoR, nomeB: redditoV} dai vecchi valori.
            migrationBuilder.Sql(@"
                UPDATE ModelLog SET IncomesJson = COALESCE((
                    SELECT '{""' || REPLACE(h.MemberAName, '""', '') || '"":' || ModelLog.RedditoR ||
                           ',""' || REPLACE(h.MemberBName, '""', '') || '"":' || ModelLog.RedditoV || '}'
                    FROM Households h WHERE h.Id = ModelLog.HouseholdId), '{}');");

            //    Payer e categorie 'riccardo'/'valentina' -> riferimento al membro (u{id} / p{id}).
            foreach (var t in new[] { "Expenses", "Recurrings", "Scheduleds" })
            {
                migrationBuilder.Sql(PayerOrCatSql(t, "Payer", "u", "riccardo", "MemberAName"));
                migrationBuilder.Sql(PayerOrCatSql(t, "Payer", "u", "valentina", "MemberBName"));
                migrationBuilder.Sql(PayerOrCatSql(t, "Cat", "p", "riccardo", "MemberAName"));
                migrationBuilder.Sql(PayerOrCatSql(t, "Cat", "p", "valentina", "MemberBName"));
            }

            // 3) Drop delle vecchie colonne.
            migrationBuilder.DropColumn(name: "RedditoR", table: "Settings");
            migrationBuilder.DropColumn(name: "RedditoV", table: "Settings");
            migrationBuilder.DropColumn(name: "RedditoR", table: "ModelLog");
            migrationBuilder.DropColumn(name: "RedditoV", table: "ModelLog");
            migrationBuilder.DropColumn(name: "MemberAName", table: "Households");
            migrationBuilder.DropColumn(name: "MemberBName", table: "Households");
        }

        // Converte un valore fisso ('riccardo'/'valentina') in un riferimento al membro
        // (prefisso 'u' per payer, 'p' per categoria) trovando l'utente per DisplayName.
        private static string PayerOrCatSql(string table, string column, string prefix, string oldValue, string nameCol) => $@"
            UPDATE {table} SET {column} = '{prefix}' || (
                SELECT u.Id FROM Users u JOIN Households h ON h.Id = u.HouseholdId
                WHERE u.HouseholdId = {table}.HouseholdId AND u.DisplayName = h.{nameCol} LIMIT 1)
            WHERE {column} = '{oldValue}' AND EXISTS (
                SELECT 1 FROM Users u JOIN Households h ON h.Id = u.HouseholdId
                WHERE u.HouseholdId = {table}.HouseholdId AND u.DisplayName = h.{nameCol});";

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Reversibilità di schema (i dati convertiti non vengono ripristinati).
            migrationBuilder.DropColumn(name: "MonthlyIncome", table: "Users");
            migrationBuilder.DropColumn(name: "IncomesJson", table: "ModelLog");

            migrationBuilder.AddColumn<decimal>(
                name: "RedditoR", table: "Settings", type: "TEXT", nullable: false, defaultValue: 0m);
            migrationBuilder.AddColumn<decimal>(
                name: "RedditoV", table: "Settings", type: "TEXT", nullable: false, defaultValue: 0m);
            migrationBuilder.AddColumn<decimal>(
                name: "RedditoR", table: "ModelLog", type: "TEXT", nullable: false, defaultValue: 0m);
            migrationBuilder.AddColumn<decimal>(
                name: "RedditoV", table: "ModelLog", type: "TEXT", nullable: false, defaultValue: 0m);
            migrationBuilder.AddColumn<string>(
                name: "MemberAName", table: "Households", type: "TEXT", nullable: false, defaultValue: "");
            migrationBuilder.AddColumn<string>(
                name: "MemberBName", table: "Households", type: "TEXT", nullable: false, defaultValue: "");
        }
    }
}
