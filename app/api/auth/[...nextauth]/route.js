import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoClient } from 'mongodb';

const client = new MongoClient(process.env.MONGODB_URI);
const clientPromise = client.connect();

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.NEXTAUTH_URL,
    }),
  ],  callbacks: {
    async signIn({ user, account, profile }) {
      if (account.provider === 'google') {
        try {
          const db = (await clientPromise).db();
          
          // Check if user already exists in either collection
          const existingBuyer = await db.collection('buyers').findOne({ email: user.email });
          const existingSeller = await db.collection('sellers').findOne({ email: user.email });
          
          if (existingBuyer) {
            // Update existing buyer
            await db.collection('buyers').updateOne(
              { email: user.email },
              { $set: { updatedAt: new Date() } }
            );
          } else if (existingSeller) {
            // Update existing seller
            await db.collection('sellers').updateOne(
              { email: user.email },
              { $set: { updatedAt: new Date() } }
            );
          } else {

            await db.collection('buyers').insertOne({
              name: user.name,
              email: user.email,
              image: user.image,
              provider: 'google',
              googleId: profile.sub,
              phone: '',
              college: '',
              userType: 'buyer',
              isNewGoogleUser: true, // Flag to identify new Google users
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
          
          return true;
        } catch (error) {
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account && user) {
        try {
          const db = (await clientPromise).db();
          
          // Check both collections for the user
          let userData = await db.collection('buyers').findOne({ email: user.email });
          let userType = 'buyer';
          
          if (!userData) {
            userData = await db.collection('sellers').findOne({ email: user.email });
            userType = 'seller';
          }
          
          if (userData) {
            token.userId = userData._id.toString();
            token.phone = userData.phone || '';
            token.provider = userData.provider;
            token.userType = userType;
            token.isNewGoogleUser = userData.isNewGoogleUser || false;
            
            if (userType === 'buyer') {
              token.college = userData.college || '';
            }
          }
        } catch (error) {
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId;
        session.user.phone = token.phone;
        session.user.provider = token.provider;
        session.user.userType = token.userType;
        session.user.isNewGoogleUser = token.isNewGoogleUser;
        
        if (token.userType === 'buyer') {
          session.user.college = token.college;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return `${baseUrl}/choose-account-type`;
    },
  },
  pages: {
    error: '/auth/error',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };