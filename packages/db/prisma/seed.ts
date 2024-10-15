import { prisma } from "../index";

const projects = [
  {
    placeId: 123,
    name: "123",
  },
];

const studioId = "";

async function main() {}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
