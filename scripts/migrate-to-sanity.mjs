/**
 * Migration script: Imports existing portfolio and testimonial content into Sanity.
 *
 * Usage: node scripts/migrate-to-sanity.mjs
 *
 * Requires SANITY_API_TOKEN env var (write token).
 */
import { createClient } from '@sanity/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

// Load .env manually
const envFile = fs.readFileSync(path.join(projectRoot, '.env'), 'utf-8');
const env = {};
for (const line of envFile.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [key, ...rest] = trimmed.split('=');
  env[key.trim()] = rest.join('=').trim();
}

const client = createClient({
  projectId: env.PUBLIC_SANITY_PROJECT_ID,
  dataset: env.PUBLIC_SANITY_DATASET || 'production',
  token: env.SANITY_API_TOKEN,
  apiVersion: '2024-01-01',
  useCdn: false,
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Helper: upload image from local file with retry
async function uploadImage(filePath, retries = 3) {
  const fullPath = path.join(projectRoot, 'public', filePath);
  if (!fs.existsSync(fullPath)) {
    console.warn(`  ⚠ Image not found: ${fullPath}`);
    return null;
  }
  const imageBuffer = fs.readFileSync(fullPath);
  const filename = path.basename(filePath);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`  📷 Uploading ${filename}...`);
      const asset = await client.assets.upload('image', imageBuffer, { filename });
      await sleep(500); // rate limit buffer
      return {
        _type: 'image',
        asset: { _type: 'reference', _ref: asset._id },
      };
    } catch (err) {
      if (attempt < retries) {
        console.warn(`  ⚠ Upload failed (attempt ${attempt}/${retries}), retrying in ${attempt * 2}s...`);
        await sleep(attempt * 2000);
      } else {
        console.error(`  ❌ Failed to upload ${filename} after ${retries} attempts: ${err.message}`);
        return null;
      }
    }
  }
}

// Parse frontmatter from markdown
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { data: {}, body: '' };

  const frontmatter = match[1];
  const body = match[2].trim();
  const data = {};

  let currentKey = null;
  let currentArray = null;

  for (const line of frontmatter.split('\n')) {
    // Array item
    if (line.match(/^\s+-\s+"(.*)"$/) || line.match(/^\s+-\s+'(.*)'$/)) {
      const val = line.match(/^\s+-\s+["'](.*?)["']$/)?.[1];
      if (currentArray && val) currentArray.push(val);
      continue;
    }
    if (line.match(/^\s+-\s+(.*)$/)) {
      const val = line.match(/^\s+-\s+(.*)$/)?.[1]?.trim();
      if (currentArray && val) currentArray.push(val.replace(/^["']|["']$/g, ''));
      continue;
    }

    // Key-value
    const kvMatch = line.match(/^(\w+):\s*(.*)$/);
    if (kvMatch) {
      const [, key, rawVal] = kvMatch;
      const val = rawVal.replace(/^["']|["']$/g, '').trim();

      if (val === '') {
        // Start of array or empty value
        currentKey = key;
        currentArray = [];
        data[key] = currentArray;
      } else {
        currentKey = key;
        currentArray = null;
        // Parse numbers
        if (/^\d+$/.test(val)) {
          data[key] = parseInt(val, 10);
        } else {
          data[key] = val;
        }
      }
    }
  }

  return { data, body };
}

// Convert markdown text to Portable Text blocks
function markdownToBlocks(text) {
  if (!text) return [];
  return text.split('\n\n').filter(Boolean).map((paragraph) => ({
    _type: 'block',
    _key: Math.random().toString(36).slice(2, 10),
    style: 'normal',
    markDefs: [],
    children: [
      {
        _type: 'span',
        _key: Math.random().toString(36).slice(2, 10),
        text: paragraph.trim(),
        marks: [],
      },
    ],
  }));
}

async function migratePortfolio() {
  console.log('\n📁 Migrating Portfolio...\n');
  const portfolioDir = path.join(projectRoot, 'src', 'content', 'portfolio');

  if (!fs.existsSync(portfolioDir)) {
    console.log('  No portfolio directory found, skipping.');
    return;
  }

  const files = fs.readdirSync(portfolioDir).filter((f) => f.endsWith('.md'));

  for (const file of files) {
    const slug = file.replace('.md', '');
    const content = fs.readFileSync(path.join(portfolioDir, file), 'utf-8');
    const { data, body } = parseFrontmatter(content);

    console.log(`  Processing: ${data.title || slug}`);

    // Upload images
    const featured = data.featured ? await uploadImage(data.featured) : null;
    const clientPhoto = data.clientPhoto ? await uploadImage(data.clientPhoto) : null;

    const images = [];
    if (data.images && Array.isArray(data.images)) {
      for (const img of data.images) {
        const uploaded = await uploadImage(img);
        if (uploaded) images.push(uploaded);
      }
    }

    const doc = {
      _type: 'portfolio',
      _id: `portfolio-${slug}`,
      title: data.title,
      slug: { _type: 'slug', current: slug },
      excerpt: data.excerpt,
      ...(featured && { featured }),
      ...(images.length && { images }),
      body: markdownToBlocks(body),
      clientName: data.clientName,
      clientHandle: data.clientHandle || undefined,
      clientBio: data.clientBio,
      ...(clientPhoto && { clientPhoto }),
      clientCompany: data.clientCompany || undefined,
      clientLocation: data.clientLocation,
      quote: data.quote || undefined,
      order: data.order || 0,
    };

    await client.createOrReplace(doc);
    console.log(`  ✅ ${data.title}`);
  }
}

async function migrateTestimonials() {
  console.log('\n💬 Migrating Testimonials...\n');

  const testimonials = [
    {
      quote: "Tara has an amazing eye for colour and space and gets it just right. She took my brief and made it even better than I thought possible. She really felt into my product, and established the best way to market it to my clients. On top of that she juggled our differing time-zones with ease. I couldn't think of any better person to work with.",
      author: 'Claudia Rudolph',
      role: 'Founder at KarooFelt',
      photo: '/images/client-review-claudia-karoofelt.png',
      order: 1,
    },
    {
      quote: "I've worked with Omnibrand for years, and their work is top-notch. With great web designs and helpful consulting along the way, they've expanded my reach as an author of two books, built my audience, and brought in far more subscribers for my Substack, The Burner Files. With Tara Slade and her team, you're in good hands. You'll be taken care of.",
      author: 'Geoffrey Cain',
      role: 'Author',
      photo: '/images/brand-design-client-review-geoffrey-cain.jpg',
      order: 2,
    },
    {
      quote: "I knew Tara was the right person to work with after meeting her. She was instantly personable, easy to communicate with, and understood what I was struggling with and what my goals were. I did not doubt that she could help me build something I'm proud of sharing — and she absolutely delivered! Her care and attention has been outstanding.",
      author: 'Rachel Grosvenor',
      role: 'Author',
      photo: '/images/rachel5.jpg',
      order: 3,
    },
    {
      quote: "Tara has developed a corporate identity that really reflects the essence of the brand we wanted to create. She was intuitive, creative and patient with us. Her energy is clear and focused. We love the work she has done and we highly recommend Tara and her team at OmniBrand.",
      author: 'Tanya Brodie-Rudolph',
      role: 'Co-Founder at Enviromer',
      photo: '/images/client-testimonial-enviromer-tanya-brodie-rudolph.jpg',
      order: 4,
    },
    {
      quote: "I may have had 20 years of experience as a journalist, but when I began making the shift to start my own Substack, I felt like a disheveled mess. Thankfully, a friend told me about Tara's amazing design work at OmniBrand. One Substack package later, and I had a slick logo, an inspired color scheme and all the support I needed to feel like I was dressed for success.",
      author: 'Stephen Totilo',
      role: 'Game File',
      photo: '/images/stephen-totilo.jpg',
      order: 5,
    },
    {
      quote: "Working on this project with Tara was an absolute delight. She tailored to every aspect of my specific vision, tirelessly making all edits, revisions, and modifications I suggested as the project evolved. To have a rough inkling of what we're after gradually brought to life with incremental changes by an artist as receptive, patient, and diligent as Tara, is incredible. As a perfectionist, I was exceptionally pleased by Tara's hard work. I can't recommend her work enough!",
      author: 'Rav Arora',
      role: 'The Illusion of Consensus',
      photo: '/images/rav-arora.jpg',
      order: 6,
    },
    {
      quote: "Tara has been amazing with building our website & expanding our brand for Colors of Hope & Kings Gate Ranch. She has always been on schedule & even though she's around the world for us, it's never gotten in the way. We are honored & grateful for her amazing talent & services, and her design work is far above what we could ask for. The kindness she brings to every phone call is refreshing. Our team is honored to work with Tara and her team at OmniBrand!",
      author: 'Jo Webb',
      role: 'Founder at Kings Gate Ranch',
      photo: '/images/jo-testimonial01.jpg',
      order: 7,
    },
  ];

  for (const t of testimonials) {
    const slug = t.author.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    console.log(`  Processing: ${t.author}`);

    const photo = t.photo ? await uploadImage(t.photo) : null;

    const doc = {
      _type: 'testimonial',
      _id: `testimonial-${slug}`,
      quote: t.quote,
      author: t.author,
      role: t.role,
      ...(photo && { photo }),
      order: t.order,
      featured: true,
    };

    await client.createOrReplace(doc);
    console.log(`  ✅ ${t.author}`);
  }
}

async function main() {
  console.log('🚀 Starting content migration to Sanity...');
  console.log(`   Project: ${env.PUBLIC_SANITY_PROJECT_ID}`);
  console.log(`   Dataset: ${env.PUBLIC_SANITY_DATASET || 'production'}`);

  await migratePortfolio();
  await migrateTestimonials();

  console.log('\n✨ Migration complete!\n');
  console.log('Visit https://omnibrand-studio.sanity.studio/ to manage your content.');
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
