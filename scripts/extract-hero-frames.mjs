import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import ffmpegPath from 'ffmpeg-static';
import { HERO_FRAME_RATE } from './hero-frame-config.mjs';

const ROOT_DIR = process.cwd();
const INPUT_PATH = join(ROOT_DIR, 'public', 'hero.mp4');
const OUTPUT_DIR = join(ROOT_DIR, 'public', 'hero-frames');

if (!ffmpegPath) {
  console.error('ffmpeg-static binary was not resolved.');
  process.exit(1);
}

if (!existsSync(INPUT_PATH)) {
  console.error(`Missing source video: ${INPUT_PATH}`);
  process.exit(1);
}

rmSync(OUTPUT_DIR, { recursive: true, force: true });
mkdirSync(OUTPUT_DIR, { recursive: true });

const outputPattern = join(OUTPUT_DIR, 'frame-%04d.webp');

const result = spawnSync(
  ffmpegPath,
  [
    '-y',
    '-i',
    INPUT_PATH,
    '-vf',
    `fps=${HERO_FRAME_RATE}`,
    '-c:v',
    'libwebp',
    '-quality',
    '82',
    '-compression_level',
    '6',
    outputPattern,
  ],
  { stdio: 'inherit' }
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

const generatedFrames = readdirSync(OUTPUT_DIR).filter((fileName) => fileName.endsWith('.webp'));
console.log(`Generated ${generatedFrames.length} hero frames in ${OUTPUT_DIR}`);
