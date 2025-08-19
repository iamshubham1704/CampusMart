export async function GET(request) {
  try {
    // Get the auth token from cookies
    const cookieHeader = request.headers.get('cookie');
    const cookies = cookieHeader ? Object.fromEntries(
      cookieHeader.split('; ').map(c => {
        const [key, ...rest] = c.split('=');
        return [key, rest.join('=')];
      })
    ) : {};
    
    const authToken = cookies['auth-token'];
    
    return Response.json({
      message: 'Login test endpoint',
      hasAuthCookie: !!authToken,
      cookieLength: authToken ? authToken.length : 0,
      cookiePreview: authToken ? authToken.substring(0, 20) + '...' : 'none',
      allCookies: Object.keys(cookies)
    });
  } catch (error) {
    return Response.json({
      message: 'Error in debug endpoint',
      error: error.message
    }, { status: 500 });
  }
}
