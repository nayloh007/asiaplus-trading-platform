const { storage } = require('./server/storage');
const bcrypt = require('bcryptjs');

async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function createAdmin() {
  try {
    const hashedPassword = await hashPassword('admin123');
    
    const adminUser = {
      username: 'admin',
      password: hashedPassword,
      email: 'admin@example.com',
      role: 'admin',
      balance: '1000000',
    };
    
    const newUser = await storage.createUser(adminUser);
    console.log('Admin user created successfully:', newUser);
  } catch (error) {
    console.error('Error creating admin user:', error);
  }
}

createAdmin();