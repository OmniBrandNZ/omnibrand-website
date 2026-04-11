// GROQ queries for fetching Sanity content

export const portfolioQuery = `*[_type == "portfolio"] | order(order asc) {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  featured,
  images,
  body,
  clientName,
  clientHandle,
  clientBio,
  clientPhoto,
  clientCompany,
  clientLocation,
  quote,
  order
}`;

export const portfolioBySlugQuery = `*[_type == "portfolio" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  featured,
  images,
  body,
  clientName,
  clientHandle,
  clientBio,
  clientPhoto,
  clientCompany,
  clientLocation,
  quote,
  order
}`;

export const testimonialsQuery = `*[_type == "testimonial" && featured == true] | order(order asc) {
  _id,
  quote,
  author,
  role,
  photo,
  order
}`;

export const articlesQuery = `*[_type == "article"] | order(publishedAt desc) {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  featuredImage,
  author,
  publishedAt,
  categories
}`;

export const articleBySlugQuery = `*[_type == "article" && slug.current == $slug][0] {
  _id,
  title,
  "slug": slug.current,
  excerpt,
  featuredImage,
  body,
  author,
  publishedAt,
  categories
}`;

export const frameworkQuery = `*[_type == "framework"] | order(order asc) {
  _id,
  title,
  "slug": slug.current,
  subtitle,
  tagline,
  order,
  accentColor,
  body,
  subcategories
}`;

export const siteSettingsQuery = `*[_type == "siteSettings"][0] {
  siteName,
  siteDescription,
  email,
  phone,
  socialLinks
}`;
