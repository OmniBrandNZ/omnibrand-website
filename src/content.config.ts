import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const portfolio = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/portfolio' }),
  schema: z.object({
    title: z.string(),
    excerpt: z.string(),
    featured: z.string(),
    images: z.array(z.string()),
    clientName: z.string(),
    clientHandle: z.string().optional(),
    clientBio: z.string(),
    clientPhoto: z.string(),
    clientCompany: z.string().optional(),
    clientLocation: z.string(),
    quote: z.string().optional(),
    order: z.number().default(0),
  }),
});

const framework = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/framework' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string(),
    tagline: z.string(),
    order: z.number(),
    accentColor: z.string().optional(),
    subcategories: z.array(z.object({
      number: z.string(),
      name: z.string(),
      oneLiner: z.string(),
      explanation: z.string(),
      topics: z.array(z.string()),
    })),
  }),
});

export const collections = { portfolio, framework };
