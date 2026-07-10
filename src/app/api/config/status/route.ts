import { NextResponse } from 'next/server';
import { getIntegrationStatus } from '@/lib/integrations/status';

export async function GET() {
  return NextResponse.json(getIntegrationStatus());
}
