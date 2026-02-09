const mongoose = require('mongoose');
require('dotenv').config();

async function fixDatabase() {
  try {
    console.log('🔧 Fixing database indexes...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/hangoutz');
    console.log('✅ Connected to MongoDB');

    // Drop the problematic index
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    try {
      await usersCollection.dropIndex('firebaseUid_1');
      console.log('✅ Dropped firebaseUid index');
    } catch (error) {
      console.log('ℹ️  Index already dropped or doesn\'t exist');
    }

    // Clear all collections
    await usersCollection.deleteMany({});
    await db.collection('events').deleteMany({});
    await db.collection('conversations').deleteMany({});
    await db.collection('messages').deleteMany({});
    
    console.log('✅ Database cleared');
    console.log('🎉 Database fixed! Now run: npm run seed');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

fixDatabase();
