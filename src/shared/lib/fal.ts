// SERVER ONLY — never import this in client components
import { fal } from '@fal-ai/client';

fal.config({
  credentials: process.env.FAL_API_KEY!,
});

export { fal };
