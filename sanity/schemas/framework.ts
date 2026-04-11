import { defineField, defineType } from 'sanity';

export const framework = defineType({
  name: 'framework',
  title: 'Framework',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'order',
      title: 'Display Order',
      type: 'number',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'accentColor',
      title: 'Accent Color',
      type: 'string',
      options: {
        list: [
          { title: 'Gold', value: 'gold' },
          { title: 'Teal', value: 'teal' },
          { title: 'Coral', value: 'coral' },
          { title: 'Slate', value: 'slate' },
        ],
      },
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [{ type: 'block' }],
    }),
    defineField({
      name: 'subcategories',
      title: 'Subcategories',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            defineField({ name: 'number', title: 'Number', type: 'string' }),
            defineField({ name: 'name', title: 'Name', type: 'string' }),
            defineField({ name: 'oneLiner', title: 'One-Liner', type: 'string' }),
            defineField({ name: 'explanation', title: 'Explanation', type: 'text', rows: 4 }),
            defineField({
              name: 'topics',
              title: 'Topics',
              type: 'array',
              of: [{ type: 'string' }],
            }),
          ],
          preview: {
            select: { title: 'name', subtitle: 'number' },
          },
        },
      ],
    }),
  ],
  orderings: [
    {
      title: 'Display Order',
      name: 'orderAsc',
      by: [{ field: 'order', direction: 'asc' }],
    },
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'subtitle',
    },
  },
});
