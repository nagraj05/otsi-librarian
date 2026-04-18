import { NextRequest, NextResponse } from 'next/server';

let lastSentAt = 0;
const COOLDOWN_MS = 30_000;

export async function POST(request: NextRequest) {
  const phone = process.env.CALLMEBOT_PHONE;
  const apikey = process.env.CALLMEBOT_APIKEY;

  if (!phone || !apikey) {
    return NextResponse.json({ ok: false, error: 'WhatsApp notifications not configured' }, { status: 503 });
  }

  const now = Date.now();
  if (now - lastSentAt < COOLDOWN_MS) {
    return NextResponse.json({ ok: false, error: 'Please wait before sending another message' }, { status: 429 });
  }

  const { message } = await request.json();
  if (!message?.trim()) {
    return NextResponse.json({ ok: false, error: 'Empty message' }, { status: 400 });
  }

  const text = encodeURIComponent(`📚 [OTSI Library] ${message.trim()}`);
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${text}&apikey=${apikey}`;

  const res = await fetch(url);
  if (!res.ok) {
    return NextResponse.json({ ok: false, error: 'CallMeBot request failed' }, { status: 502 });
  }

  lastSentAt = now;
  return NextResponse.json({ ok: true });
}
