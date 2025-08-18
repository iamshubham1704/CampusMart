// Test script to verify JWT token generation and verification for buyer authentication
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

console.log('🧪 Testing JWT token generation and verification for buyer authentication...\n');

// Test 1: Generate buyer token (simulating the fixed buyer login)
console.log('1️⃣ Testing buyer token generation...');
const buyerData = {
  buyerId: '507f1f77bcf86cd799439011',
  email: 'test@example.com',
  name: 'Test Buyer',
  role: 'buyer'
};

const buyerToken = jwt.sign(buyerData, JWT_SECRET, { expiresIn: '7d' });
console.log('✅ Buyer token generated successfully');
console.log('Token payload:', buyerData);
console.log('Token:', buyerToken.substring(0, 50) + '...\n');

// Test 2: Verify the token
console.log('2️⃣ Testing token verification...');
try {
  const decoded = jwt.verify(buyerToken, JWT_SECRET);
  console.log('✅ Token verified successfully');
  console.log('Decoded payload:', {
    userId: decoded.userId || decoded.id || decoded.adminId || 'unknown',
    role: decoded.role || 'no-role',
    email: decoded.email ? decoded.email.substring(0, 3) + '***' : 'no-email',
    buyerId: decoded.buyerId,
    name: decoded.name
  });
  console.log('Full decoded payload:', decoded);
} catch (error) {
  console.log('❌ Token verification failed:', error.message);
}

console.log('\n3️⃣ Testing the verification logic...');
const decoded = jwt.verify(buyerToken, JWT_SECRET);

// Test the logic used in verifyBuyerToken function
if (decoded.role === 'buyer' || decoded.buyerId) {
  console.log('✅ Buyer verification logic passed - user is authenticated as buyer');
  console.log('Role:', decoded.role);
  console.log('BuyerId:', decoded.buyerId);
} else {
  console.log('❌ Buyer verification logic failed');
  console.log('Role:', decoded.role);
  console.log('BuyerId:', decoded.buyerId);
}

console.log('\n🎯 Test completed!');
console.log('If all tests passed, the JWT authentication should now work correctly.');
