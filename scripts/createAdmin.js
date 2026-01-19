// scripts/createAdmin.js
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // 🔥 CHANGE THIS TO YOUR EMAIL
    const userEmail = 'superadmin@taman.com';
    
    console.log(`Looking for user: ${userEmail}`);
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    });

    if (!user) {
      console.error(`\n❌ User with email "${userEmail}" not found!`);
      console.log('\n📝 Steps to fix:');
      console.log('1. Sign up at http://localhost:3000/auth/signup (or sign in with Google)');
      console.log('2. Update the email in this script');
      console.log('3. Run this script again\n');
      process.exit(1);
    }

    console.log(`✅ Found user: ${user.name} (${user.email})`);

    // Check if admin already exists
    const existingAdmin = await prisma.admin.findUnique({
      where: { userId: user.id }
    });

    if (existingAdmin) {
      console.log(`\n✅ This user is already an admin!`);
      console.log(`   Role: ${existingAdmin.role}`);
      console.log(`   Permissions: ${existingAdmin.permissions.length} total`);
      console.log(`\n💡 If you're still getting "Unauthorized", try:`);
      console.log(`   1. Sign out: http://localhost:3000/api/auth/signout`);
      console.log(`   2. Sign back in`);
      console.log(`   3. Visit: http://localhost:3000/admin/dashboard\n`);
      return;
    }

    // Create admin record with ALL permissions
    const admin = await prisma.admin.create({
      data: {
        userId: user.id,
        role: 'SUPER_ADMIN',
        permissions: [
          'view_users',
          'edit_users',
          'ban_users',
          'delete_users',
          'view_products',
          'create_products',
          'edit_products',
          'delete_products',
          'bulk_import',
          'view_reports',
          'moderate_reviews',
          'moderate_content',
          'view_analytics',
          'export_data',
          'manage_settings',
          'manage_admins',
          'view_logs',
          'manage_ai_settings',
          'view_ai_costs',
        ]
      }
    });

    console.log('\n🎉 Admin created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:       ${user.email}`);
    console.log(`👤 Name:        ${user.name}`);
    console.log(`🔑 User ID:     ${user.id}`);
    console.log(`🛡️  Admin ID:    ${admin.id}`);
    console.log(`👑 Role:        ${admin.role}`);
    console.log(`✅ Permissions: ${admin.permissions.length} granted`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    console.log('📝 Next steps:');
    console.log('1. Sign out if you\'re currently logged in');
    console.log('2. Sign back in with this email');
    console.log('3. Visit: http://localhost:3000/admin/dashboard');
    console.log('4. You should now have full admin access!\n');

  } catch (error) {
    console.error('\n❌ Error creating admin:', error.message);
    console.error('\nFull error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();