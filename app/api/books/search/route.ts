import { NextRequest, NextResponse } from 'next/server';
import { GoogleBook } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q');
  if (!query || query.length < 2) {
    return NextResponse.json({ books: [] });
  }

  const apiKey = process.env.GOOGLE_BOOKS_API_KEY;
  const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=10${apiKey ? `&key=${apiKey}` : ''}`;

  let res: Response | null = null;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      res = await fetch(url, { cache: 'no-store' });
      if (res.ok || (res.status !== 503 && res.status !== 429)) break;
      if (attempt < 3) await new Promise(r => setTimeout(r, attempt * 300));
    } catch (err) {
      if (attempt === 3) {
        console.error('[books/search] fetch failed:', err);
        return NextResponse.json({ books: [], error: 'Network error' }, { status: 502 });
      }
      await new Promise(r => setTimeout(r, attempt * 300));
    }
  }

  if (!res || !res.ok) {
    const status = res?.status ?? 502;
    const body = await res?.text().catch(() => '') ?? '';
    console.error(`[books/search] Google Books API ${status}:`, body);
    return NextResponse.json({ books: [], error: `API error ${status}` }, { status });
  }

  const data = await res.json();
  const books: GoogleBook[] = (data.items ?? []).map((item: Record<string, unknown>) => {
    const info = item.volumeInfo as Record<string, unknown>;
    const imageLinks = info.imageLinks as Record<string, string> | undefined;
    const industryIdentifiers = info.industryIdentifiers as { type: string; identifier: string }[] | undefined;
    const isbn = industryIdentifiers?.find(
      (i) => i.type === 'ISBN_13' || i.type === 'ISBN_10'
    )?.identifier ?? null;

    return {
      id: item.id as string,
      title: (info.title as string) ?? 'Unknown Title',
      authors: (info.authors as string[]) ?? [],
      thumbnail: imageLinks?.thumbnail?.replace('http://', 'https://') ?? null,
      description: (info.description as string) ?? null,
      publisher: (info.publisher as string) ?? null,
      publishedDate: (info.publishedDate as string) ?? null,
      pageCount: (info.pageCount as number) || null,
      categories: (info.categories as string[]) ?? null,
      isbn,
      rating: (info.averageRating as number) ?? null,
    };
  });

  return NextResponse.json({ books });
}
