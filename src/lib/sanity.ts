import { createClient } from '@sanity/client';
import { createImageUrlBuilder } from '@sanity/image-url';
import type { SanityImageSource } from '@sanity/image-url/lib/types/types';

const projectId = import.meta.env.PUBLIC_SANITY_PROJECT_ID;
const dataset = import.meta.env.PUBLIC_SANITY_DATASET || 'production';

const isSanityConfigured = !!projectId;

export const sanityClient = isSanityConfigured
  ? createClient({
      projectId,
      dataset,
      apiVersion: '2024-01-01',
      useCdn: true,
    })
  : null;

const builder = isSanityConfigured
  ? createImageUrlBuilder({ projectId, dataset })
  : null;

export function urlFor(source: SanityImageSource) {
  if (!builder) throw new Error('Sanity is not configured');
  return builder.image(source);
}
