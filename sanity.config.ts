import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';
import { schemaTypes } from './sanity/schemas';

export default defineConfig({
  projectId: 'z9wmc6dq',
  dataset: 'production',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.listItem()
              .title('Site Settings')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
            S.divider(),
            ...S.documentTypeListItems().filter(
              (listItem) => !['siteSettings'].includes(listItem.getId()!)
            ),
          ]),
    }),
  ],
  schema: {
    types: schemaTypes,
  },
});
