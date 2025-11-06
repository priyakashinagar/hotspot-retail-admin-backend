/**
 * Script to fix Payment Link indexes
 * This will drop ALL indexes and recreate only the necessary ones
 */

require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function fixIndexes() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        const db = mongoose.connection.db;
        const collection = db.collection('paymentlinks');

        console.log('📋 Current indexes:');
        const existingIndexes = await collection.indexes();
        existingIndexes.forEach(index => {
            console.log(`   - ${index.name}:`, JSON.stringify(index.key));
        });

        console.log('\n🗑️  Dropping all indexes except _id...');
        
        // Drop all indexes except _id (MongoDB doesn't allow dropping _id index)
        for (const index of existingIndexes) {
            if (index.name !== '_id_') {
                try {
                    await collection.dropIndex(index.name);
                    console.log(`   ✅ Dropped: ${index.name}`);
                } catch (err) {
                    console.log(`   ⚠️  Could not drop ${index.name}: ${err.message}`);
                }
            }
        }

        console.log('\n🔧 Creating new indexes...');
        
        // Create paymentLinkId index (unique, no sparse)
        await collection.createIndex(
            { paymentLinkId: 1 }, 
            { unique: true, name: 'paymentLinkId_1' }
        );
        console.log('   ✅ Created: paymentLinkId_1 (unique)');

        // Create shortUrl index (unique + sparse to allow multiple nulls)
        await collection.createIndex(
            { shortUrl: 1 }, 
            { unique: true, sparse: true, name: 'shortUrl_1' }
        );
        console.log('   ✅ Created: shortUrl_1 (unique + sparse)');

        // Create performance indexes
        await collection.createIndex(
            { customerEmail: 1 }, 
            { name: 'customerEmail_1' }
        );
        console.log('   ✅ Created: customerEmail_1');

        await collection.createIndex(
            { status: 1 }, 
            { name: 'status_1' }
        );
        console.log('   ✅ Created: status_1');

        await collection.createIndex(
            { paymentStatus: 1 }, 
            { name: 'paymentStatus_1' }
        );
        console.log('   ✅ Created: paymentStatus_1');

        await collection.createIndex(
            { createdBy: 1 }, 
            { name: 'createdBy_1' }
        );
        console.log('   ✅ Created: createdBy_1');

        await collection.createIndex(
            { createdAt: -1 }, 
            { name: 'createdAt_-1' }
        );
        console.log('   ✅ Created: createdAt_-1');

        console.log('\n📋 Final indexes:');
        const finalIndexes = await collection.indexes();
        finalIndexes.forEach(index => {
            console.log(`   - ${index.name}:`, JSON.stringify(index.key), index.unique ? '(unique)' : '', index.sparse ? '(sparse)' : '');
        });

        console.log('\n✅ Index fixing completed successfully!');
        console.log('\n🚀 Please restart your backend server now.');
        
    } catch (error) {
        console.error('\n❌ Error fixing indexes:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('\n🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

fixIndexes();
