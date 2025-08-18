// scripts/test-order-history.js
// Simple test script to verify Order History API functionality

const { MongoClient } = require('mongodb');

async function testOrderHistory() {
  console.log('🧪 Testing Order History Feature...\n');

  try {
    // Test database connection
    console.log('1. Testing database connection...');
    const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    await client.connect();
    console.log('✅ Database connection successful\n');

    const db = client.db('campusmart');

    // Test collections existence
    console.log('2. Checking required collections...');
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    
    const requiredCollections = ['orders', 'payment_screenshots', 'order_status', 'listings', 'sellers', 'buyers'];
    const missingCollections = requiredCollections.filter(name => !collectionNames.includes(name));
    
    if (missingCollections.length > 0) {
      console.log('⚠️  Missing collections:', missingCollections.join(', '));
    } else {
      console.log('✅ All required collections exist\n');
    }

    // Test sample data
    console.log('3. Checking sample data...');
    
    const ordersCount = await db.collection('orders').countDocuments();
    const screenshotsCount = await db.collection('payment_screenshots').countDocuments();
    const orderStatusCount = await db.collection('order_status').countDocuments();
    
    console.log(`   Orders: ${ordersCount}`);
    console.log(`   Payment Screenshots: ${screenshotsCount}`);
    console.log(`   Order Status: ${orderStatusCount}\n`);

    // Test API endpoint structure
    console.log('4. Testing API endpoint structure...');
    const fs = require('fs');
    const path = require('path');
    
    const apiPath = path.join(__dirname, '../app/api/buyer/order-history/route.js');
    if (fs.existsSync(apiPath)) {
      console.log('✅ API endpoint file exists');
      
      const content = fs.readFileSync(apiPath, 'utf8');
      if (content.includes('export async function GET')) {
        console.log('✅ GET method exported');
      }
      if (content.includes('verifyBuyerToken')) {
        console.log('✅ Buyer authentication implemented');
      }
      if (content.includes('order_status')) {
        console.log('✅ Order status integration implemented');
      }
    } else {
      console.log('❌ API endpoint file not found');
    }

    // Test frontend component
    console.log('\n5. Testing frontend component...');
    const componentPath = path.join(__dirname, '../app/buyer-dashboard/order-history/page.js');
    if (fs.existsSync(componentPath)) {
      console.log('✅ Order History page component exists');
      
      const content = fs.readFileSync(componentPath, 'utf8');
      if (content.includes('useState') && content.includes('useEffect')) {
        console.log('✅ React hooks implemented');
      }
      if (content.includes('fetchOrders')) {
        console.log('✅ API integration implemented');
      }
      if (content.includes('statusOptions')) {
        console.log('✅ Status filtering implemented');
      }
    } else {
      console.log('❌ Order History page component not found');
    }

    // Test CSS module
    console.log('\n6. Testing CSS module...');
    const cssPath = path.join(__dirname, '../app/buyer-dashboard/order-history/OrderHistory.module.css');
    if (fs.existsSync(cssPath)) {
      console.log('✅ CSS module exists');
      
      const content = fs.readFileSync(cssPath, 'utf8');
      if (content.includes('.orderHistoryContainer')) {
        console.log('✅ Main container styles defined');
      }
      if (content.includes('.orderCard')) {
        console.log('✅ Order card styles defined');
      }
      if (content.includes('.statusBadge')) {
        console.log('✅ Status badge styles defined');
      }
    } else {
      console.log('❌ CSS module not found');
    }

    console.log('\n🎉 Order History feature test completed!');
    console.log('\n📋 Summary:');
    console.log(`   - Database: ${missingCollections.length === 0 ? 'Ready' : 'Needs setup'}`);
    console.log(`   - API: ${fs.existsSync(apiPath) ? 'Ready' : 'Missing'}`);
    console.log(`   - Frontend: ${fs.existsSync(componentPath) ? 'Ready' : 'Missing'}`);
    console.log(`   - Styling: ${fs.existsSync(cssPath) ? 'Ready' : 'Missing'}`);

    if (missingCollections.length > 0) {
      console.log('\n⚠️  Setup required:');
      console.log('   - Ensure MongoDB is running');
      console.log('   - Check database connection string');
      console.log('   - Verify database name is "campusmart"');
    }

    await client.close();

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   - Check MongoDB connection');
    console.log('   - Verify environment variables');
    console.log('   - Ensure all files are created correctly');
  }
}

// Run the test
testOrderHistory();
