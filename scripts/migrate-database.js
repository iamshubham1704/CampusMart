// scripts/migrate-database.js
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function migrateDatabaseSchema() {
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    const db = client.db('campusmart');
    console.log('Connected to campusmart database');

    // Update messages collection - add isActive field
    console.log('\n1. Updating messages collection...');
    const messagesResult = await db.collection('messages').updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );
    console.log(`Updated ${messagesResult.modifiedCount} messages with isActive: true`);

    // Update conversations collection - add isActive field
    console.log('\n2. Updating conversations collection...');
    const conversationsResult = await db.collection('conversations').updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );
    console.log(`Updated ${conversationsResult.modifiedCount} conversations with isActive: true`);

    // Create indexes for better performance
    console.log('\n3. Creating indexes...');
    
    // Messages index
    try {
      await db.collection('messages').createIndex({ "isActive": 1 });
      console.log('✓ Created index on messages.isActive');
    } catch (error) {
      if (error.code === 85) { // Index already exists
        console.log('- Index on messages.isActive already exists');
      } else {
        throw error;
      }
    }

    // Conversations index
    try {
      await db.collection('conversations').createIndex({ "isActive": 1 });
      console.log('✓ Created index on conversations.isActive');
    } catch (error) {
      if (error.code === 85) { // Index already exists
        console.log('- Index on conversations.isActive already exists');
      } else {
        throw error;
      }
    }

    // Listings index
    try {
      await db.collection('listings').createIndex({ "status": 1 });
      console.log('✓ Created index on listings.status');
    } catch (error) {
      if (error.code === 85) { // Index already exists
        console.log('- Index on listings.status already exists');
      } else {
        throw error;
      }
    }

    // Check current state
    console.log('\n4. Checking current state...');
    const messagesCount = await db.collection('messages').countDocuments({ isActive: true });
    const conversationsCount = await db.collection('conversations').countDocuments({ isActive: true });
    const listingsCount = await db.collection('listings').countDocuments();

    console.log(`- Messages with isActive: true: ${messagesCount}`);
    console.log(`- Conversations with isActive: true: ${conversationsCount}`);
    console.log(`- Total listings: ${listingsCount}`);

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.close();
    console.log('MongoDB connection closed.');
  }
}

// Run the migration
migrateDatabaseSchema();