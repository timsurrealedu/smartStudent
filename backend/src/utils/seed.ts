import { prisma } from './db'

// This file is intentionally empty.
// All data is created by users through the app or imported from BinusMaya.
// To seed demo data for development, restore from git history.

async function seed() {
  console.log('Skipping seed — app uses real user data only.')
}

seed()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
