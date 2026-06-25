import { PrismaClient } from "@prisma/client";

const OLD_DATABASE_URL =
  process.env.OLD_DATABASE_URL ||
  "postgres://postgres:BUHMAHmiBAgSxQetfKIzJC59Z6InIk1xk23C2t9Cuk4DyMrEUSSE7IefaDS1f6C9@187.127.164.72:5436/postgres";

const NEW_DATABASE_URL =
  process.env.NEW_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgres://postgres:4SDTzT5zPz3QHteRGbklqPxkX5s4bqbQF7b1P128Vy4SbdL5M5miz32LFGFGJomb@187.77.204.171:5469/postgres";

const source = new PrismaClient({
  datasources: { db: { url: OLD_DATABASE_URL } },
});

const target = new PrismaClient({
  datasources: { db: { url: NEW_DATABASE_URL } },
});

const copySteps = [
  { label: "Country", read: () => source.country.findMany(), write: (rows) => target.country.createMany({ data: rows, skipDuplicates: true }) },
  { label: "Region", read: () => source.region.findMany(), write: (rows) => target.region.createMany({ data: rows, skipDuplicates: true }) },
  { label: "City", read: () => source.city.findMany(), write: (rows) => target.city.createMany({ data: rows, skipDuplicates: true }) },
  { label: "Category", read: () => source.category.findMany(), write: (rows) => target.category.createMany({ data: rows, skipDuplicates: true }) },
  { label: "SubCategory", read: () => source.subCategory.findMany(), write: (rows) => target.subCategory.createMany({ data: rows, skipDuplicates: true }) },
  { label: "PricingPlan", read: () => source.pricingPlan.findMany(), write: (rows) => target.pricingPlan.createMany({ data: rows, skipDuplicates: true }) },
  { label: "SystemSettings", read: () => source.systemSettings.findMany(), write: (rows) => target.systemSettings.createMany({ data: rows, skipDuplicates: true }) },
  { label: "User", read: () => source.user.findMany(), write: (rows) => target.user.createMany({ data: rows, skipDuplicates: true }) },
  { label: "Listing", read: () => source.listing.findMany(), write: (rows) => target.listing.createMany({ data: rows, skipDuplicates: true }) },
  { label: "Subscription", read: () => source.subscription.findMany(), write: (rows) => target.subscription.createMany({ data: rows, skipDuplicates: true }) },
  { label: "Payment", read: () => source.payment.findMany(), write: (rows) => target.payment.createMany({ data: rows, skipDuplicates: true }) },
  { label: "SupportTicket", read: () => source.supportTicket.findMany(), write: (rows) => target.supportTicket.createMany({ data: rows, skipDuplicates: true }) },
];

async function getTargetTables() {
  const rows = await target.$queryRaw`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `;
  return rows.map((row) => row.tablename);
}

async function main() {
  console.log("Source:", OLD_DATABASE_URL.replace(/:[^:@/]+@/, ":***@"));
  console.log("Target:", NEW_DATABASE_URL.replace(/:[^:@/]+@/, ":***@"));

  const tables = await getTargetTables();
  if (!tables.length) {
    throw new Error(
      "Target database has no tables. Run `npx prisma migrate deploy` against the new DATABASE_URL first."
    );
  }

  console.log("Target tables found:", tables.join(", "));

  for (const step of copySteps) {
    const rows = await step.read();
    if (!rows.length) {
      console.log(`- ${step.label}: 0 rows (skipped)`);
      continue;
    }

    const result = await step.write(rows);
    console.log(`- ${step.label}: copied ${rows.length} rows (${result.count} inserted)`);
  }

  console.log("\nDone. Verify counts on the new database, then point DATABASE_URL to the new server.");
}

main()
  .catch((error) => {
    console.error("\nMigration failed:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await source.$disconnect();
    await target.$disconnect();
  });
