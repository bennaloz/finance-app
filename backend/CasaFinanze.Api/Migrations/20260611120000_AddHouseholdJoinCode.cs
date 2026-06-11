using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace CasaFinanze.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddHouseholdJoinCode : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "JoinCode",
                table: "Households",
                type: "TEXT",
                nullable: false,
                defaultValue: "");

            // Assegna un codice distinto alle case già esistenti, così l'indice univoco
            // qui sotto non collide. (Le nuove case ricevono un codice random in registrazione.)
            migrationBuilder.Sql("UPDATE Households SET JoinCode = 'OLD' || Id WHERE JoinCode = '';");

            migrationBuilder.CreateIndex(
                name: "IX_Households_JoinCode",
                table: "Households",
                column: "JoinCode",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Households_JoinCode",
                table: "Households");

            migrationBuilder.DropColumn(
                name: "JoinCode",
                table: "Households");
        }
    }
}
