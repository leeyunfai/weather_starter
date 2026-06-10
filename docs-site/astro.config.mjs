import { defineConfig } from 'astro/config';
import mermaid from 'astro-mermaid';
import starlight from '@astrojs/starlight';

export default defineConfig({
  integrations: [
    mermaid(),
    starlight({
      title: 'Weather Starter Docs',
      social: [],
      sidebar: [
        {
          label: 'Guides',
          items: [
            { label: 'Getting Started', slug: 'guides/getting-started' },
            { label: 'Architecture', slug: 'guides/architecture' },
            { label: 'Theming', slug: 'guides/theming' },
            { label: 'Testing', slug: 'guides/testing' },
          ],
        },
        {
          label: 'Reference',
          items: [
            { label: 'API', slug: 'reference/api' },
            { label: 'Database', slug: 'reference/database' },
            { label: 'Environment', slug: 'reference/environment' },
          ],
        },
      ],
    }),
  ],
});
