// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const sanityProjectId = process.env.PUBLIC_SANITY_PROJECT_ID;

const integrations = [react()];

// Only add the Sanity integration if configured
if (sanityProjectId) {
  const { default: sanity } = await import('@sanity/astro');
  integrations.unshift(
    sanity({
      projectId: sanityProjectId,
      dataset: process.env.PUBLIC_SANITY_DATASET || 'production',
      useCdn: true,
    })
  );
}

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations,
});
