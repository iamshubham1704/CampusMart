import { NextResponse } from 'next/server';

export async function GET(request, context) {
  try {
    // Per Next.js dynamic route handlers, await params
    const params = await context.params;
    const { id } = params || {};
    if (!id) {
      return NextResponse.json({ success: false, message: 'Missing id' }, { status: 400 });
    }

    const upstream = await fetch(`https://www.campusmart.store/api/listings/public/${id}`, {
      headers: { 'accept': 'application/json' },
      cache: 'no-store'
    });

    const data = await upstream.json().catch(() => null);
    const status = upstream.status || 200;

    const res = NextResponse.json(data ?? { success: false }, { status });
    res.headers.set('Access-Control-Allow-Origin', '*');
    res.headers.set('Cache-Control', 'no-store');
    return res;
  } catch (err) {
    return NextResponse.json({ success: false, message: 'Proxy failed' }, { status: 500 });
  }
}


