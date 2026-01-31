import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        await prisma.$connect();
        console.log('✅ Prisma connected to database!');
        const usersCount = await prisma.user.count();
        console.log(`✅ Found ${usersCount} users in database.`);
        await prisma.$disconnect();
        process.exit(0);
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
}

main();
