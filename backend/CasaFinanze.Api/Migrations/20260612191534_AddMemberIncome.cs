using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaFinanze.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMemberIncome : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MemberIncomes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    HouseholdId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    Month = table.Column<string>(type: "TEXT", nullable: false),
                    Amount = table.Column<decimal>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MemberIncomes", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MemberIncomes_HouseholdId_UserId_Month",
                table: "MemberIncomes",
                columns: new[] { "HouseholdId", "UserId", "Month" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MemberIncomes");
        }
    }
}
