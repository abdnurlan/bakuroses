import { NextResponse } from 'next/server';
import { clearCache } from '@/lib/image-cache';

export async function POST() {
  clearCache();
  return NextResponse.json({ status: 'cleared' });
}
