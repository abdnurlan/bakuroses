import { NextResponse } from 'next/server';
import { fal } from '@/shared/lib/fal';
import { writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const IMAGES_DIR     = join(process.cwd(), 'public', 'images');
const FIRSTFRAME_PATH = join(IMAGES_DIR, 'hero-firstframe.jpg');

type FalImageResult = {
  data?: {
    images?: Array<{ url?: string }>;
  };
  images?: Array<{ url?: string }>;
};

function getImageUrl(result: FalImageResult): string | null {
  return result.data?.images?.[0]?.url ?? result.images?.[0]?.url ?? null;
}

export async function GET() {
  if (existsSync(FIRSTFRAME_PATH)) {
    return NextResponse.json({ status: 'exists', url: '/images/hero-firstframe.jpg' });
  }
  return NextResponse.json({ status: 'not_found' });
}

export async function POST() {
  if (existsSync(FIRSTFRAME_PATH)) {
    return NextResponse.json({ status: 'exists', url: '/images/hero-firstframe.jpg' });
  }

  try {
    const result = await fal.subscribe('fal-ai/flux-pro/v1.1', {
      input: {
        prompt:
          'A single closed pale blush-pink rose bud, perfectly centered in frame, against a seamless soft sage-green background. ' +
          'Diffused morning light from upper left, casting no harsh shadows. The bud is tightly furled, innermost petals just barely ' +
          'visible at the tip. Hyper-realistic botanical photography: visible velvet micro-texture on each petal, subtle cream-to-pink ' +
          'gradient, tiny translucent petal membranes catching the light. Extreme depth of field with gentle bokeh in background. ' +
          'Palette: blush pink, sage green, cream white. Studio quality, 8K, award-winning nature photography.',
        image_size:            'landscape_16_9',
        num_images:            1,
        enable_safety_checker: true,
      },
      logs: false,
    });

    const remoteUrl = getImageUrl(result as FalImageResult);

    if (!remoteUrl) throw new Error('No image URL');

    if (!existsSync(IMAGES_DIR)) mkdirSync(IMAGES_DIR, { recursive: true });

    const response = await fetch(remoteUrl);
    const buffer   = Buffer.from(await response.arrayBuffer());
    writeFileSync(FIRSTFRAME_PATH, buffer);

    return NextResponse.json({ status: 'saved', url: '/images/hero-firstframe.jpg' });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[generate-firstframe]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
