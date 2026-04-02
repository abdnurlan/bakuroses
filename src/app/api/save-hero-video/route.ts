import { NextResponse } from 'next/server';
import { fal } from '@/shared/lib/fal';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const PUBLIC_DIR  = join(process.cwd(), 'public');
const HERO_PATH   = join(PUBLIC_DIR, 'hero.mp4');

const PROMPT =
  'A single pale blush-pink garden rose against a seamless, soft sage-green background drenched in diffused morning light. ' +
  'The entire sequence is one continuous, uncut, slow-motion shot at 120fps, 4K ultra-resolution. ' +
  'Act 1 (0s–5s): The rose begins as a tight, closed bud. With organic, botanical precision, each petal slowly unfurls outward ' +
  'in sequence — the innermost petals first, then the middle layers, then the outermost — until the rose reaches full glorious bloom, ' +
  'each petal edge catching the light with hyper-detailed micro-textures: visible velvet surface, delicate translucent membranes, ' +
  'subtle pink-to-cream gradients per petal. ' +
  'Act 2 (5s–10s): A single, gentle breath of wind arrives. The fully bloomed rose sways imperceptibly for a moment. Then, one by one ' +
  '— then all at once — the petals detach in slow motion. Each petal tumbles, rotates, and drifts in three-dimensional space toward ' +
  'the camera, filling the entire frame in a cascade of blush-pink shapes. The petals catch light as they turn, showing both their inner ' +
  'and outer surfaces. The final frame is a screen completely filled with softly overlapping floating petals. ' +
  'Visual requirements: soft bokeh background, no hard shadows, pastel color palette, no dark areas, ' +
  'hyper-realistic botanical textures, light and airy mood throughout, absolutely zero camera cuts or transitions.';

type FalVideoResult = {
  data?: {
    video?: {
      url?: string;
    };
  };
  video?: {
    url?: string;
  };
};

function getVideoUrl(result: FalVideoResult): string | null {
  return result.data?.video?.url ?? result.video?.url ?? null;
}

export async function GET() {
  if (existsSync(HERO_PATH)) {
    return NextResponse.json({ status: 'exists', url: '/hero.mp4' });
  }
  return NextResponse.json({ status: 'not_found' });
}

export async function POST() {
  if (existsSync(HERO_PATH)) {
    return NextResponse.json({ status: 'exists', url: '/hero.mp4' });
  }

  if (!existsSync(PUBLIC_DIR)) {
    mkdirSync(PUBLIC_DIR, { recursive: true });
  }

  try {
    const result = await fal.subscribe('fal-ai/kling-video/v2/master/text-to-video', {
      input: {
        prompt:          PROMPT,
        duration:        '10',
        aspect_ratio:    '16:9',
        negative_prompt: 'dark background, night, artificial lighting, harsh shadows, camera cuts, transitions, black background, indoor studio, overexposed',
        cfg_scale:       0.5,
      },
      logs: false,
    });

    const remoteUrl = getVideoUrl(result as FalVideoResult);

    if (!remoteUrl) throw new Error('No video URL from FAL');

    const response = await fetch(remoteUrl);
    if (!response.ok) throw new Error('Failed to download video');

    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(HERO_PATH, buffer);

    return NextResponse.json({ status: 'saved', url: '/hero.mp4' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[save-hero-video]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
