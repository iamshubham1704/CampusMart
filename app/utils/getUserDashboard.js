export const getUserDashboard = (session) => {
  if (!session?.user) return '/';
  
  return session.user.userType === 'seller' ? '/seller-dashboard' : '/buyer-dashboard';
};