const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

function token() {
  return crypto.randomBytes(16).toString("hex"); // 32 chars
}

async function main() {
  // create tables 1..12 if not exist
  for (let i = 1; i <= 12; i++) {
    const id = String(i);

    const existing = await prisma.table.findUnique({ where: { id } });
    if (existing) continue;

    await prisma.table.create({
      data: {
        id,
        name: `Table ${id}`,
        token: token(),
        isActive: true,
      },
    });
  }

  const tables = await prisma.table.findMany({ orderBy: { id: "asc" } });
  console.log("Tables seeded:");
  for (const t of tables) console.log(t.id, t.token);
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
