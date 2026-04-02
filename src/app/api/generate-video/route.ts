import { NextRequest, NextResponse } from 'next/server';
import { fal } from '@/shared/lib/fal';

const ROSE_VIDEO_PROMPT =
  'A single light pink rose against a soft, light-themed green background. ' +
  'Continuous, one-shot. Phase 1: The rose slowly blooms from a bud to full blossom. ' +
  'Phase 2: A sudden, gentle gust of wind hits the rose, causing its delicate pink petals ' +
  'to detach and dynamically scatter outwards and towards the camera, filling the screen. ' +
  'Slow motion, high quality, 4k, hyper-detailed textures, no camera cuts.';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const prompt: string = body.prompt ?? ROSE_VIDEO_PROMPT;

    const result = await fal.subscribe('fal-ai/kling-video/v2/master/text-to-video', {
      input: {
        prompt,
        duration:        '10',
        aspect_ratio:    '16:9',
        negative_prompt: 'dark background, black background, night, indoors',
        cfg_scale:       0.5,
      },
      logs: false,
    });

    const videoUrl = getVideoUrl(result as FalVideoResult);

    if (!videoUrl) {
      throw new Error('No video URL in fal.ai response');
    }

    return NextResponse.json({ videoUrl }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[generate-video]', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
