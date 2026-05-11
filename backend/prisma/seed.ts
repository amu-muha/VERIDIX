import { prisma } from "../src/db.js";
import bcrypt from "bcrypt";

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: { role: "admin" }, // make sure role is admin
    create: {
      email: "admin@example.com",
      name: "Admin",
      role: "admin",
      password: hashedPassword,
    },
  });

  console.log("Admin ensured:", admin);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
