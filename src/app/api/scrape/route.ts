import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { scrapeUniversity, ScrapeError } from '@/lib/scrape';
import type { DegreeLevel, ScrapeResponse } from '@/types';

export const runtime = 'nodejs';

const LEVELS: DegreeLevel[] = ['bachelor', 'masters', 'phd'];

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' } satisfies ScrapeResponse, {
        status: 401,
      });
    }

    const body = await req.json().catch(() => null);
    const url = String(body?.url ?? '').trim();
    const level = String(body?.level ?? '').trim() as DegreeLevel;

    if (!url) {
      return NextResponse.json(
        { success: false, error: 'University homepage URL is required.' } satisfies ScrapeResponse,
        { status: 400 }
      );
    }
    if (!LEVELS.includes(level)) {
      return NextResponse.json(
        { success: false, error: 'Choose Bachelor, Masters or PhD.' } satisfies ScrapeResponse,
        { status: 400 }
      );
    }

    const result = await scrapeUniversity(url, level);
    return NextResponse.json({ success: true, ...result } satisfies ScrapeResponse);
  } catch (error) {
    if (error instanceof ScrapeError) {
      return NextResponse.json({ success: false, error: error.message } satisfies ScrapeResponse, {
        status: 422,
      });
    }
    console.error('POST /api/scrape error:', error);
    return NextResponse.json(
      { success: false, error: 'Scraping failed. Please try again.' } satisfies ScrapeResponse,
      { status: 500 }
    );
  }
}
