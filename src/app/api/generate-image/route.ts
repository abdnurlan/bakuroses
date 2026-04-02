import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@/shared/lib/fal';
import { getCached, setCached } from '@/lib/image-cache';

const MODEL_CHAIN = [
  'fal-ai/flux-pro/v1.1-ultra',
  'fal-ai/flux-pro/v1.1',
  'fal-ai/flux/dev',
  'fal-ai/flux-realism',
];

type FalImageResult = {
  data?: {
    images?: Array<{ url?: string }>;
  };
  images?: Array<{ url?: string }>;
};

function getImageUrl(result: FalImageResult): string | null {
  return result.data?.images?.[0]?.url ?? result.images?.[0]?.url ?? null;
}

async function generateWithFallback(prompt: string, imageSize: string): Promise<string> {
  for (const model of MODEL_CHAIN) {
    try {
      const result = await fal.subscribe(model, {
        input: { prompt, image_size: imageSize, num_images: 1, enable_safety_checker: true },
        logs: false,
      });

      const url = getImageUrl(result as FalImageResult);
      if (url) return url;
    } catch {
      // try next model in chain
    }
  }
  throw new Error('All models failed');
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, imageSize = 'landscape_4_3', cacheKey } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // Check cache first
    if (cacheKey) {
      const cached = getCached(cacheKey);
      if (cached) {
        return NextResponse.json({ imageUrl: cached, fromCache: true });
      }
    }

    const enrichedPrompt = `${prompt}, soft pastel pink and sage green tones, luxury botanical photography, hyper-detailed petal textures, light and airy, no dark backgrounds, editorial quality, 8K`;
    const imageUrl = await generateWithFallback(enrichedPrompt, imageSize);

    // Save to cache
    if (cacheKey) {
      setCached(cacheKey, imageUrl, prompt);
    }

    return NextResponse.json({ imageUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[generate-image]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
