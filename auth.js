import NextAuth from 'next-auth';
import { authOptions } from './app/api/auth/[...nextauth]/route';

const handler = NextAuth(authOptions);
export const { auth, handlers, signIn, signOut } = handler;