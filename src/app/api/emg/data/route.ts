import { NextRequest } from 'next/server';
import { getEMGData } from '@/lib/emg-data-store';

export async function GET(request: NextRequest) {
  const data = getEMGData();
  
  return new Response(JSON.stringify({
    status: 'success',
    ...data
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
