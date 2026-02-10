const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const waiters = [
    { name: "Adnan", pin: "1111" },
    { name: "Faris", pin: "2222" },
    { name: "Davud", pin: "3333" },
  ];

  for (const w of waiters) {
    const exists = await prisma.waiter.findUnique({ where: { pin: w.pin } });
    if (exists) continue;

    await prisma.waiter.create({
      data: { name: w.name, pin: w.pin, isActive: true },
    });
  }

  const all = await prisma.waiter.findMany({ orderBy: { name: "asc" } });
  console.log("Waiters in DB:");
  all.forEach((w) => console.log(w.name, "PIN:", w.pin, "ID:", w.id));
}

main()
  .catch(console.error)
  .finally(async () => prisma.$disconnect());
