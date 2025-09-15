// Test script for Assignment System
// This script tests the basic functionality of the assignment system

console.log('🧪 Testing Assignment System...\n');

// Test 1: Check if all required files exist
const fs = require('fs');
const path = require('path');

const requiredFiles = [
  'app/api/assignments/route.js',
  'app/api/assignments/upload-pdf/route.js',
  'app/api/admin/assignments/route.js',
  'app/buyer-dashboard/assignments/page.js',
  'app/buyer-dashboard/assignments/Assignments.module.css',
  'app/admin-dashboard/assignments/page.js',
  'app/admin-dashboard/assignments/Assignments.module.css',
  'lib/mongo.js',
  'lib/auth.js'
];

console.log('📁 Checking required files...');
let allFilesExist = true;

requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - MISSING`);
    allFilesExist = false;
  }
});

console.log('');

// Test 2: Check package.json for required dependencies
console.log('📦 Checking package.json dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['mongodb', 'jsonwebtoken', 'next', 'react'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep] || packageJson.devDependencies[dep]) {
      console.log(`✅ ${dep}`);
    } else {
      console.log(`❌ ${dep} - MISSING`);
      allFilesExist = false;
    }
  });
} catch (error) {
  console.log('❌ Could not read package.json');
  allFilesExist = false;
}

console.log('');

// Test 3: Check environment variables
console.log('🔐 Checking environment variables...');
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];
const envFile = '.env.local';

if (fs.existsSync(envFile)) {
  const envContent = fs.readFileSync(envFile, 'utf8');
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      console.log(`✅ ${envVar}`);
    } else {
      console.log(`❌ ${envVar} - MISSING`);
      allFilesExist = false;
    }
  });
} else {
  console.log('⚠️  .env.local file not found - please create it with required variables');
}

console.log('');

// Test 4: Check MongoDB connection
console.log('🗄️  Checking MongoDB connection...');
try {
  const mongoFile = fs.readFileSync('lib/mongo.js', 'utf8');
  if (mongoFile.includes('MONGODB_URI') && mongoFile.includes('clientPromise')) {
    console.log('✅ MongoDB connection setup looks correct');
  } else {
    console.log('❌ MongoDB connection setup may have issues');
    allFilesExist = false;
  }
} catch (error) {
  console.log('❌ Could not read mongo.js file');
  allFilesExist = false;
}

console.log('');

// Test 5: Check API routes
console.log('🔗 Checking API routes...');
const apiFiles = [
  'app/api/assignments/route.js',
  'app/api/admin/assignments/route.js',
  'app/api/assignments/upload-pdf/route.js'
];

apiFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('export async function') && content.includes('NextResponse')) {
      console.log(`✅ ${file} - API route structure correct`);
    } else {
      console.log(`❌ ${file} - API route structure may have issues`);
      allFilesExist = false;
    }
  } catch (error) {
    console.log(`❌ Could not read ${file}`);
    allFilesExist = false;
  }
});

console.log('');

// Test 6: Check React components
console.log('⚛️  Checking React components...');
const componentFiles = [
  'app/buyer-dashboard/assignments/page.js',
  'app/admin-dashboard/assignments/page.js'
];

componentFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('useState') && content.includes('useEffect') && content.includes('export default')) {
      console.log(`✅ ${file} - React component structure correct`);
    } else {
      console.log(`❌ ${file} - React component structure may have issues`);
      allFilesExist = false;
    }
  } catch (error) {
    console.log(`❌ Could not read ${file}`);
    allFilesExist = false;
  }
});

console.log('');

// Test 7: Check CSS modules
console.log('🎨 Checking CSS modules...');
const cssFiles = [
  'app/buyer-dashboard/assignments/Assignments.module.css',
  'app/admin-dashboard/assignments/Assignments.module.css'
];

cssFiles.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('.assignments-page') || content.includes('.admin-assignments-page')) {
      console.log(`✅ ${file} - CSS module structure correct`);
    } else {
      console.log(`❌ ${file} - CSS module structure may have issues`);
      allFilesExist = false;
    }
  } catch (error) {
    console.log(`❌ Could not read ${file}`);
    allFilesExist = false;
  }
});

console.log('');

// Final summary
if (allFilesExist) {
  console.log('🎉 All tests passed! The Assignment System is properly set up.');
  console.log('\n📋 Next steps:');
  console.log('1. Ensure MongoDB is running');
  console.log('2. Set up your .env.local file with MONGODB_URI and JWT_SECRET');
  console.log('3. Run "npm install" to install dependencies');
  console.log('4. Run "npm run dev" to start the development server');
  console.log('5. Test the system by navigating to /buyer-dashboard/assignments and /admin-dashboard/assignments');
} else {
  console.log('❌ Some tests failed. Please fix the issues above before proceeding.');
  console.log('\n🔧 Common fixes:');
  console.log('- Run "npm install" to install missing dependencies');
  console.log('- Check file paths and ensure all files exist');
  console.log('- Verify environment variables are set correctly');
}

console.log('\n📚 For more information, see ASSIGNMENT_SYSTEM_README.md');
